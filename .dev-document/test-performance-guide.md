# Test Performance Guide

## Optimized Test Commands with Estimated Durations

### 🚀 Ultra-Fast Tests (< 5 seconds)

```bash
pnpm test:unit:acc:fast    # ~2-3 seconds - Contract validation only
pnpm test:error-codes      # ~1-2 seconds - Error code coverage check
```

### ⚡ Fast Tests (< 30 seconds)

```bash
pnpm test:unit:acc:core    # ~15-25 seconds - Core payment + GL posting
pnpm test:invariants       # ~10-20 seconds - Property-based tests
pnpm test:verify-fast      # ~15-30 seconds - Fast verification suite
```

### 🏃 Medium Tests (< 2 minutes)

```bash
pnpm test:unit:acc         # ~60-90 seconds - All accounting unit tests
pnpm test:verify-core       # ~45-75 seconds - Core verification suite
```

### 🐌 Slow Tests (> 5 minutes)

```bash
pnpm test:mutate:quick      # ~5-15 minutes - Mutation testing
pnpm test:robustness        # ~10-20 minutes - Full robustness suite
pnpm test:flake-hunt        # ~2-5 minutes - Flake detection (10 runs)
```

## Test File Breakdown

### Unit Tests (10 files)

- `contract-validation.test.ts` - **~1s** - Zod schema validation
- `payment-processing-enhanced.test.ts` - **~8-12s** - Core payment logic
- `gl-posting-simple.test.ts` - **~5-8s** - Journal posting
- `gl-posting.test.ts` - **~10-15s** - Complex GL scenarios
- `payment-processing.test.ts` - **~6-10s** - Basic payment processing
- `payment-processing-optimized.test.ts` - **~8-12s** - Optimized payment logic
- `payment-processing-focused.test.ts` - **~5-8s** - Focused payment tests
- `gl-posting-focused.test.ts` - **~5-8s** - Focused GL tests
- `bill-posting-simple.test.ts` - **~3-5s** - Bill posting
- `invoice-posting.test.ts` - **~5-8s** - Invoice posting

### Invariant Tests (1 file)

- `journal-balance.test.ts` - **~10-20s** - Property-based testing with fast-check

## Performance Optimization Tips

### 1. Use Targeted Commands

- **Development**: `pnpm test:unit:acc:fast` (2-3s)
- **Pre-commit**: `pnpm test:verify-fast` (15-30s)
- **CI/CD**: `pnpm test:verify-core` (45-75s)
- **Nightly**: `pnpm test:robustness` (10-20min)

### 2. Parallel Execution

- Unit tests run in parallel by default
- Invariant tests use `fast-check` with configurable `numRuns`
- Error code check is synchronous but very fast

### 3. Test Selection Strategy

```bash
# Quick smoke test
pnpm test:unit:acc:fast

# Core functionality
pnpm test:unit:acc:core

# Full accounting suite
pnpm test:unit:acc

# Complete verification
pnpm test:verify-fast
```

### 4. CI/CD Optimization

- **PR Checks**: Use `test:verify-fast` (15-30s)
- **Main Branch**: Use `test:verify-core` (45-75s)
- **Release**: Use `test:robustness` (10-20min)
- **Nightly**: Use `test:flake-hunt` (2-5min)

## Expected Performance Metrics

| Test Suite           | Duration | Tests | Purpose            |
| -------------------- | -------- | ----- | ------------------ |
| `test:unit:acc:fast` | 2-3s     | 2     | Smoke test         |
| `test:unit:acc:core` | 15-25s   | ~50   | Core functionality |
| `test:unit:acc`      | 60-90s   | ~200  | Full unit tests    |
| `test:invariants`    | 10-20s   | 9     | Property-based     |
| `test:error-codes`   | 1-2s     | N/A   | Coverage check     |
| `test:verify-fast`   | 15-30s   | ~60   | Fast verification  |
| `test:verify-core`   | 45-75s   | ~250  | Core verification  |
| `test:mutate:quick`  | 5-15min  | N/A   | Mutation testing   |
| `test:robustness`    | 10-20min | ~300+ | Full suite         |

## Troubleshooting Slow Tests

### If tests take longer than expected:

1. Check for Zod internal tests being included
2. Verify Stryker temp files are excluded
3. Ensure proper test file patterns
4. Check for hanging async operations
5. Review test dependencies and mocks

### Quick Diagnostics:

```bash
# Check what files are being tested
pnpm test:unit:acc:fast --reporter=verbose

# Profile test performance
pnpm test:unit:acc:fast --reporter=json > test-results.json
```
