# Code Quality Guide - PostmanLocal

Tài liệu này mô tả các tools và practices để maintain code quality.

## Linting

### ESLint

ESLint được config để check code quality:

```bash
# Check linting errors
npm run lint:check

# Auto-fix linting errors
npm run lint
```

### ESLint Rules

- React best practices
- TypeScript strict mode
- No unused variables
- Prefer const over let
- No console.log (except warn/error)

## Formatting

### Prettier

Prettier được config để format code consistently:

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Prettier Config

- Semi-colons: enabled
- Single quotes: disabled (double quotes)
- Print width: 100 characters
- Tab width: 2 spaces
- Trailing commas: ES5

## Type Checking

### TypeScript

TypeScript strict mode enabled:

```bash
# Type check without building
npm run type-check
```

### TypeScript Config

- Strict mode: enabled
- No unused locals/parameters
- No implicit any
- Strict null checks

## Pre-commit Hooks

### Husky

Husky được setup để run checks trước khi commit:

- **pre-commit**: Run lint-staged (lint + format staged files)
- **pre-push**: Run type-check, lint, và tests

### Lint-staged

Chỉ lint và format files đã được staged:

- `*.{ts,tsx}`: ESLint + Prettier
- `*.{json,css,md}`: Prettier only

## Git Hooks

### Pre-commit

Tự động:
1. Lint staged files
2. Format staged files
3. Prevent commit nếu có errors

### Pre-push

Tự động:
1. Type check
2. Lint check
3. Run tests
4. Prevent push nếu có failures

## Editor Config

### .editorconfig

Consistent editor settings:
- UTF-8 encoding
- LF line endings
- 2 spaces cho JS/TS
- 4 spaces cho PHP/Rust
- Trim trailing whitespace

## Best Practices

### 1. Run Checks Before Committing

```bash
npm run lint
npm run format
npm run type-check
```

### 2. Fix Auto-fixable Issues

```bash
npm run lint  # Auto-fixes issues
npm run format  # Formats code
```

### 3. Keep Code Consistent

- Follow ESLint rules
- Use Prettier formatting
- Follow TypeScript best practices

### 4. Review Before Pushing

- Check pre-push hooks output
- Fix any type errors
- Ensure tests pass

## CI/CD Integration

### GitHub Actions

CI/CD sẽ run:
- Type checking
- Linting
- Formatting check
- Tests
- Build

## Code Review Checklist

- [ ] Code follows ESLint rules
- [ ] Code is formatted với Prettier
- [ ] No TypeScript errors
- [ ] Tests pass
- [ ] No console.log (except warn/error)
- [ ] Proper error handling
- [ ] Comments cho complex logic
