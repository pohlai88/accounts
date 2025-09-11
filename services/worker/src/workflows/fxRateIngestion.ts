import { inngest } from "../inngestClient";
import { createServiceClient, logger } from "@aibos/utils";

// V1 FX Rate Ingestion with dual sources and fallback
export const fxRateIngestion = inngest.createFunction(
  {
    id: "fx-rate-ingestion",
    name: "FX Rate Ingestion",
    retries: 3,
  },
  { event: "fx/rates.ingest" },
  async ({ event, step }) => {
    const { currencyPairs, source = "primary" } = event.data;

    // Step 1: Validate input
    const validatedPairs = await step.run("validate-currency-pairs", async () => {
      if (!currencyPairs || !Array.isArray(currencyPairs)) {
        throw new Error("Invalid currency pairs provided");
      }
      
      logger.info("FX ingestion started", {
        pairs: currencyPairs.length,
        source,
        requestId: event.id,
      });

      return currencyPairs;
    });

    // Step 2: Fetch rates from primary source
    const primaryRates = await step.run("fetch-primary-rates", async () => {
      try {
        // Simulate primary FX API call (replace with actual API)
        const rates = await fetchFromPrimarySource(validatedPairs);
        
        logger.info("Primary FX rates fetched", {
          ratesCount: rates.length,
          source: "primary",
        });

        return rates;
      } catch (error) {
        logger.error("Primary FX source failed", { error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    });

    // Step 3: Fallback to secondary source if primary fails
    const finalRates = await step.run("fetch-fallback-rates", async () => {
      if (primaryRates && primaryRates.length > 0) {
        return primaryRates;
      }

      logger.warn("Falling back to secondary FX source");
      
      try {
        const fallbackRates = await fetchFromFallbackSource(validatedPairs);
        
        logger.info("Fallback FX rates fetched", {
          ratesCount: fallbackRates.length,
          source: "fallback",
        });

        return fallbackRates.map(rate => ({ ...rate, source: "fallback" }));
      } catch (error) {
        logger.error("Both FX sources failed", { error: error instanceof Error ? error.message : String(error) });
        throw new Error("All FX rate sources unavailable");
      }
    });

    // Step 4: Store rates in database
    const storedRates = await step.run("store-fx-rates", async () => {
      const supabase = createServiceClient();
      const storedCount: any[] = [];

      for (const rate of finalRates as any[]) {
        try {
          const { error } = await supabase
            .from("fx_rates")
            .insert({
              from_currency: rate.from,
              to_currency: rate.to,
              rate: rate.rate,
              source: rate.source || source,
              valid_from: new Date().toISOString(),
              valid_to: null, // Current rate
            });

          if (error) {
            logger.error("Failed to store FX rate", {
              pair: `${rate.from}/${rate.to}`,
              error: error instanceof Error ? error.message : String(error),
            });
          } else {
            storedCount.push(rate);
          }
        } catch (error) {
          logger.error("Database error storing FX rate", {
            pair: `${rate.from}/${rate.to}`,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info("FX rates stored", {
        stored: storedCount.length,
        total: finalRates.length,
      });

      return storedCount;
    });

    // Step 5: Send completion notification
    await step.run("notify-completion", async () => {
      await inngest.send({
        name: "fx/rates.ingested",
        data: {
          ratesCount: storedRates.length,
          source: (finalRates[0] as any)?.source || source,
          timestamp: new Date().toISOString(),
        },
      });
    });

    return {
      success: true,
      ratesIngested: storedRates.length,
      source: (finalRates[0] as any)?.source || source,
    };
  }
);

// Primary FX rate source (replace with actual API)
async function fetchFromPrimarySource(pairs: string[]) {
  // Simulate API call - replace with actual implementation
  const mockRates = pairs.map(pair => {
    const [from, to] = pair.split("/");
    return {
      from,
      to,
      rate: Math.random() * 5 + 1, // Mock rate
      source: "primary",
    };
  });

  // Simulate potential failure
  if (Math.random() < 0.1) {
    throw new Error("Primary API temporarily unavailable");
  }

  return mockRates;
}

// Fallback FX rate source
async function fetchFromFallbackSource(pairs: string[]) {
  // Simulate fallback API call
  const mockRates = pairs.map(pair => {
    const [from, to] = pair.split("/");
    return {
      from,
      to,
      rate: Math.random() * 5 + 1, // Mock rate
      source: "fallback",
    };
  });

  return mockRates;
}
