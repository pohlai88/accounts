// D2 FX Rate Ingest Job - Automated Currency Rate Updates via Inngest
import { inngest } from "./inngestClient";
import { ingestFxRates, STALENESS_THRESHOLDS, type FxRateData } from "@aibos/accounting";
import { insertFxRates, getFxRatesStaleness } from "./fx-storage";

// FX rate ingest job - runs every 4 hours
export const fxRateIngestJob = inngest.createFunction(
  {
    id: "fx-rate-ingest",
    name: "FX Rate Ingest Job",
    retries: 3,
  },
  { cron: "0 */4 * * *" }, // Every 4 hours
  async ({ event: _event, step }) => {
    // Step 1: Check current FX rate staleness
    const stalenessCheck = await step.run("check-staleness", async () => {
      const staleness = await getFxRatesStaleness();

      return {
        needsUpdate: staleness.isStale || staleness.ageMinutes > STALENESS_THRESHOLDS.WARNING,
        currentAge: staleness.ageMinutes,
        threshold: STALENESS_THRESHOLDS.WARNING,
      };
    });

    if (!stalenessCheck.needsUpdate) {
      return {
        success: true,
        message: "FX rates are fresh, no update needed",
        ageMinutes: stalenessCheck.currentAge,
      };
    }

    // Step 2: Ingest FX rates from external sources
    const ingestResult = await step.run("ingest-fx-rates", async () => {
      const baseCurrency = "MYR";
      const targetCurrencies = [
        // SEA currencies
        "SGD",
        "THB",
        "VND",
        "IDR",
        "PHP",
        // Major trading currencies
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CHF",
        "CNY",
        // Regional currencies
        "HKD",
        "TWD",
        "KRW",
        "INR",
      ];

      const result = await ingestFxRates(
        baseCurrency,
        targetCurrencies,
        STALENESS_THRESHOLDS.WARNING,
      );

      if (!result.success) {
        throw new Error(`FX ingest failed: ${(result as any).error}`);
      }

      return {
        rates: result.rates.map(rate => ({
          ...rate,
          timestamp: rate.timestamp.toISOString(),
          validFrom: rate.validFrom.toISOString(),
          validTo: rate.validTo?.toISOString(),
        })),
        source: result.source,
        staleness: result.staleness,
        rateCount: result.rates.length,
      };
    });

    // Step 3: Store FX rates in database
    const storageResult = await step.run("store-fx-rates", async () => {
      // Convert serialized dates back to Date objects
      const ratesWithDates: FxRateData[] = ingestResult.rates.map(rate => ({
        ...rate,
        timestamp: new Date(rate.timestamp),
        validFrom: new Date(rate.validFrom),
        validTo: rate.validTo ? new Date(rate.validTo) : undefined,
      }));

      const storedCount = await insertFxRates(ratesWithDates);

      return {
        storedCount,
        totalRates: ingestResult.rates.length,
      };
    });

    // Step 4: Validate stored rates
    const validationResult = await step.run("validate-stored-rates", async () => {
      // Convert serialized dates back to Date objects for validation
      const ratesWithDates: FxRateData[] = ingestResult.rates.map(rate => ({
        ...rate,
        timestamp: new Date(rate.timestamp),
        validFrom: new Date(rate.validFrom),
        validTo: rate.validTo ? new Date(rate.validTo) : undefined,
      }));

      const validation = await validateStoredRates(ratesWithDates);

      if (!validation.isValid) {
        throw new Error(`FX rate validation failed: ${validation.errors.join(", ")}`);
      }

      return validation;
    });

    // Step 5: Send notification if using fallback source
    if (ingestResult.source === "fallback") {
      await step.run("notify-fallback-source", async () => {
        await sendFallbackNotification(ingestResult);
      });
    }

    return {
      success: true,
      message: "FX rates updated successfully",
      source: ingestResult.source,
      ratesIngested: ingestResult.rateCount,
      ratesStored: storageResult.storedCount,
      staleness: ingestResult.staleness,
      validation: validationResult,
    };
  },
);

