# DOC-152: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# FX — Foreign Exchange Module

> **TL;DR**: D2 FX rate ingestion and policy management with multi-source fallback and staleness
> detection for multi-currency support.  
> **Owner**: @aibos/accounting-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- FX rate ingestion from multiple sources
- FX policy validation and enforcement
- Multi-source fallback with staleness detection
- Currency validation and ISO 4217 compliance
- Exchange rate freshness monitoring
- Malaysian bank (BNM) integration

**Does NOT**:

- Handle AP/AR posting (delegated to @aibos/accounting/src/ap and @aibos/accounting/src/ar)
- Process bank transactions (delegated to @aibos/accounting/src/bank)
- Generate financial reports (delegated to @aibos/accounting/src/reports)
- Manage period operations (delegated to @aibos/accounting/src/periods)

**Consumers**: @aibos/accounting, @aibos/web-api, external FX workflows

## 2) Quick Links

- **FX Ingestion**: `ingest.ts`
- **FX Policy**: `policy.ts`
- **Main Accounting**: `../README.md`
- **AP Module**: `../ap/README.md`
- **AR Module**: `../ar/README.md`

## 3) Getting Started

```typescript
import { ingestFxRates, getCurrentFxRate, validateFxRateFreshness } from "@aibos/accounting/fx";
import { validateFxPolicy, defaultFxPolicy } from "@aibos/accounting/fx";

// Ingest FX rates
const fxResult = await ingestFxRates("MYR", ["USD", "EUR", "GBP"]);

// Get current rate
const currentRate = await getCurrentFxRate("MYR", "USD");

// Validate FX policy
const policyResult = validateFxPolicy("MYR", "USD");
```

## 4) Architecture & Dependencies

**Dependencies**:

- Node.js fetch API for external API calls
- AbortController for request timeouts
- Environment variables for API keys

**Dependents**:

- @aibos/accounting AP/AR modules
- @aibos/web-api FX endpoints
- External FX workflow systems

**Build Order**: Independent module, can be built alongside other accounting modules

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/accounting dev
pnpm --filter @aibos/accounting test
```

**Testing**:

```bash
pnpm --filter @aibos/accounting test src/fx/
```

**Linting**:

```bash
pnpm --filter @aibos/accounting lint src/fx/
```

**Type Checking**:

```bash
pnpm --filter @aibos/accounting typecheck
```

## 6) API Surface

**Exports**:

### FX Ingestion (`ingest.ts`)

- `ingestFxRates()` - Main FX rate ingestion function
- `getCurrentFxRate()` - Get current FX rate for currency pair
- `validateFxRateFreshness()` - Validate rate freshness
- `FX_SOURCES` - Predefined FX data sources
- `STALENESS_THRESHOLDS` - Staleness threshold constants

### FX Policy (`policy.ts`)

- `validateFxPolicy()` - Validate FX policy requirements
- `defaultFxPolicy` - Default FX policy configuration
- `FxPolicy` - FX policy interface
- `FxValidationResult` - FX validation result interface

**Public Types**:

- `FxRateSource` - FX data source configuration
- `FxRateData` - FX rate data interface
- `FxIngestResult` - FX ingestion result
- `FxIngestError` - FX ingestion error
- `MatchingConfig` - Auto-matching configuration

**Configuration**:

- Multiple FX data sources with fallback
- Configurable staleness thresholds
- Retry policies and timeouts
- API key management

## 7) Performance & Monitoring

**Bundle Size**: ~12KB minified  
**Performance Budget**: <5s for FX rate ingestion, <1s for rate validation  
**Monitoring**: Axiom telemetry integration for FX operations

## 8) Security & Compliance

**Permissions**:

- FX ingestion requires 'system' or 'admin' role
- FX policy validation requires 'accountant' or 'manager' role

**Data Handling**:

- All FX rates validated and sanitized
- Secure API key management
- Rate freshness validation

**Compliance**:

- V1 compliance for FX operations
- ISO 4217 currency code validation
- Audit trail for all FX operations

## 9) Usage Examples

### Basic FX Rate Ingestion

```typescript
import { ingestFxRates, STALENESS_THRESHOLDS } from "@aibos/accounting/fx";

// Ingest FX rates for common currencies
const fxResult = await ingestFxRates(
  "MYR", // Base currency
  ["USD", "EUR", "GBP", "SGD", "JPY"], // Target currencies
  STALENESS_THRESHOLDS.WARNING, // 4 hours staleness threshold
);

if (fxResult.success) {
  console.log("FX rates ingested successfully");
  console.log("Source:", fxResult.source); // 'primary' or 'fallback'
  console.log("Rates count:", fxResult.rates.length);
  console.log("Staleness:", fxResult.staleness);

  // Process each rate
  for (const rate of fxResult.rates) {
    console.log(`${rate.fromCurrency} to ${rate.toCurrency}: ${rate.rate}`);
    console.log("Source:", rate.source);
    console.log("Timestamp:", rate.timestamp);
    console.log("Valid from:", rate.validFrom);
    console.log("Valid to:", rate.validTo);
  }
} else {
  console.error("FX ingestion failed:", fxResult.error);
  console.log("Retryable:", fxResult.retryable);
}
```

### Get Current FX Rate

```typescript
import { getCurrentFxRate, validateFxRateFreshness } from "@aibos/accounting/fx";

