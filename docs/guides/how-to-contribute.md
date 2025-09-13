# How to Contribute to Docs

## Before you PR

1. Run `pnpm docs:doctor` — all checks should pass.
2. Add new pages under the right section (`/guides`, `/api`, `/packages`).
3. If you move/rename a page, add a redirect in `docs/.vitepress/config.ts -> rewrites`.

## Writing style

- Use verb-first headings ("Create an invoice").
- One action per step; code blocks must compile (TS preferred).
- Link internal pages with relative paths; external links must pass the link checker.

## Glossary

- Add project terms to `.cspell-workspace.txt` if flagged.

## Quick Commands

```bash
# Run all doc checks
pnpm docs:doctor

# Individual checks
pnpm docs:validate:internal    # Check @aibos/* package references
pnpm docs:links:external       # Check external links
pnpm docs:lint:md              # Markdown linting
pnpm docs:lint:grammar         # Grammar checking

# Development
pnpm docs:dev                  # Start dev server
pnpm docs:build                # Build docs
```

## File Structure

```
docs/
├── guides/           # How-to guides and tutorials
├── api/             # API documentation
├── packages/        # Package-specific docs
├── .vitepress/      # VitePress configuration
└── robots.txt       # SEO configuration
```

## Adding New Content

1. **Guides**: Add to `docs/guides/` with descriptive filenames
2. **API Docs**: Add to `docs/api/` (auto-generated from TypeDoc when TS is ready)
3. **Package Docs**: Add to `docs/packages/` for each package

## Troubleshooting

- **Broken links**: Run `pnpm docs:validate:internal` to find missing references
- **Spelling errors**: Add terms to `.cspell-workspace.txt`
- **Build failures**: Check for dead links and missing files
- **Cross-platform issues**: All scripts use Node.js for consistency

## Related

- [Contributing Guide](./contributing) - General project contribution
- [Development Workflow](./development-workflow) - Development setup
- [FAQ](./faq) - Common questions
