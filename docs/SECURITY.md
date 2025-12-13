# Security Guide - PostmanLocal

Tài liệu này mô tả các security measures đã được implement trong PostmanLocal.

## Authentication & Authorization

### Token Management

#### Access Tokens
- **Lifetime**: 1 hour
- **Storage**: Secure storage (Tauri) hoặc localStorage (Web)
- **Refresh**: Tự động refresh khi còn < 5 phút

#### Refresh Tokens
- **Lifetime**: 30 days
- **Storage**: Secure storage
- **Usage**: Để refresh access token khi hết hạn

#### Token Refresh Flow

```typescript
// Tự động refresh khi token sắp hết hạn
if (await authService.isTokenExpired()) {
  const tokens = await authService.refreshAccessToken();
  // Use new access token
}
```

### Secure Storage

#### Tauri (Desktop)
- Sử dụng Tauri secure storage API
- Encrypted storage cho sensitive data
- Platform-specific secure storage

#### Web
- localStorage (có thể upgrade sang encrypted storage)
- Consider using httpOnly cookies cho production

### Session Management

#### Session Timeout
- Access token expires sau 1 hour
- Auto-refresh trước khi expire
- Logout khi refresh token invalid

#### Logout
- Xóa tất cả tokens
- Revoke tokens trên server
- Clear user data

## Data Security

### Encryption

#### Sensitive Data
- Passwords: Hashed với bcrypt
- API Keys: Encrypted trong storage
- Tokens: Stored securely

#### Storage Encryption
- Tauri: Platform secure storage
- Web: Consider encryption library cho sensitive data

### Input Sanitization

#### Backend Validation
```php
$request->validate([
    'email' => 'required|email|max:255',
    'password' => 'required|string|min:8',
]);
```

#### Frontend Validation
- Client-side validation
- Server-side validation (required)
- Sanitize user input trước khi display

### XSS Prevention

#### React Auto-escaping
React tự động escape content, nhưng cần cẩn thận với:

```tsx
// ✅ Đúng
<div>{userInput}</div>

// ❌ Sai - Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### Content Security Policy
- Set CSP headers trong backend
- Restrict inline scripts
- Whitelist trusted sources

### CSRF Protection

#### Laravel CSRF
- Laravel tự động protect với CSRF tokens
- Verify CSRF token cho state-changing operations

#### API Protection
- Use Sanctum tokens cho API authentication
- Tokens không bị ảnh hưởng bởi CSRF

## Network Security

### HTTPS Enforcement

#### Production
- Enforce HTTPS cho tất cả connections
- Redirect HTTP to HTTPS
- HSTS headers

#### Development
- Local development có thể dùng HTTP
- Production phải dùng HTTPS

### Certificate Validation

#### API Requests
- Validate SSL certificates
- Reject self-signed certificates trong production
- Proper certificate chain validation

### Secure WebSocket (WSS)

#### WebSocket Connections
- Use WSS (WebSocket Secure) trong production
- Validate WebSocket server certificates
- Secure WebSocket handshake

## Best Practices

### 1. Never Store Passwords in Plain Text

```php
// ✅ Đúng
$user->password = Hash::make($password);

// ❌ Sai
$user->password = $password;
```

### 2. Use Strong Passwords

- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Password strength validation

### 3. Token Security

- Short-lived access tokens
- Long-lived refresh tokens
- Secure token storage
- Token rotation

### 4. Input Validation

- Validate on client và server
- Sanitize before storage
- Escape before display

### 5. Error Messages

- Don't expose sensitive information
- Generic error messages cho users
- Detailed errors chỉ trong logs

### 6. Rate Limiting

- Implement rate limiting cho API endpoints
- Prevent brute force attacks
- Throttle requests

## Security Headers

### Recommended Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## Audit & Monitoring

### Security Logging

- Log authentication attempts
- Log authorization failures
- Log sensitive operations
- Monitor for suspicious activity

### Regular Updates

- Keep dependencies updated
- Security patches
- Vulnerability scanning

## Future Enhancements

1. **2FA**: Two-factor authentication
2. **OAuth2**: Social login support
3. **Password Reset**: Secure password reset flow
4. **Account Lockout**: Lock account sau nhiều failed attempts
5. **Security Audit Log**: Track security events