// Get current rate for specific currency pair
const currentRate = await getCurrentFxRate("MYR", "USD");

if (currentRate) {
  console.log("Current MYR to USD rate:", currentRate.rate);
  console.log("Source:", currentRate.source);
  console.log("Age (minutes):", currentRate.age);

  // Validate rate freshness
  const freshness = validateFxRateFreshness(
    new Date(Date.now() - currentRate.age * 60 * 1000), // Convert age back to timestamp
    STALENESS_THRESHOLDS.WARNING,
  );

  console.log("Rate is valid:", freshness.isValid);
  console.log("Age (minutes):", freshness.ageMinutes);
  console.log("Threshold (minutes):", freshness.threshold);
} else {
  console.log("No current rate available");
}
```

### FX Policy Validation

```typescript
import { validateFxPolicy, defaultFxPolicy } from "@aibos/accounting/fx";

// Validate FX policy for currency conversion
try {
  const policyResult = validateFxPolicy("MYR", "USD");

  console.log("FX policy validation result:");
  console.log("Requires FX rate:", policyResult.requiresFxRate);
  console.log("Base currency:", policyResult.baseCurrency);
  console.log("Transaction currency:", policyResult.transactionCurrency);
  console.log("Exchange rate:", policyResult.exchangeRate);

  if (policyResult.requiresFxRate) {
    console.log("FX rate required for conversion");
    // Fetch current rate using getCurrentFxRate()
  } else {
    console.log("No FX conversion needed (same currency)");
  }
} catch (error) {
  console.error("FX policy validation failed:", error.message);
  // Handle invalid currency codes or other errors
}

// Validate with invalid currency
try {
  validateFxPolicy("MYR", "INVALID");
} catch (error) {
  console.error("Invalid currency error:", error.message);
  // "Invalid currency code: INVALID. Must be 3 uppercase letters."
}
```

### Multi-Source FX Ingestion

```typescript
import { ingestFxRates, FX_SOURCES } from "@aibos/accounting/fx";

// Ingest with custom staleness threshold
const fxResult = await ingestFxRates(
  "MYR",
  ["USD", "EUR"],
  STALENESS_THRESHOLDS.CRITICAL, // 1 hour threshold
);

if (fxResult.success) {
  console.log("FX ingestion successful");
  console.log("Source used:", fxResult.source);

  if (fxResult.source === "primary") {
    console.log("Used primary source (BNM)");
  } else if (fxResult.source === "fallback") {
    console.log("Used fallback source");
  }

  // Check staleness
  if (fxResult.staleness.isStale) {
    console.warn("FX rates are stale!");
    console.log("Age (minutes):", fxResult.staleness.ageMinutes);
    console.log("Threshold (minutes):", fxResult.staleness.threshold);
  } else {
    console.log("FX rates are fresh");
  }
} else {
  console.error("All FX sources failed:", fxResult.error);
  console.log("Retryable:", fxResult.retryable);
}
```

### Custom FX Source Configuration

```typescript
import { ingestFxRates, FX_SOURCES } from "@aibos/accounting/fx";

// Check available FX sources
console.log("Available FX sources:");
for (const [key, source] of Object.entries(FX_SOURCES)) {
  console.log(`${key}: ${source.name}`);
  console.log(`  Priority: ${source.priority}`);
  console.log(`  Base URL: ${source.baseUrl}`);
  console.log(`  Timeout: ${source.timeout}ms`);
  console.log(`  Retries: ${source.retries}`);
  console.log(`  API Key: ${source.apiKey ? "Configured" : "Not configured"}`);
}

// Ingest with specific source preference
const fxResult = await ingestFxRates("MYR", ["USD", "EUR"]);

// The function will try sources in order:
// 1. BNM (primary)
// 2. ExchangeRate-API (fallback)
// 3. Fixer.io (fallback)
```

## 10) Troubleshooting

**Common Issues**:

- **API Key Missing**: Ensure FIXER_API_KEY environment variable is set
- **Network Timeout**: Check network connectivity and API availability
- **Stale Rates**: Adjust staleness thresholds or check source availability
- **Invalid Currency**: Ensure currency codes are valid ISO 4217 codes
- **Rate Parsing Error**: Check API response format and parsing logic

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_FX = "true";
```

**Logs**: Check Axiom telemetry for FX operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex FX logic

**Testing**:

- Test all FX source integrations
- Test staleness detection
- Test currency validation
- Test fallback mechanisms

**Review Process**:

- All FX operations must be validated
- API integrations must be tested
- Error handling must be comprehensive
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Accounting Package README](../README.md)
- [AP Module](../ap/README.md)
- [AR Module](../ar/README.md)
- [Bank Module](../bank/README.md)
- [Reports Module](../reports/README.md)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
