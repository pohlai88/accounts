# Dependency Management & Version Drift Prevention

## 🛡️ Protection Mechanisms

Our monorepo uses multiple layers of protection against version drift:

### 1. **Engine Enforcement**
- Node.js: `>=20.12.0 <23.0.0`
- pnpm: `>=9.0.0`
- Enforced via `.npmrc` with `engine-strict=true`

### 2. **Workspace Protocol Enforcement**
All internal `@aibos/*` packages MUST use `workspace:*`:

```json
{
  "dependencies": {
    "@aibos/contracts": "workspace:*",  // ✅ Correct
    "@aibos/contracts": "0.1.0"        // ❌ Will be caught by Syncpack
  }
}
```

### 3. **pnpm Overrides**
Critical dependencies are locked to specific versions:

```json
{
  "pnpm": {
    "overrides": {
      "react": "^18.3.1",
      "zod": "^3.23.8",
      "typescript": "^5.6.2"
    }
  }
}
```

## 🔧 Available Commands

### Dependency Health Checks
```bash
# Check for dependency inconsistencies
pnpm deps:lint

# List all dependencies
pnpm deps:list

# Show workspace dependencies only
pnpm deps:list-workspace

# Fix detected issues automatically
pnpm deps:fix

# Full health check (CI-ready)
pnpm deps:check

# Security audit
pnpm deps:audit
```

### Safe Updates
```bash
# Update all dependencies safely
pnpm deps:update

# Update specific dependency across monorepo
pnpm -w up react@^18.3.1 -L
```

## 🚨 What Syncpack Catches

### ❌ Accidental Version Hardcoding
If a developer accidentally adds:
```json
"@aibos/contracts": "0.1.0"
```
Instead of:
```json
"@aibos/contracts": "workspace:*"
```

Syncpack will detect this and fail CI with:
```
✘ @aibos/contracts workspace:* → 0.1.0 [LocalPackageMismatch]
```

### ❌ Version Inconsistencies
If different packages use different versions of the same dependency:
```
✘ react ^18.3.1 → ^18.2.0 [HighestSemverMismatch]
```

### ❌ Missing Workspace Protocol
Our configuration bans non-workspace specifiers for internal packages:
```json
{
  "label": "Internal @aibos packages MUST use workspace protocol",
  "dependencies": ["@aibos/**"],
  "specifierTypes": ["!workspace-protocol"],
  "isBanned": true
}
```

## 🎯 CI Integration

The GitHub workflow automatically checks:
1. Dependency consistency
2. Workspace protocol usage
3. No duplicate dependencies
4. Security vulnerabilities
5. Build still works after changes

## 🔄 Developer Workflow

### Before Committing
```bash
pnpm deps:lint    # Check for issues
pnpm build        # Ensure everything still works
```

### Adding New Dependencies
```bash
# Add to specific package
pnpm --filter @aibos/web add react-query

# Add to workspace root
pnpm -w add -D eslint

# Add internal dependency (always use workspace:*)
# Edit package.json manually or use:
pnpm --filter @aibos/web add @aibos/contracts@workspace:*
```

## 🛠️ Troubleshooting

### "LocalPackageMismatch" Errors
These are expected when using `workspace:*`. The error shows:
- `workspace:*` (what we want)
- `0.1.0` (actual package version)

This is correct behavior - Syncpack is confirming our workspace dependencies are properly configured.

### Fixing Version Mismatches
```bash
pnpm deps:fix     # Auto-fix what's possible
pnpm install      # Reinstall after fixes
```

### Emergency Override
If you need to temporarily bypass checks:
```bash
# Skip Syncpack in CI (not recommended)
SKIP_SYNCPACK=true pnpm build
```

## 📚 Best Practices

1. **Always use `workspace:*` for internal packages**
2. **Use pnpm overrides for critical external dependencies**
3. **Run `pnpm deps:lint` before committing**
4. **Update dependencies via workspace root with `-w` flag**
5. **Let Syncpack auto-fix when possible**

This system prevents the "works on my machine" problem and ensures consistent dependency versions across all environments.
