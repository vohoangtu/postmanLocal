# Mock Server Status Report

## Tổng quan

Mock Server đã được implement đầy đủ và **CHỈ hoạt động trên Tauri Desktop**, không hoạt động trên web browser.

## Implementation Status

### ✅ Đã hoàn thành

1. **Rust Backend (Tauri)**
   - ✅ `src-tauri/src/mock_server.rs` - Full implementation với Axum HTTP server
   - ✅ `src-tauri/src/commands.rs` - Commands: `start_mock_server`, `stop_mock_server`, `get_mock_server_status`
   - ✅ Đã đăng ký commands trong `main.rs`
   - ✅ Hỗ trợ các HTTP methods: GET, POST, PUT, DELETE, PATCH
   - ✅ Route matching với path và method
   - ✅ Custom headers, status codes, response body
   - ✅ Delay simulation (delayMs)
   - ✅ CORS support

2. **Frontend Service**
   - ✅ `src/services/mockServerService.ts` - Platform-aware service
   - ✅ Kiểm tra `isTauri()` trước khi gọi Tauri API
   - ✅ Web fallback: trả về `{ running: false }` khi không có Tauri

3. **UI Components**
   - ✅ `src/components/MockServer/MockServerPanel.tsx` - UI để quản lý mock server
   - ✅ `src/components/MockServer/MockServerHelpModal.tsx` - Modal hướng dẫn sử dụng
   - ✅ Start/Stop server
   - ✅ Add/Edit/Delete routes
   - ✅ Port configuration

## Platform Support

### ✅ Tauri Desktop (Windows/Mac/Linux)
- **Hoạt động đầy đủ**
- Server chạy trên `localhost:port` (mặc định 3000)
- Có thể test từ Request Builder hoặc bất kỳ HTTP client nào
- Server chạy trong background thread của Tauri app

### ❌ Web Browser
- **KHÔNG hoạt động**
- Lý do: Web browser không có quyền tạo HTTP server
- Frontend sẽ hiển thị "not running" và không cho phép start
- Các tính năng khác vẫn hoạt động bình thường

## Cách sử dụng

1. **Tạo Route:**
   - Click "Add Route" trong Mock Server panel
   - Điền thông tin:
     - Path: `/api/users` (không cần leading slash trong một số trường hợp)
     - Method: GET, POST, PUT, DELETE, PATCH
     - Status: 200, 404, 500, etc.
     - Headers: JSON object
     - Body: JSON object
     - Delay: milliseconds

2. **Start Server:**
   - Nhập port (mặc định 3000)
   - Click "Start"
   - Server sẽ chạy trên `http://localhost:3000`

3. **Test trong Request Builder:**
   - Method: GET
   - URL: `http://localhost:3000/api/users`
   - Click "Send"

## Technical Details

### Route Matching
- Format: `METHOD:PATH` (ví dụ: `GET:/api/users`)
- Path phải khớp chính xác với path trong route
- Method phải khớp chính xác (case-insensitive)

### Server Architecture
- Sử dụng Axum framework (async HTTP server)
- Chạy trong tokio runtime
- Background task được quản lý bởi Arc<Mutex>
- Server có thể stop/start nhiều lần

### Limitations
1. Chỉ hoạt động trên Tauri Desktop
2. Chỉ bind trên `127.0.0.1` (localhost only)
3. Không hỗ trợ dynamic route parameters (như `/api/users/:id`)
4. Path matching là exact match (không hỗ trợ wildcard)

## Testing

Để test mock server:

1. Build và chạy Tauri app:
   ```bash
   npm run tauri dev
   ```

2. Trong app:
   - Mở Mock Server panel
   - Add route: Path=`/api/test`, Method=`GET`, Status=`200`, Body=`{"message": "Hello"}`
   - Start server trên port 3000

3. Test từ Request Builder:
   - URL: `http://localhost:3000/api/test`
   - Method: GET
   - Click Send
   - Should receive: `{"message": "Hello"}`

4. Hoặc test từ terminal:
   ```bash
   curl http://localhost:3000/api/test
   ```

## Known Issues

1. ⚠️ Path matching có thể cần leading slash - cần test kỹ
2. ⚠️ Web environment sẽ hiển thị "not running" - đây là expected behavior
3. ⚠️ Port conflict - nếu port đã được sử dụng, server sẽ không start được

## Future Improvements

- [ ] Dynamic route parameters (`/api/users/:id`)
- [ ] Wildcard routes (`/api/*`)
- [ ] Request body matching cho POST/PUT
- [ ] Response templates
- [ ] Import/Export routes
- [ ] Multiple mock servers cùng lúc

