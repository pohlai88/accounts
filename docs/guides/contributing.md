# Contributing Guide

Thank you for your interest in contributing to AI-BOS Accounts! This guide will help you get
started.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 9.x or higher
- Git

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/accounts.git
   cd accounts
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development**
   ```bash
   pnpm dev
   ```

## Contribution Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Use Prettier for code formatting
- Write tests for new functionality

### Commit Messages

We use conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Add tests if applicable
4. Update documentation
5. Run all checks: `pnpm check:all`
6. Create a pull request

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @aibos/accounting test

# Run E2E tests
pnpm test:e2e
```

### Test Coverage

We maintain 95% test coverage across all packages.

## Documentation

### Updating Documentation

- Update relevant documentation when adding features
- Use clear, concise language
- Include code examples
- Follow the existing documentation structure

### API Documentation

API documentation is auto-generated from TypeScript source code using TypeDoc.

## Questions?

- **GitHub Issues**: [Report bugs and request features](https://github.com/aibos/accounts/issues)
- **Discord**: [Join our community](https://discord.gg/aibos)
- **Email**: [Contact us](mailto:support@aibos.com)

## License

By contributing, you agree that your contributions will be licensed under the same license as the
project.
