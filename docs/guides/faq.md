# Frequently Asked Questions

## General Questions

### What is AI-BOS Accounts?

AI-BOS Accounts is a modern, cloud-native accounting system built with Next.js, TypeScript, and
Supabase. It provides complete accounting workflows including AR, AP, GL, and financial reporting.

### How is it different from other accounting systems?

- **Modern Tech Stack**: Built with the latest web technologies
- **Developer-First**: Comprehensive APIs and documentation
- **Multi-tenant**: Secure, scalable, and compliant
- **Open Source**: Transparent and community-driven

## Technical Questions

### What are the system requirements?

- **Node.js**: 20.x or higher
- **pnpm**: 9.x or higher
- **Database**: PostgreSQL (via Supabase)
- **Browser**: Modern browsers with ES2020 support

### How do I set up the development environment?

See our [Development Workflow Guide](./development-workflow) for detailed setup instructions.

### How do I add a new package to the monorepo?

1. Create the package directory in `packages/`
2. Add `package.json` with proper name and dependencies
3. Update `pnpm-workspace.yaml` if needed
4. Add to TypeDoc configuration for API generation

### How do I update dependencies?

```bash
# Check for updates
pnpm deps:ncu-check

# Update external dependencies
pnpm deps:ncu-update

# Update all dependencies
pnpm deps:upgrade
```

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

- Run `pnpm install` to ensure all dependencies are installed
- Check that the package is properly linked in the workspace

#### TypeScript errors

- Run `pnpm build` to see all TypeScript errors
- Check that all imports are correct
- Ensure proper type definitions are available

#### Build failures

- Clear the build cache: `pnpm clean`
- Check for circular dependencies
- Verify all required environment variables are set

### Getting Help

- **GitHub Issues**: [Report bugs and request features](https://github.com/aibos/accounts/issues)
- **Discord**: [Join our community](https://discord.gg/aibos)
- **Email**: [Contact us](mailto:support@aibos.com)

## Contributing

### How can I contribute?

- Fix bugs and add features
- Improve documentation
- Write tests
- Report issues
- Join discussions

See our [Contributing Guide](./contributing) for detailed information.

### What should I work on?

Check our [GitHub Issues](https://github.com/aibos/accounts/issues) for open tasks and feature
requests.

## License

This project is licensed under the MIT License. See the
[LICENSE](https://github.com/aibos/accounts/blob/main/LICENSE) file for details.
