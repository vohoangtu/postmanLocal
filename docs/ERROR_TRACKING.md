# Error Tracking Integration

Hướng dẫn tích hợp error tracking service (Sentry, LogRocket, etc.) với PostmanLocal.

## Setup

### 1. Cài đặt Error Tracking Service

Ví dụ với Sentry:

```bash
npm install @sentry/react
```

### 2. Khởi tạo trong main.tsx

```tsx
import * as Sentry from "@sentry/react";
import { errorLogger } from "./services/errorLogger";

// Khởi tạo Sentry
Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Tạo adapter cho errorLogger
const sentryAdapter: ErrorTrackingService = {
  captureException: (error, context) => {
    Sentry.captureException(error, {
      extra: context,
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

// Đăng ký với errorLogger
errorLogger.setErrorTrackingService(sentryAdapter);
```

### 3. Set User Context

Khi user đăng nhập:

```tsx
import { errorLogger } from "./services/errorLogger";

// Lấy error tracking service và set user
const service = errorLogger.getErrorTrackingService();
if (service) {
  service.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}
```

Khi user đăng xuất:

```tsx
const service = errorLogger.getErrorTrackingService();
if (service) {
  service.clearUser();
}
```

## Usage

ErrorLogger tự động gửi errors đến tracking service khi được log:

```tsx
import { errorLogger, handleError } from "./services/errorLogger";

// Tự động gửi đến tracking service
try {
  // Some code
} catch (error) {
  handleError(error, "Failed to sync collections");
  // Error được log và gửi đến Sentry
}
```

## Custom Context

Thêm custom context cho errors:

```tsx
errorLogger.logError(
  "Failed to sync",
  error,
  {
    collectionId: "col-123",
    userId: "user-456",
    action: "sync",
  }
);
```

## Disable trong Development

Error tracking chỉ hoạt động trong production:

```tsx
if (import.meta.env.PROD && errorTrackingService) {
  errorLogger.setErrorTrackingService(errorTrackingService);
}
```
