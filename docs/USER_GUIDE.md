# User Guide - PostmanLocal

Hướng dẫn sử dụng PostmanLocal cho người dùng cuối.

## Bắt đầu

### Cài đặt

1. Download installer từ [releases page](https://github.com/your-repo/releases)
2. Chạy installer và follow instructions
3. Launch PostmanLocal từ desktop hoặc start menu

### Lần đầu sử dụng

1. **Tạo Account** (optional):
   - Click "Sign In" ở bottom panel
   - Click "Register" để tạo account mới
   - Hoặc đăng nhập nếu đã có account

2. **Tạo Collection đầu tiên**:
   - Click "Collections" trong sidebar
   - Click "New Collection"
   - Nhập tên collection và description
   - Click "Create"

## Tạo và Gửi Requests

### Tạo Request mới

1. Click "New Request" button (hoặc `Ctrl+N`)
2. Chọn HTTP method (GET, POST, PUT, DELETE, PATCH)
3. Nhập URL
4. Thêm headers (nếu cần)
5. Thêm body (cho POST/PUT/PATCH)
6. Click "Send" (hoặc `Ctrl+Enter`)

### HTTP Methods

- **GET**: Lấy dữ liệu từ server
- **POST**: Tạo resource mới
- **PUT**: Cập nhật toàn bộ resource
- **PATCH**: Cập nhật một phần resource
- **DELETE**: Xóa resource

### Request URL

Nhập URL đầy đủ:
```
https://api.example.com/users
```

Hoặc với path parameters:
```
https://api.example.com/users/123
```

### Headers

Thêm custom headers:
1. Click "Add Header"
2. Nhập header name (ví dụ: `Content-Type`)
3. Nhập header value (ví dụ: `application/json`)

Common headers:
- `Content-Type`: `application/json`
- `Authorization`: `Bearer token`
- `Accept`: `application/json`

### Request Body

Cho POST/PUT/PATCH requests:

**JSON:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Form Data:**
- Key: `name`, Value: `John Doe`
- Key: `email`, Value: `john@example.com`

**x-www-form-urlencoded:**
- Key: `name`, Value: `John Doe`

### Query Parameters

Thêm query parameters:
1. Click "Add Query Param"
2. Nhập key và value
3. Enable/disable parameter

Ví dụ: `?page=1&limit=10`

## Authentication

### Bearer Token

1. Click "Auth" tab
2. Chọn "Bearer Token"
3. Nhập token
4. Token sẽ tự động được thêm vào `Authorization` header

### Basic Auth

1. Chọn "Basic Auth"
2. Nhập username và password
3. Credentials sẽ được encode và thêm vào header

### API Key

1. Chọn "API Key"
2. Chọn location: Header hoặc Query
3. Nhập key name và value

### OAuth2

1. Chọn "OAuth2"
2. Cấu hình:
   - Authorization URL
   - Token URL
   - Client ID
   - Client Secret
   - Scopes
3. Click "Get Token" để lấy access token

## Environment Variables

### Tạo Environment

1. Click "Environments" trong sidebar
2. Click "New Environment"
3. Nhập tên (ví dụ: "Development")
4. Thêm variables:
   - Key: `api_url`
   - Value: `https://api.dev.example.com`
5. Click "Save"

### Sử dụng Variables

Sử dụng format `{{variable_name}}`:

- URL: `{{api_url}}/users`
- Header: `Authorization: Bearer {{token}}`
- Body: `{"userId": "{{user_id}}"}`

### Switch Environment

1. Click environment dropdown ở top
2. Chọn environment muốn sử dụng
3. Variables sẽ tự động được replace

## Collections

### Tạo Collection

1. Click "Collections" trong sidebar
2. Click "New Collection"
3. Nhập tên và description
4. Click "Create"

### Thêm Request vào Collection

1. Tạo request như bình thường
2. Click "Save" button
3. Chọn collection
4. Nhập request name
5. Click "Save"

### Tổ chức với Folders

1. Trong collection, click "New Folder"
2. Nhập folder name
3. Drag requests vào folder

### Run Collection

1. Mở collection
2. Click "Run Collection" button
3. Xem results:
   - Passed/Failed requests
   - Test results
   - Execution time

## Test Scripts

### Viết Tests

Trong tab "Tests", viết test scripts:

```javascript
// Check status code
pm.test("Status is 200", function() {
  pm.expect(pm.response.code).to.be.equal(200);
});

// Check response body
pm.test("Response has data", function() {
  const json = pm.response.json();
  pm.expect(json).to.have.property("data");
});

// Check response time
pm.test("Response time < 500ms", function() {
  pm.expect(pm.response.responseTime).to.be.below(500);
});
```

### Pre-request Scripts

Chạy script trước khi gửi request:

```javascript
// Set dynamic header
pm.request.update({
  headers: {
    "X-Timestamp": new Date().toISOString()
  }
});

// Set variable
pm.environment.set("token", "generated-token");
```

### Post-request Scripts

Chạy script sau khi nhận response:

```javascript
// Extract data
const json = pm.response.json();
pm.environment.set("userId", json.user.id);

// Set global variable
pm.globals.set("lastResponse", JSON.stringify(json));
```

## GraphQL Requests

### Tạo GraphQL Request

1. Chọn "GraphQL" tab
2. Nhập GraphQL endpoint URL
3. Viết query trong editor:
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    email
  }
}
```

4. Thêm variables:
```json
{
  "id": "123"
}
```

5. Click "Execute"

### Schema Introspection

1. Click "Schema" button
2. App sẽ tự động introspect schema từ endpoint
3. Sử dụng schema explorer để browse types và fields

## WebSocket Testing

### Kết nối WebSocket

1. Chọn "WebSocket" tab
2. Nhập WebSocket URL: `ws://localhost:8080` hoặc `wss://example.com`
3. Thêm headers (nếu cần)
4. Click "Connect"

