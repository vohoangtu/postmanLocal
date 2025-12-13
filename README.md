# PostmanLocal - Desktop API Testing Tool

Desktop application giống Postman được xây dựng bằng Tauri (Rust + React), hỗ trợ test API và cộng tác nhóm để thống nhất API design giữa frontend và backend.

## Tính năng

- ✅ **API Request Builder**: Gửi HTTP requests với đầy đủ methods (GET, POST, PUT, DELETE, PATCH)
- ✅ **Authentication Support**: Bearer Token, Basic Auth, API Key
- ✅ **Environment Variables**: Quản lý nhiều environments (dev, staging, prod)
- ✅ **Collections Management**: Tổ chức requests theo collections và folders
- ✅ **Test Scripts & Assertions**: Viết và chạy test scripts để validate responses
- ✅ **API Schema Management**: Lưu và quản lý API schemas (OpenAPI 3.0 compatible)
- ✅ **Schema Validation**: Validate responses theo schema đã định nghĩa
- ✅ **Documentation Generator**: Tự động generate API documentation từ schema
- ✅ **Mock Server**: Tạo mock server từ API schema (coming soon)
- ✅ **Cloud Sync**: Đồng bộ collections, environments, schemas với team qua Laravel backend

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
3. Click "Sync to Cloud" để đồng bộ dữ liệu

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

## License

MIT

