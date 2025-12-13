# Additional Features - PostmanLocal

Tài liệu này mô tả các additional features đã được implement.

## Pre-request và Post-request Scripts

### Pre-request Scripts

Pre-request scripts chạy trước khi gửi request, cho phép:
- Modify request URL, headers, body
- Set environment variables
- Generate dynamic values

**Usage trong TestEditor:**
```javascript
// Pre-request script
pm.request.update({
  headers: {
    "X-Timestamp": new Date().toISOString(),
    "X-Request-ID": Math.random().toString(36)
  }
});

pm.environment.set("token", "generated-token");
```

**Integration:**
- Pre-request scripts được execute trong `scriptEngine.ts`
- Có thể modify request trước khi send
- Support environment variables và globals

### Post-request Scripts

Post-request scripts chạy sau khi nhận response, cho phép:
- Extract data từ response
- Set variables cho requests tiếp theo
- Validate response

**Usage:**
```javascript
// Post-request script
const jsonData = pm.response.json();
pm.environment.set("userId", jsonData.user.id);
pm.globals.set("lastResponseTime", pm.response.responseTime);
```

## Response Formatters

### Format JSON

```typescript
import { formatJSON } from '@/services/formatters';

const formatted = formatJSON(jsonData, 2); // 2 spaces indent
```

### Format XML

```typescript
import { formatXML } from '@/services/formatters';

const formatted = formatXML(xmlString);
```

### Format HTML

```typescript
import { formatHTML } from '@/services/formatters';

const formatted = formatHTML(htmlString);
```

### Auto-format

ResponseViewer tự động format response dựa trên content type:

```typescript
import { formatResponse, detectContentType } from '@/services/formatters';

const contentType = detectContentType(response.body, response.headers);
const formatted = formatResponse(response.body, contentType);
```

## Collection Runner

### Features

- Run tất cả requests trong collection
- Sequential execution
- Pre-request và post-request scripts support
- Test execution cho mỗi request
- Results dashboard với pass/fail status
- Stop execution bất cứ lúc nào

### Usage

```tsx
import CollectionRunner from '@/components/Collections/CollectionRunner';

<CollectionRunner
  collectionId="col-123"
  onComplete={(results) => {
    console.log(`Passed: ${results.passed}/${results.totalRequests}`);
  }}
/>
```

### Results

```typescript
interface CollectionRunResult {
  collectionId: string;
  totalRequests: number;
  passed: number;
  failed: number;
  results: RequestRunResult[];
  totalDuration: number;
}
```

### Request Results

```typescript
interface RequestRunResult {
  requestId: string;
  requestName: string;
  success: boolean;
  status?: number;
  duration: number;
  testResults?: TestResult[];
  error?: string;
}
```

## Script Engine API

### pm.request

```javascript
// Get request info
pm.request.url;
pm.request.method;
pm.request.headers;
pm.request.body;

// Update request (pre-request only)
pm.request.update({
  url: "https://api.example.com/v2/users",
  headers: { "X-Version": "2.0" },
  body: JSON.stringify({ name: "John" })
});
```

### pm.response

```javascript
// Get response info
pm.response.code;        // Status code
pm.response.status;      // Status text
pm.response.headers;     // Response headers
pm.response.json();      // Parse JSON body
pm.response.text();      // Get text body
pm.response.responseTime; // Response time in ms
```

### pm.environment

```javascript
// Get/set environment variables
const apiUrl = pm.environment.get("api_url");
pm.environment.set("token", "new-token");
```

### pm.globals

```javascript
// Get/set global variables
pm.globals.set("lastUserId", userId);
const lastId = pm.globals.get("lastUserId");
```

### pm.test

```javascript
// Write tests
pm.test("Status is 200", function() {
  pm.expect(pm.response.code).to.be.equal(200);
});

pm.test("Response has data", function() {
  const json = pm.response.json();
  pm.expect(json).to.have.property("data");
});
```

## Best Practices

### Pre-request Scripts

1. **Set Dynamic Headers:**
   ```javascript
   pm.request.update({
     headers: {
       "X-Timestamp": Date.now(),
       "Authorization": `Bearer ${pm.environment.get("token")}`
     }
   });
   ```

2. **Generate Test Data:**
   ```javascript
   const randomId = Math.random().toString(36);
   pm.environment.set("testUserId", randomId);
   ```

3. **Conditional Logic:**
   ```javascript
   if (pm.environment.get("env") === "production") {
     pm.request.update({ url: "https://api.prod.com" });
   }
   ```

### Post-request Scripts

1. **Extract Data:**
   ```javascript
   const json = pm.response.json();
   pm.environment.set("userId", json.user.id);
   pm.globals.set("lastResponse", JSON.stringify(json));
   ```

2. **Validate Response:**
   ```javascript
   pm.test("Response is valid", function() {
     pm.expect(pm.response.code).to.be.above(199);
     pm.expect(pm.response.code).to.be.below(300);
   });
   ```

### Collection Runner

1. **Sequential Execution:**
   - Requests được execute theo thứ tự
   - Variables từ request trước có thể dùng cho request sau

2. **Error Handling:**
   - Nếu request fail, collection runner tiếp tục với request tiếp theo
   - Results bao gồm error messages

3. **Test Integration:**
   - Mỗi request có thể có test script
   - Test results được include trong results

## Future Enhancements

1. **Parallel Execution**: Run requests in parallel
2. **Conditional Execution**: Skip requests based on conditions
3. **Iterations**: Run collection multiple times
4. **Data Files**: Import test data từ CSV/JSON
5. **Workflows**: Define complex execution flows
6. **Reporting**: Export results to HTML/JSON
