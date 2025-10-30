# Dependency Management Guide

This document outlines the practices and tools used to maintain dependency integrity and security in the GitGenius project.

## Overview

The project maintains a strict policy on dependency management to ensure:
- **Security**: No known vulnerabilities in dependencies
- **Stability**: Reproducible builds across environments
- **Maintainability**: Up-to-date dependencies with minimal technical debt
- **Integrity**: Lockfile consistency with package.json

## Automated Security and Updates

### Dependabot

Dependabot is configured to automatically check for updates and security vulnerabilities:
- **NPM dependencies**: Monthly updates (max 3 PRs)
- **GitHub Actions**: Monthly updates (max 2 PRs)
- **Configuration**: `.github/dependabot.yml`

Dependabot groups dependencies to reduce PR noise while maintaining security.

### CI/CD Security Checks

The CI pipeline includes automated security scanning:
```yaml
- name: Security audit
  run: npm audit --audit-level=high
```

This step will **fail the build** if high or critical vulnerabilities are detected.

### Lockfile Integrity

The CI pipeline validates lockfile integrity to ensure reproducible installs:
```yaml
- name: Validate lockfile integrity
  run: npm ci --dry-run
```

This ensures `package-lock.json` is consistent with `package.json`.

## Manual Dependency Management

### Regular Audits

Perform regular dependency audits to identify issues:

```bash
# Check for security vulnerabilities
npm audit

# Check for outdated packages
npm outdated

# Check for unused dependencies
npx depcheck
```

### Updating Dependencies

When updating dependencies:

1. **Check for breaking changes**: Review changelogs and migration guides
2. **Update incrementally**: Test after each major version update
3. **Run full test suite**: Ensure all tests pass
4. **Update related dependencies**: Keep dependency groups in sync

```bash
# Update patch and minor versions
npm update

# Update to latest major versions (with caution)
npm install <package>@latest

# Verify everything works
npm run validate
```

### Adding New Dependencies

Before adding new dependencies:

1. **Evaluate necessity**: Can the functionality be implemented without it?
2. **Check security**: Use the GitHub Advisory Database
3. **Verify maintenance**: Check recent activity and issue response time
4. **Consider bundle size**: For production dependencies, check bundle impact
5. **Review license**: Ensure compatibility with project license (MIT)

```bash
# Install new dependency
npm install <package>

# Run security check
npm audit

# Run tests
npm run validate
```

## Dependency Categories

### Production Dependencies (`dependencies`)

These are required for the application to run:
- `axios`: HTTP client for AI provider APIs
- `chalk`: Terminal string styling
- `clipboardy`: Clipboard manipulation
- `commander`: CLI framework
- `conf`: Configuration management
- `dotenv`: Environment variable loading
- `inquirer`: Interactive CLI prompts
- `ora`: Terminal spinners
- `simple-git`: Git command wrapper
- `zod`: Schema validation

### Development Dependencies (`devDependencies`)

These are only needed during development and testing:
- `@eslint/js`, `eslint`, `@typescript-eslint/*`: Code linting
- `jest`, `ts-jest`, `@jest/globals`, `@types/jest`: Testing framework
- `typescript`: TypeScript compiler
- `@types/*`: TypeScript type definitions

## Current Versions

All dependencies are kept up-to-date. Check `package.json` for current versions.

Major version updates completed:
- ESLint v8 → v9 (with flat config migration)
- TypeScript ESLint v6 → v8
- Jest v29 → v30
- Commander v11 → v14
- Inquirer v9 → v12
- Ora v7 → v9
- Conf v14 → v15
- Clipboardy v4 → v5

## Troubleshooting

### Lockfile Out of Sync

If the lockfile validation fails:
```bash
npm install  # Regenerate lockfile
npm ci       # Verify it works
```

### Peer Dependency Warnings

If you see peer dependency warnings:
1. Check if the warning affects functionality
2. Install the required peer dependency if needed
3. Or adjust version ranges to satisfy the peer dependency

### Deprecation Warnings

Some deprecation warnings are from transitive dependencies (dependencies of dependencies):
- These are tracked and will be resolved when the parent packages update
- Direct deprecation warnings should be addressed immediately

## Best Practices

1. **Always use `npm ci` in CI/CD**: Ensures reproducible installs from lockfile
2. **Commit lockfile**: Always commit `package-lock.json` changes
3. **Test after updates**: Run full test suite after dependency updates
4. **Review security advisories**: Check GitHub Security Advisories tab regularly
5. **Keep Node.js updated**: Project requires Node.js >= 20.0.0
6. **Document breaking changes**: Update CHANGELOG.md for notable dependency updates

## Resources

- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Dependabot configuration](https://docs.github.com/en/code-security/dependabot)
- [GitHub Advisory Database](https://github.com/advisories)
- [npm depcheck](https://www.npmjs.com/package/depcheck)
