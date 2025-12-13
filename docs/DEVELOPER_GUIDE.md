# Developer Guide - PostmanLocal

Hướng dẫn chi tiết cho developers muốn contribute hoặc extend PostmanLocal.

## Setup Development Environment

### Prerequisites

1. **Node.js 18+**
   ```bash
   node --version  # Should be 18+
   ```

2. **Rust (latest stable)**
   ```bash
   rustc --version
   # Install from https://rustup.rs/
   ```

3. **Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli@latest
   ```

4. **PHP 8.2+**
   ```bash
   php --version  # Should be 8.2+
   ```

5. **Composer**
   ```bash
   composer --version
   ```

6. **MySQL/PostgreSQL** (cho backend)

### Initial Setup

#### 1. Clone Repository

```bash
git clone <repository-url>
cd postmanlocal
```

#### 2. Install Frontend Dependencies

```bash
npm install
```

#### 3. Setup Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

#### 4. Configure Database

Edit `backend/.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=postmanlocal
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### 5. Run Migrations

```bash
php artisan migrate
```

#### 6. Start Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
php artisan serve
```

**Terminal 3 - Tauri (Desktop):**
```bash
npm run tauri dev
```

## Project Structure

### Frontend (`src/`)

```
src/
├── components/          # React components
│   ├── UI/             # Reusable UI components
│   ├── RequestBuilder/ # Request building
│   ├── Collections/    # Collection management
│   └── ...
├── stores/             # Zustand stores
├── services/           # Business logic
├── hooks/              # Custom hooks
├── utils/              # Utilities
└── App.tsx             # Root component
```

### Backend (`backend/`)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/  # API controllers
│   │   └── Middleware/   # Middleware
│   ├── Models/          # Eloquent models
│   └── Services/        # Business logic
├── routes/
│   └── api.php         # API routes
├── database/
│   └── migrations/     # Database migrations
└── tests/              # Tests
```

### Tauri (`src-tauri/`)

```
src-tauri/
├── src/
│   ├── main.rs         # Tauri entry point
│   ├── commands.rs     # Tauri commands
│   ├── storage.rs      # SQLite storage
│   └── mock_server.rs  # Mock server
└── Cargo.toml          # Rust dependencies
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

- Follow code style (ESLint + Prettier)
- Write tests cho new features
- Update documentation nếu cần

### 3. Run Checks

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Tests
npm run test
```

### 4. Commit Changes

Pre-commit hooks sẽ tự động:
- Lint staged files
- Format staged files

```bash
git add .
git commit -m "feat: Add new feature"
```

### 5. Push và Create PR

```bash
git push origin feature/my-feature
```

## Code Style

### TypeScript/React

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier formatting
- Use functional components với hooks
- Memoize expensive computations

### PHP/Laravel

- Follow PSR-12 coding standards
- Use type hints
- Document complex logic
- Use Eloquent ORM
- Validate input

### Rust

- Follow Rust conventions
- Use `Result` cho error handling
- Document public APIs
- Use async/await cho I/O

## Adding New Features

### Frontend Component

1. Create component trong `src/components/`
2. Add to appropriate store nếu cần state
3. Create service nếu cần API calls
4. Add tests

Example:
```typescript
// src/components/MyFeature/MyFeature.tsx
export default function MyFeature() {
  // Component logic
}
```

### Backend API Endpoint

1. Create controller method
2. Add route trong `routes/api.php`
3. Add validation
4. Add tests

Example:
```php
// backend/app/Http/Controllers/MyController.php
public function myMethod(Request $request) {
    $request->validate([...]);
    // Logic
    return response()->json([...]);
}
```

### Tauri Command

1. Add command trong `src-tauri/src/commands.rs`
2. Register trong `main.rs`
3. Call từ frontend với `invoke()`

Example:
```rust
#[tauri::command]
pub async fn my_command(param: String) -> Result<String, String> {
    // Logic
    Ok("result".to_string())
}
```

## Testing

### Frontend Tests

```bash
# Run all tests
npm run test

# Run với UI
npm run test:ui

# Coverage
npm run test:coverage
```

### Backend Tests

```bash
cd backend
php artisan test
```

### Writing Tests

**Frontend:**
```typescript
import { describe, it, expect } from 'vitest';

describe('MyService', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

**Backend:**
```php
public function test_my_feature()
{
    $response = $this->postJson('/api/endpoint', [...]);
    $response->assertStatus(201);
}
```

## Debugging

### Frontend

- Use React DevTools
- Check browser console
- Use `console.log` (sẽ bị lint warn, nhưng OK cho debugging)

### Backend

- Use Laravel Debugbar
- Check `storage/logs/laravel.log`
- Use `dd()` hoặc `dump()` để debug

### Tauri

- Check Tauri logs trong console
- Log file: `%LOCALAPPDATA%/PostmanLocal/logs/postmanlocal.log` (Windows)

## Common Tasks

### Add New UI Component

1. Create component file
2. Export từ `src/components/UI/index.ts` nếu reusable
3. Add to design system docs

### Add New API Endpoint

1. Add controller method
2. Add route
3. Add validation
4. Add tests
5. Update API docs

### Add New Store

1. Create store file trong `src/stores/`
2. Define interface
3. Use `create<StoreInterface>()`

### Add New Service

1. Create service file trong `src/services/`
2. Export functions hoặc class
3. Add error handling
4. Add tests

## Performance Considerations

### Frontend

- Use `React.memo` cho expensive components
- Use `useMemo` cho expensive computations
- Use `useCallback` cho callbacks
- Lazy load large components
- Use virtual scrolling cho long lists

### Backend

- Use eager loading để tránh N+1 queries
- Add database indexes
- Use caching cho frequently accessed data
- Paginate large datasets

## Security Best Practices

### Frontend

- Sanitize user input
- Validate URLs
- Use secure storage cho tokens
- Never expose sensitive data

### Backend

- Validate all input
- Sanitize user input
- Use parameterized queries
- Hash passwords
- Use HTTPS trong production

## Troubleshooting

### Build Errors

**TypeScript errors:**
```bash
npm run type-check
```

**Rust errors:**
```bash
cd src-tauri
cargo check
```

### Runtime Errors

- Check browser console (frontend)
- Check Laravel logs (backend)
- Check Tauri logs (desktop)

### Database Issues

```bash
# Reset database
php artisan migrate:fresh

# Seed data
php artisan db:seed
```

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Laravel Documentation](https://laravel.com/docs)
- [Tauri Documentation](https://tauri.app)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Getting Help

- Check existing documentation
- Search issues trong repository
- Create new issue với detailed description
- Ask trong team chat
