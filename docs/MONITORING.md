# Monitoring & Error Tracking Guide - PostmanLocal

Hướng dẫn setup và sử dụng error tracking và monitoring.

## Error Tracking với Sentry

### Setup Sentry

#### 1. Install Dependencies

```bash
npm install @sentry/react
```

#### 2. Initialize trong main.tsx

```typescript
import * as Sentry from "@sentry/react";
import { errorLogger } from "./services/errorLogger";

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/api\.postmanlocal\.com/],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Create Sentry adapter
const sentryAdapter: ErrorTrackingService = {
  captureException: (error, context) => {
    Sentry.captureException(error, {
      extra: context,
      tags: {
        component: context?.component || "unknown",
      },
    });
  },
  captureMessage: (message, level, context) => {
    Sentry.captureMessage(message, {
      level: level || "error",
      extra: context,
    });
  },
  setUser: (user) => {
    Sentry.setUser(user);
  },
  clearUser: () => {
    Sentry.setUser(null);
  },
  setContext: (key, value) => {
    Sentry.setContext(key, value);
  },
};

// Register với errorLogger
if (import.meta.env.PROD) {
  errorLogger.setErrorTrackingService(sentryAdapter);
}
```

#### 3. Environment Variables

Thêm vào `.env`:
```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Usage

ErrorLogger tự động gửi errors đến Sentry:

```typescript
import { handleError } from "./services/errorLogger";

try {
  // Some code
} catch (error) {
  handleError(error, "Failed to sync collections", {
    collectionId: "col-123",
    userId: "user-456",
  });
  // Error được tự động gửi đến Sentry
}
```

### Set User Context

Khi user đăng nhập:

```typescript
import { authService } from "./services/authService";
import { errorLogger } from "./services/errorLogger";

const user = await authService.getUser();
const service = errorLogger.getErrorTrackingService();
if (service && user) {
  service.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}
```

Khi user đăng xuất:

```typescript
const service = errorLogger.getErrorTrackingService();
if (service) {
  service.clearUser();
}
```

## Performance Monitoring

### Frontend Performance

Sử dụng React DevTools Profiler và Chrome DevTools:

- **React Profiler**: Identify slow components
- **Chrome Performance**: Analyze runtime performance
- **Lighthouse**: Audit performance metrics

### Backend Performance

#### Query Monitoring

Enable query logging trong development:

```php
// config/database.php
'connections' => [
    'mysql' => [
        'options' => [
            PDO::ATTR_EMULATE_PREPARES => true,
        ],
    ],
],
```

#### Slow Query Log

Enable MySQL slow query log:

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

### Tauri Performance

Monitor Tauri performance:

- Check logs trong `%LOCALAPPDATA%/PostmanLocal/logs/`
- Use Rust profiling tools
- Monitor memory usage

## Logging

### Frontend Logging

ErrorLogger tự động log errors:

```typescript
errorLogger.logError("Error message", error, {
  context: "additional info",
});
```

### Backend Logging

Laravel logging:

```php
Log::error('Error message', [
    'context' => 'additional info',
]);
```

Logs được lưu trong `storage/logs/laravel.log`

### Tauri Logging

Rust logging với `log` và `simplelog`:

```rust
use log::{error, info, warn};

info!("Information message");
warn!("Warning message");
error!("Error message");
```

## Metrics

### Key Metrics

- **Error Rate**: Số lượng errors per time period
- **Response Time**: API response times
- **Request Count**: Số lượng requests
- **User Activity**: Active users, features used

### Custom Metrics

Có thể thêm custom metrics:

```typescript
// Track feature usage
errorLogger.getErrorTrackingService()?.setContext("feature_used", "collection_sync");
```

## Alerting

### Sentry Alerts

Setup alerts trong Sentry dashboard:

1. **Error Rate Alert**: Alert khi error rate > threshold
2. **New Issue Alert**: Alert khi có issue mới
3. **Performance Alert**: Alert khi performance degrade

### Custom Alerts

Có thể setup custom alerts:

```typescript
// Track critical errors
if (error.isCritical) {
  // Send notification
  // Email/Slack notification
}
```

## Best Practices

### 1. Don't Log Sensitive Data

```typescript
// ❌ Sai
errorLogger.logError("Error", error, {
  password: userPassword,
  token: authToken,
});

// ✅ Đúng
errorLogger.logError("Error", error, {
  userId: user.id,
  // Không log sensitive data
});
```

### 2. Add Context

Luôn thêm context để debug dễ hơn:

```typescript
errorLogger.logError("Sync failed", error, {
  collectionId: collection.id,
  userId: user.id,
  action: "sync",
  timestamp: new Date().toISOString(),
});
```

### 3. Use Appropriate Log Levels

- **Error**: Errors cần attention
- **Warning**: Warnings nhưng không critical
- **Info**: Informational messages

### 4. Monitor Production

- Enable error tracking trong production
- Disable trong development (hoặc use separate project)
- Monitor error rates và trends

## Dashboard

### Sentry Dashboard

Sentry cung cấp:
- Error tracking dashboard
- Performance monitoring
- Release tracking
- User feedback

### Custom Dashboard

Có thể tạo custom dashboard để track:
- API response times
- Error rates
- User activity
- Feature usage

## Future Enhancements

1. **APM**: Application Performance Monitoring
2. **Real User Monitoring**: Track real user performance
3. **Custom Metrics**: Business metrics tracking
4. **Alerting**: Email/Slack notifications
5. **Analytics**: User behavior analytics
