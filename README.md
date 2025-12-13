# PostmanLocal - Desktop API Testing Tool

Desktop application giống Postman được xây dựng bằng Tauri (Rust + React), hỗ trợ test API và cộng tác nhóm để thống nhất API design giữa frontend và backend.

## Tính năng

### Core Features
- ✅ **API Request Builder**: Gửi HTTP requests với đầy đủ methods (GET, POST, PUT, DELETE, PATCH)
- ✅ **GraphQL Request Builder**: GraphQL query editor với schema introspection và auto-complete
- ✅ **WebSocket Tester**: Test WebSocket connections với real-time messaging
- ✅ **Authentication Support**: Bearer Token, Basic Auth, API Key
- ✅ **Environment Variables**: Quản lý nhiều environments (dev, staging, prod) với variable substitution
- ✅ **Collections Management**: Tổ chức requests theo collections và folders
- ✅ **Request Chaining**: Chain multiple requests với variable extraction và visual flow editor
- ✅ **Test Scripts & Assertions**: Viết và chạy test scripts để validate responses
- ✅ **Request History**: Lưu và xem lại lịch sử requests

### Schema & Documentation
- ✅ **API Schema Management**: Lưu và quản lý API schemas (OpenAPI 3.0 compatible)
- ✅ **Schema Validation**: Validate responses theo schema đã định nghĩa
- ✅ **Documentation Generator**: Tự động generate API documentation từ schema
- ✅ **Mock Server**: Tạo mock server từ API schema với auto-route generation
- ✅ **Mock Server từ Schema**: Import OpenAPI schema và tự động generate mock routes

### Collaboration & Sync
- ✅ **Cloud Sync**: Đồng bộ collections, environments, schemas với team qua Laravel backend
- ✅ **Workspaces**: Quản lý workspaces cho team collaboration
- ✅ **Collection Sharing**: Share collections với permission management (read, write, admin)
- ✅ **Comments & Annotations**: Thêm comments và annotations trên requests
- ✅ **Version Control**: Version history cho collections với diff view
- ✅ **Activity Logs**: Theo dõi hoạt động trong workspace
- ✅ **Notifications**: Real-time notifications cho comments và shares

### Import/Export
- ✅ **Import Postman Collections**: Import từ Postman Collection v2.1 format
- ✅ **Export to Postman**: Export collections sang Postman format
- ✅ **Import OpenAPI**: Import từ OpenAPI 3.0/Swagger
- ✅ **Export to OpenAPI**: Export collections sang OpenAPI format

### Advanced Features
- ✅ **Templates Library**: Browse và sử dụng templates từ library
- ✅ **Performance Monitoring**: Track request performance và metrics
- ✅ **Caching**: Intelligent caching cho GET requests
- ✅ **Error Handling**: Comprehensive error handling với user-friendly messages
- ✅ **Validation**: Form validation, URL validation, JSON validation

## Kiến trúc

- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Desktop Backend**: Rust (Tauri v2)
- **Cloud Sync Backend**: PHP Laravel 12
- **Database**: SQLite (local), MySQL/PostgreSQL (cloud)

## Setup

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Tauri CLI: `npm install -g @tauri-apps/cli@latest` (hoặc đã có trong devDependencies)
- PHP 8.2+
- Composer
- MySQL hoặc PostgreSQL (cho cloud sync)

### Frontend & Desktop App

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy development server:
```bash
npm run dev
```

3. Build desktop app:
```bash
npm run tauri build
```

### Backend (Cloud Sync)

1. Vào thư mục backend:
```bash
cd backend
```

2. Cài đặt dependencies:
```bash
composer install
```

3. Copy file .env:
```bash
cp .env.example .env
```

4. Generate application key:
```bash
php artisan key:generate
```

5. Cấu hình database trong `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=postmanlocal
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

6. Chạy migrations:
```bash
php artisan migrate
```

7. Chạy server:
```bash
php artisan serve
```

Backend sẽ chạy tại `http://localhost:8000`

## Cấu trúc dự án

