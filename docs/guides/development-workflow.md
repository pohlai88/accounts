# Development Workflow

This guide covers the development workflow for the AI-BOS Accounts project.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.12.0 or higher
- **pnpm** 9.0.0 or higher
- **Git** for version control
- **VS Code** (recommended) with extensions

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/aibos/accounts.git
cd accounts
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local

# Configure your environment variables
# See Environment Setup guide for details
```

### 4. Start Development

```bash
# Start all services
pnpm dev

# Or start specific services
pnpm --filter @aibos/web dev
pnpm --filter @aibos/web-api dev
```

## Development Commands

### Package Management

```bash
# Install dependencies
pnpm install

# Add new dependency to specific package
pnpm --filter @aibos/accounting add lodash

# Add dev dependency to root
pnpm add -D typescript

# Update dependencies
pnpm update
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @aibos/accounting build

# Build for production
pnpm build:prod
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @aibos/accounting test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Code Organization

### Monorepo Structure

```
packages/
├── accounting/     # Core business logic
├── auth/          # Authentication
├── contracts/     # API contracts
├── db/            # Database layer
├── tokens/        # Design tokens
├── ui/            # UI components
└── utils/         # Shared utilities

apps/
├── web/           # Next.js frontend
└── web-api/       # API routes

services/
└── worker/        # Background jobs
```

### Package Dependencies

- Use `workspace:*` for internal package dependencies
- Keep external dependencies consistent across packages
- Use peer dependencies for shared libraries

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages

We use conventional commits:

```
feat: add invoice creation functionality
fix: resolve payment processing bug
docs: update API documentation
refactor: simplify accounting calculations
```

### Pull Request Process

1. Create feature branch from `main`
2. Make your changes
3. Add tests if applicable
4. Update documentation
5. Run all checks: `pnpm check:all`
6. Create pull request
7. Request review from team members

## Code Quality

### TypeScript

- Use strict mode
- Define proper types for all functions
- Use interfaces for object shapes
- Avoid `any` type

### Testing

- Write unit tests for all business logic
- Use integration tests for API endpoints
- Maintain high test coverage (>95%)
- Use descriptive test names

### Documentation

- Document all public APIs
- Use JSDoc comments
- Keep README files updated
- Include code examples

## Debugging

### VS Code Configuration

The project includes VS Code settings for optimal development:

- TypeScript IntelliSense
- ESLint integration
- Prettier formatting
- Debug configurations

### Common Issues

1. **Dependency conflicts**: Run `pnpm dedupe`
2. **Type errors**: Check TypeScript configuration
3. **Build failures**: Clear cache with `pnpm clean`
4. **Test failures**: Check test environment setup

## Performance

### Bundle Analysis

```bash
# Analyze bundle size
pnpm analyze

# Check for duplicate dependencies
pnpm deps:list
```

### Optimization Tips

- Use dynamic imports for code splitting
- Optimize images and assets
- Minimize bundle size
- Use caching strategies

## Deployment

### Staging

```bash
# Deploy to staging
pnpm deploy:staging
```

### Production

```bash
# Deploy to production
pnpm deploy:prod
```

## Troubleshooting

### Common Problems

1. **Node version mismatch**: Use the correct Node.js version
2. **pnpm issues**: Clear pnpm cache
3. **TypeScript errors**: Check tsconfig.json
4. **Build failures**: Verify all dependencies are installed

### Getting Help

- Check the [FAQ](./faq)
- Search existing issues
- Ask in Discord
- Create a new issue

## Best Practices

1. **Keep packages focused** - Single responsibility
2. **Use TypeScript** - Type safety first
3. **Write tests** - Test-driven development
4. **Document everything** - Clear documentation
5. **Follow conventions** - Consistent code style
6. **Review code** - Peer review process
7. **Keep dependencies updated** - Security and features
