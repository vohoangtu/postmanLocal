# Architecture Documentation - PostmanLocal

Tài liệu này mô tả kiến trúc tổng thể của PostmanLocal.

## Tổng quan

PostmanLocal là một desktop application được xây dựng với kiến trúc 3-layer:

1. **Frontend Layer**: React + TypeScript (UI)
2. **Desktop Backend Layer**: Rust + Tauri (Local operations)
3. **Cloud Backend Layer**: PHP Laravel (Cloud sync & collaboration)

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Components  │  │   Stores     │  │   Services  │  │
│  │   (UI)       │  │  (Zustand)   │  │  (API calls) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                        │                    │
                        │                    │
        ┌───────────────┘                    └───────────────┐
        │                                                  │
┌───────▼────────┐                              ┌──────────▼────────┐
│ Tauri (Rust)   │                              │ Laravel Backend  │
│                │                              │                   │
│ - Storage      │                              │ - API Endpoints   │
│ - HTTP Client  │                              │ - Authentication  │
│ - Mock Server  │                              │ - Database        │
│ - File I/O     │                              │ - WebSockets      │
└────────────────┘                              └───────────────────┘
        │                                                  │
        └──────────────────┬───────────────────────────────┘
                          │
                  ┌───────▼────────┐
                  │   SQLite DB    │
                  │   (Local)      │
                  └────────────────┘
```

## Frontend Architecture

### Component Structure

```
src/
├── components/          # UI Components
│   ├── UI/             # Reusable UI components (Button, Input, Modal, etc.)
│   ├── RequestBuilder/ # Request building components
│   ├── Collections/    # Collection management
│   ├── Navigation/     # Navigation components
│   └── ...
├── stores/             # Zustand state management
│   ├── tabStore.ts     # Tab management
│   ├── collectionStore.ts
│   ├── environmentStore.ts
│   └── ...
├── services/           # Business logic & API calls
│   ├── apiService.ts   # HTTP request execution
│   ├── syncService.ts  # Cloud sync
│   ├── authService.ts  # Authentication
│   └── ...
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── App.tsx             # Root component
```

### State Management

Sử dụng **Zustand** cho state management:

- **tabStore**: Quản lý open tabs
- **collectionStore**: Collections và requests
- **environmentStore**: Environment variables
- **panelStore**: UI panel states
- **requestHistoryStore**: Request history
- **workspaceStore**: Workspaces và team members

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Service Call (API/Tauri)
    ↓
Store Update (Zustand)
    ↓
Component Re-render
```

## Tauri Desktop Backend

### Commands

Tauri commands được expose từ Rust backend:

- `execute_request`: Execute HTTP request
- `save_request`: Save request to local storage
- `load_collections`: Load collections from SQLite
- `start_mock_server`: Start mock HTTP server
- `stop_mock_server`: Stop mock server
- `sync_to_cloud`: Sync data to cloud

### Storage

- **SQLite Database**: Local data storage
- **File System**: Store collections, schemas
- **Secure Storage**: Tokens và sensitive data

### Mock Server

- Built với **Axum** HTTP server
- Chạy trong background thread
- Support các HTTP methods
- CORS enabled

## Laravel Backend

### API Structure

```
/api
├── /auth              # Authentication
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   └── POST /logout
├── /collections       # Collections CRUD
├── /environments      # Environments
├── /schemas          # API Schemas
├── /workspaces       # Workspaces
├── /sync             # Sync operations
└── ...
```

### Database Schema

- **users**: User accounts
- **collections**: Collections
- **collection_shares**: Collection sharing
- **collection_versions**: Version history
- **workspaces**: Workspaces
- **team_members**: Team members
- **comments**: Comments on collections
- **annotations**: Annotations on requests
- **notifications**: User notifications
- **activity_logs**: Activity tracking

### Authentication

- **Laravel Sanctum**: Token-based authentication
- **Access Tokens**: 1 hour expiry
- **Refresh Tokens**: 30 days expiry
- **Auto-refresh**: Frontend tự động refresh tokens

## Communication Flow

### Local Operations (Tauri)

```
Frontend → Tauri Command → Rust Backend → SQLite → Response
```

### Cloud Sync

```
Frontend → syncService → Laravel API → MySQL/PostgreSQL → Response
```

### Request Execution

```
Frontend → apiService → {
    Web: fetch() API
    Tauri: execute_request command → Rust HTTP client
}
```

## Key Design Decisions

### 1. Platform Detection

```typescript
const IS_TAURI = typeof window !== 'undefined' && '__TAURI__' in window;
```

Sử dụng để:
- Chọn implementation (Tauri vs Web)
- Enable/disable features (Mock Server chỉ trên Tauri)
- Storage strategy (Secure storage vs localStorage)

### 2. State Management

**Zustand** được chọn vì:
- Lightweight
- TypeScript support tốt
- Simple API
- No boilerplate

### 3. Code Splitting

- Lazy load large components
- Manual chunks trong Vite config
- Route-based splitting

### 4. Error Handling

- Centralized error logging
- Error boundaries cho UI
- Retry logic với exponential backoff
- User-friendly error messages

### 5. Performance

- Virtual scrolling cho large lists
- Memoization cho expensive computations
- Debouncing cho user input
- Caching cho API responses

## Security Architecture

### Authentication Flow

```
1. User login → Get access + refresh tokens
2. Store tokens securely (Tauri secure storage)
3. Auto-refresh access token khi sắp expire
4. Logout → Revoke tokens
```

### Data Security

- **Input Sanitization**: Middleware tự động sanitize
- **XSS Prevention**: React auto-escaping + sanitization
- **CSRF Protection**: Laravel CSRF tokens
- **SQL Injection**: Eloquent ORM parameterized queries

## Development Workflow

### Local Development

1. **Frontend**: `npm run dev` (Vite dev server)
2. **Backend**: `php artisan serve` (Laravel server)
3. **Tauri**: `npm run tauri dev` (Desktop app)

### Build Process

1. **Frontend Build**: `npm run build` (Vite)
2. **Type Check**: `npm run type-check` (TypeScript)
3. **Tauri Build**: `npm run tauri build` (Rust + Frontend)

## Testing Strategy

### Frontend Tests

- **Unit Tests**: Vitest cho services và utils
- **Component Tests**: Testing Library cho components
- **Integration Tests**: Test service interactions

### Backend Tests

- **Feature Tests**: PHPUnit cho API endpoints
- **Unit Tests**: Test models và services
- **Database Tests**: Test migrations và queries

### Rust Tests

- **Unit Tests**: `#[cfg(test)]` modules
- **Integration Tests**: Test Tauri commands

## Deployment

### Desktop App

- **Windows**: MSI installer
- **macOS**: DMG với code signing
- **Linux**: AppImage, DEB, RPM

### Backend

- **Server**: PHP 8.2+ với Laravel
- **Database**: MySQL/PostgreSQL
- **Web Server**: Nginx/Apache
- **SSL**: HTTPS required

## Future Architecture Considerations

1. **Microservices**: Tách services nếu scale lớn
2. **GraphQL**: Consider GraphQL API
3. **Real-time**: WebSocket cho real-time collaboration
4. **Offline Support**: Service Workers cho offline mode
5. **PWA**: Progressive Web App support
