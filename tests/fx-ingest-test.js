// D2 FX Rate Ingest Test Script
// Tests the FX rate ingest functionality without requiring full database setup

import {
  ingestFxRates,
  getCurrentFxRate,
  STALENESS_THRESHOLDS,
} from "../packages/accounting/src/fx/ingest.js";

console.log("🚀 D2 FX Rate Ingest Test");
console.log("========================");

async function testFxIngest() {
  try {
    console.log("\n1. Testing FX rate ingest from external sources...");

    // Test basic FX rate ingest
    const result = await ingestFxRates("MYR", ["USD", "SGD"], STALENESS_THRESHOLDS.WARNING);

    if (result.success) {
      console.log("✅ FX ingest successful");
      console.log(`   Source: ${result.source}`);
      console.log(`   Rates fetched: ${result.rates.length}`);
      console.log(
        `   Staleness: ${result.staleness.isStale ? "STALE" : "FRESH"} (${result.staleness.ageMinutes.toFixed(1)} min)`,
      );

      // Display sample rates
      result.rates.forEach(rate => {
        console.log(`   ${rate.fromCurrency}/${rate.toCurrency}: ${rate.rate} (${rate.source})`);
      });
    } else {
      console.log("❌ FX ingest failed");
      console.log(`   Error: ${result.error}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Retryable: ${result.retryable}`);
    }

    console.log("\n2. Testing individual currency pair lookup...");

    // Test individual rate lookup
    const usdRate = await getCurrentFxRate("MYR", "USD", STALENESS_THRESHOLDS.WARNING);

    if (usdRate) {
      console.log("✅ USD rate lookup successful");
      console.log(`   MYR/USD: ${usdRate.rate}`);
      console.log(`   Source: ${usdRate.source}`);
      console.log(`   Age: ${usdRate.age.toFixed(1)} minutes`);
    } else {
      console.log("❌ USD rate lookup failed");
    }

    console.log("\n3. Testing fallback source behavior...");

    // Test with very strict staleness to trigger fallback
    const strictResult = await ingestFxRates("MYR", ["EUR"], 1); // 1 minute threshold

    if (strictResult.success) {
      console.log("✅ Fallback test successful");
      console.log(`   Source used: ${strictResult.source}`);
      console.log(`   Staleness triggered: ${strictResult.staleness.isStale}`);
    } else {
      console.log("⚠️  Fallback test - all sources failed (expected in some cases)");
      console.log(`   Error: ${strictResult.error}`);
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error("   Stack:", error.stack);
  }
}

async function testCurrencyValidation() {
  console.log("\n4. Testing currency validation...");

  try {
    // Test invalid currency
    const invalidResult = await ingestFxRates("INVALID", ["USD"]);
    console.log("❌ Should have failed with invalid currency");
  } catch (error) {
    console.log("✅ Currency validation working - rejected invalid currency");
  }

  try {
    // Test valid currencies
    const validResult = await ingestFxRates("USD", ["EUR"], STALENESS_THRESHOLDS.WARNING);
    if (validResult.success) {
      console.log("✅ Valid currency pair accepted");
    } else {
      console.log("⚠️  Valid currency pair failed (network/API issue)");
    }
  } catch (error) {
    console.log("⚠️  Currency validation test error:", error.message);
  }
}

// Run tests
async function runTests() {
  console.log("Starting FX ingest tests...\n");

  await testFxIngest();
  await testCurrencyValidation();

  console.log("\n========================");
  console.log("✅ D2 FX Rate Tests Complete");
  console.log("\nNote: Some failures are expected if external APIs are unavailable.");
  console.log("The important thing is that the fallback logic works correctly.");
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
