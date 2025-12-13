# Data Security Guide - PostmanLocal

Tài liệu này mô tả các measures đã được implement để bảo vệ data security.

## Input Sanitization

### Frontend Sanitization

Sử dụng `sanitize.ts` utilities:

```typescript
import { sanitizeString, sanitizeUrl, sanitizeEmail } from '@/utils/sanitize';

// Sanitize string
const safeString = sanitizeString(userInput);

// Sanitize URL
const safeUrl = sanitizeUrl(userInput) || 'default-url';

// Sanitize email
const safeEmail = sanitizeEmail(userInput) || null;
```

### Backend Sanitization

#### SanitizeInput Middleware

Middleware tự động sanitize tất cả input:

- Strip HTML tags
- Escape special characters
- Prevent XSS attacks

#### Validation Rules

Sử dụng Laravel validation với strict rules:

```php
$request->validate([
    'name' => 'required|string|max:255|regex:/^[a-zA-Z0-9\s\-_]+$/',
    'email' => 'required|email|max:255|regex:/^[^\s@]+@[^\s@]+\.[^\s@]+$/',
    'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
]);
```

## XSS Prevention

### React Auto-escaping

React tự động escape content:

```tsx
// ✅ Đúng - Auto-escaped
<div>{userInput}</div>

// ❌ Sai - Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Content Sanitization

Nếu cần render HTML, sanitize trước:

```typescript
import { sanitizeHtml } from '@/utils/sanitize';

const safeHtml = sanitizeHtml(userInput);
```

### URL Validation

Validate URLs trước khi sử dụng:

```typescript
import { sanitizeUrl } from '@/utils/sanitize';

const url = sanitizeUrl(userInput);
if (!url) {
  // Invalid URL
}
```

## CSRF Protection

### Laravel CSRF

Laravel tự động protect với CSRF tokens:

- Verify CSRF token cho state-changing operations
- API routes sử dụng Sanctum tokens (không cần CSRF)

### API Protection

- Sanctum tokens cho API authentication
- Tokens không bị ảnh hưởng bởi CSRF
- Secure token storage

## Security Headers

### SecurityHeaders Middleware

Middleware tự động thêm security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (production only)
- `Content-Security-Policy`

### Content Security Policy

CSP được config để:
- Restrict script sources
- Prevent inline scripts (với exceptions)
- Whitelist trusted sources

## Password Security

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- (Optional) Special characters

### Password Hashing

```php
// ✅ Đúng
$user->password = Hash::make($password);

// ❌ Sai
$user->password = $password;
```

## SQL Injection Prevention

### Eloquent ORM

Laravel Eloquent tự động protect:

```php
// ✅ Đúng - Parameterized queries
User::where('email', $email)->first();

// ❌ Sai - SQL injection risk
DB::raw("SELECT * FROM users WHERE email = '$email'");
```

### Query Builder

Sử dụng parameterized queries:

```php
DB::table('users')
    ->where('email', $email)
    ->where('status', $status)
    ->get();
```

## Best Practices

### 1. Always Validate Input

- Client-side validation (UX)
- Server-side validation (Security) - **Required**

### 2. Sanitize Before Storage

- Sanitize user input trước khi lưu vào database
- Escape special characters
- Strip dangerous HTML tags

### 3. Escape Before Display

- Escape HTML entities khi display user content
- Use React's auto-escaping
- Sanitize nếu cần render HTML

### 4. Use Parameterized Queries

- Never concatenate user input vào SQL queries
- Use Eloquent ORM hoặc Query Builder
- Use prepared statements

### 5. Limit Input Length

- Set max length cho text inputs
- Validate file sizes
- Limit array sizes

### 6. Validate File Uploads

- Check file types
- Validate file sizes
- Scan for malware (nếu có thể)
- Store files outside web root

### 7. Rate Limiting

- Implement rate limiting cho API endpoints
- Prevent brute force attacks
- Throttle requests

## Security Checklist

- [x] Input sanitization (frontend & backend)
- [x] XSS prevention
- [x] CSRF protection
- [x] Security headers
- [x] Password hashing
- [x] SQL injection prevention
- [x] Input validation
- [x] URL validation
- [x] Email validation
- [ ] File upload validation (TODO)
- [ ] Rate limiting (TODO)
- [ ] Security audit logging (TODO)