### Gửi Messages

1. Chọn message format (JSON, Text, Binary)
2. Nhập message content
3. Click "Send"

### Xem Messages

- Sent messages hiển thị màu xanh
- Received messages hiển thị màu xanh lá
- Timestamp cho mỗi message

## Mock Server

### Tạo Mock Routes

1. Click "Mock Server" trong sidebar
2. Click "Add Route"
3. Cấu hình:
   - Method: GET, POST, etc.
   - Path: `/api/users`
   - Status: 200
   - Headers: `Content-Type: application/json`
   - Body: Response body (JSON)
4. Click "Save"

### Start Mock Server

1. Chọn port (mặc định: 3000)
2. Click "Start Server"
3. Server sẽ chạy tại `http://localhost:3000`

### Test Mock Routes

Sử dụng Request Builder để test:
- URL: `http://localhost:3000/api/users`
- Method: GET
- Click "Send"

## Import/Export

### Import Postman Collection

1. Click "Import" trong sidebar
2. Chọn "Postman Collection"
3. Chọn file JSON
4. Click "Import"

### Export Collection

1. Mở collection
2. Click "Export"
3. Chọn format: Postman hoặc OpenAPI
4. Download file

### Import OpenAPI Schema

1. Click "Import"
2. Chọn "OpenAPI/Swagger"
3. Chọn file JSON/YAML
4. Collection sẽ được tạo từ schema

## Cloud Sync

### Đăng nhập

1. Click "Sign In" ở bottom panel
2. Nhập email và password
3. Click "Login"

### Sync Collections

1. Sau khi đăng nhập, click "Sync to Cloud"
2. Collections sẽ được upload lên cloud
3. Có thể access từ bất kỳ device nào

### Workspaces

1. Click "Workspaces" trong sidebar
2. Tạo workspace mới
3. Invite team members
4. Share collections trong workspace

## Collaboration

### Share Collection

1. Mở collection
2. Click "Share" button
3. Nhập email của người muốn share
4. Chọn permission: Read, Write, hoặc Admin
5. Click "Share"

### Comments

1. Mở collection
2. Click "Comments" tab
3. Thêm comment
4. Team members có thể reply

### Annotations

1. Trong request, click "Annotations" tab
2. Add annotation với type: Note hoặc Highlight
3. Annotations được sync real-time

## Keyboard Shortcuts

### Global Shortcuts

- `Ctrl+K`: Mở Command Palette
- `Ctrl+B`: Toggle Left Panel
- `Ctrl+/`: Toggle Comments
- `Escape`: Đóng active panel/modal

### Request Shortcuts

- `Ctrl+Enter`: Send request
- `Ctrl+S`: Save request
- `Ctrl+W`: Close current tab
- `Ctrl+T`: New request tab

### Navigation

- `Ctrl+1`: Collections
- `Ctrl+2`: History
- `Ctrl+3`: Environments
- `Ctrl+4`: Schemas

## Tips & Tricks

### 1. Variable Substitution

Sử dụng variables trong mọi nơi:
- URL: `{{base_url}}/users`
- Headers: `Authorization: Bearer {{token}}`
- Body: `{"userId": "{{user_id}}"}`

### 2. Request History

- Xem lại requests đã gửi trong "History"
- Click vào history item để load lại request
- Search history với keywords

### 3. Collections Organization

- Tạo folders để organize requests
- Use naming conventions: `GET User`, `POST Create User`
- Add descriptions cho requests

### 4. Test Automation

- Viết tests cho mỗi request
- Run collection để test toàn bộ API
- Use pre-request scripts để setup data

### 5. Environment Management

- Tạo environments cho mỗi môi trường (dev, staging, prod)
- Switch environments dễ dàng
- Variables tự động update

## Troubleshooting

### Request không gửi được

1. Kiểm tra URL có hợp lệ không
2. Kiểm tra network connection
3. Kiểm tra CORS settings (nếu test từ browser)
4. Xem error message trong response

### Variables không được replace

1. Kiểm tra environment đã được chọn
2. Kiểm tra variable name đúng format `{{variable_name}}`
3. Kiểm tra variable đã được define trong environment

### Mock Server không chạy

1. Mock Server chỉ hoạt động trên Desktop app (Tauri)
2. Kiểm tra port có bị conflict không
3. Đảm bảo routes đã được cấu hình

### Cloud Sync thất bại

1. Kiểm tra đã đăng nhập chưa
2. Kiểm tra network connection
3. Kiểm tra backend server có đang chạy không
4. Xem error logs trong console

## Support

- **Documentation**: Xem `docs/` folder
- **Issues**: Report issues trên GitHub
- **Community**: Join discussion trong repository