// Manual FX rate ingest trigger
export const fxRateIngestManual = inngest.createFunction(
  {
    id: "fx-rate-ingest-manual",
    name: "Manual FX Rate Ingest",
    retries: 2,
  },
  { event: "fx/ingest.manual" },
  async ({ event, step }) => {
    const { baseCurrency = "MYR", targetCurrencies, forceUpdate = false } = event.data;

    // Step 1: Check if update is needed (unless forced)
    if (!forceUpdate) {
      const stalenessCheck = await step.run("check-staleness", async () => {
        const staleness = await getFxRatesStaleness();
        return {
          needsUpdate: staleness.isStale || staleness.ageMinutes > STALENESS_THRESHOLDS.ACCEPTABLE,
          currentAge: staleness.ageMinutes,
        };
      });

      if (!stalenessCheck.needsUpdate) {
        return {
          success: true,
          message: "FX rates are acceptable, use forceUpdate=true to override",
          ageMinutes: stalenessCheck.currentAge,
        };
      }
    }

    // Step 2: Ingest rates
    const ingestResult = await step.run("ingest-fx-rates", async () => {
      const result = await ingestFxRates(
        baseCurrency,
        targetCurrencies || ["USD", "EUR", "GBP", "SGD", "JPY"],
        STALENESS_THRESHOLDS.CRITICAL,
      );

      if (!result.success) {
        throw new Error(`Manual FX ingest failed: ${(result as any).error}`);
      }

      return {
        ...result,
        rates: result.rates.map(rate => ({
          ...rate,
          timestamp: rate.timestamp.toISOString(),
          validFrom: rate.validFrom.toISOString(),
          validTo: rate.validTo?.toISOString(),
        })),
      };
    });

    // Step 3: Store rates
    const storageResult = await step.run("store-fx-rates", async () => {
      // Convert serialized dates back to Date objects
      const ratesWithDates: FxRateData[] = ingestResult.rates.map(rate => ({
        ...rate,
        timestamp: new Date(rate.timestamp),
        validFrom: new Date(rate.validFrom),
        validTo: rate.validTo ? new Date(rate.validTo) : undefined,
      }));

      const storedCount = await insertFxRates(ratesWithDates);
      return { storedCount };
    });

    return {
      success: true,
      message: "Manual FX rate ingest completed",
      source: ingestResult.source,
      ratesIngested: ingestResult.rates.length,
      ratesStored: storageResult.storedCount,
      staleness: ingestResult.staleness,
    };
  },
);

// FX rate staleness alert
export const fxRateStalnessAlert = inngest.createFunction(
  {
    id: "fx-rate-staleness-alert",
    name: "FX Rate Staleness Alert",
    retries: 1,
  },
  { cron: "0 9,17 * * *" }, // 9 AM and 5 PM daily
  async ({ event: _event, step }) => {
    const stalenessCheck = await step.run("check-staleness", async () => {
      const staleness = await getFxRatesStaleness();

      return {
        isStale: staleness.isStale,
        ageMinutes: staleness.ageMinutes,
        threshold: STALENESS_THRESHOLDS.CRITICAL,
        needsAlert: staleness.ageMinutes > STALENESS_THRESHOLDS.CRITICAL,
      };
    });

    if (stalenessCheck.needsAlert) {
      await step.run("send-staleness-alert", async () => {
        await sendStalnessAlert(stalenessCheck);
      });

      return {
        alertSent: true,
        ageMinutes: stalenessCheck.ageMinutes,
        threshold: stalenessCheck.threshold,
      };
    }

    return {
      alertSent: false,
      message: "FX rates are fresh, no alert needed",
      ageMinutes: stalenessCheck.ageMinutes,
    };
  },
);

// Helper functions

async function validateStoredRates(rates: FxRateData[]): Promise<{
  isValid: boolean;
  errors: string[];
  validCount: number;
  totalCount: number;
}> {
  const errors: string[] = [];
  let validCount = 0;

  for (const rate of rates) {
    // Validate rate value
    if (rate.rate <= 0) {
      errors.push(`Invalid rate for ${rate.fromCurrency}/${rate.toCurrency}: ${rate.rate}`);
      continue;
    }

    // Validate currency codes
    if (rate.fromCurrency.length !== 3 || rate.toCurrency.length !== 3) {
      errors.push(`Invalid currency codes: ${rate.fromCurrency}/${rate.toCurrency}`);
      continue;
    }

    // Validate timestamp
    if (rate.timestamp > new Date()) {
      errors.push(`Future timestamp for ${rate.fromCurrency}/${rate.toCurrency}`);
      continue;
    }

    validCount++;
  }

  return {
    isValid: errors.length === 0,
    errors,
    validCount,
    totalCount: rates.length,
  };
}

async function sendFallbackNotification(ingestResult: any): Promise<void> {
  // TODO: Implement notification service
  console.warn("FX rates ingested from fallback source:", {
    source: ingestResult.source,
    rateCount: ingestResult.rateCount,
    staleness: ingestResult.staleness,
  });
}

async function sendStalnessAlert(stalenessCheck: any): Promise<void> {
  // TODO: Implement alert service
  console.error("FX rates are stale:", {
    ageMinutes: stalenessCheck.ageMinutes,
    threshold: stalenessCheck.threshold,
    needsUpdate: true,
  });
}