```
postmanlocal/
├── src-tauri/          # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands.rs
│   │   ├── storage.rs
│   │   └── api_client.rs
│   └── Cargo.toml
├── src/                # React frontend
│   ├── components/
│   ├── stores/
│   ├── services/
│   └── App.tsx
├── backend/            # Laravel backend
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   └── Services/
│   ├── routes/
│   └── database/migrations/
└── package.json
```

## Sử dụng

### Tạo Request

1. Chọn HTTP method (GET, POST, PUT, DELETE, PATCH)
2. Nhập URL
3. Thêm headers (nếu cần)
4. Thêm body (cho POST/PUT/PATCH)
5. Click "Send"

### Quản lý Collections

- Tạo collection mới từ sidebar
- Tổ chức requests theo collections
- Export/import collections

### Environment Variables

- Tạo environments (dev, staging, prod)
- Định nghĩa variables với format `{{variable_name}}`
- Variables sẽ tự động được replace trong URL, headers, body

### Test Scripts

- Viết test scripts trong tab "Tests"
- Sử dụng Postman-like API: `pm.test()`, `pm.expect()`
- Chạy tests sau khi nhận response

### API Schema

- Tạo API schema (OpenAPI 3.0 format)
- Validate responses theo schema
- Generate documentation từ schema

### Cloud Sync

1. Click "Sign In" ở bottom panel
2. Đăng ký hoặc đăng nhập
3. Click "Sync to Cloud" để đồng bộ dữ liệu từ local SQLite lên cloud
4. Dữ liệu sẽ được đồng bộ tự động với retry logic

## Development

### Frontend Development

```bash
npm run dev
```

### Backend Development

```bash
cd backend
php artisan serve
```

### Build Production

```bash
npm run tauri build
```

## API Documentation

### Backend API Endpoints

#### Authentication
- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/user` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

#### Collections
- `GET /api/collections` - Lấy danh sách collections
- `POST /api/collections` - Tạo collection mới
- `GET /api/collections/{id}` - Lấy chi tiết collection
- `PUT /api/collections/{id}` - Cập nhật collection
- `DELETE /api/collections/{id}` - Xóa collection
- `POST /api/collections/sync` - Đồng bộ collections
- `POST /api/collections/{id}/share` - Share collection
- `GET /api/collections/shared` - Lấy shared collections
- `GET /api/collections/{id}/versions` - Lấy version history
- `POST /api/collections/{id}/versions` - Tạo version mới
- `POST /api/collections/{id}/restore/{versionId}` - Restore version

#### Environments
- `GET /api/environments` - Lấy danh sách environments
- `POST /api/environments` - Tạo environment mới
- `POST /api/environments/sync` - Đồng bộ environments

#### Schemas
- `GET /api/schemas` - Lấy danh sách schemas
- `POST /api/schemas` - Tạo schema mới
- `POST /api/schemas/sync` - Đồng bộ schemas

#### Workspaces
- `GET /api/workspaces` - Lấy danh sách workspaces
- `POST /api/workspaces` - Tạo workspace mới
- `POST /api/workspaces/{id}/invite` - Mời member vào workspace

#### Sync
- `POST /api/sync` - Đồng bộ tất cả dữ liệu (collections, environments, schemas)

## Keyboard Shortcuts

Xem file [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) để biết danh sách đầy đủ keyboard shortcuts.

Một số shortcuts phổ biến:
- `Ctrl+K` - Mở Command Palette
- `Ctrl+B` - Toggle Left Panel
- `Ctrl+S` - Save request to collection
- `Ctrl+Enter` - Send request

## Troubleshooting

### Mock Server không chạy
- Mock Server chỉ hoạt động trên Tauri Desktop, không hoạt động trên web browser
- Kiểm tra port có bị conflict không
- Đảm bảo routes đã được cấu hình đúng

### Cloud Sync thất bại
- Kiểm tra kết nối mạng
- Đảm bảo đã đăng nhập
- Kiểm tra backend server có đang chạy không
- Xem logs trong console để biết chi tiết lỗi

### Import/Export lỗi
- Đảm bảo file format đúng (Postman v2.1 hoặc OpenAPI 3.0)
- Kiểm tra file JSON có hợp lệ không
- Xem error message trong toast notification

## Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## License

MIT

