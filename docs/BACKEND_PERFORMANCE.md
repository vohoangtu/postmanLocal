# Backend Performance Optimization - PostmanLocal

Tài liệu này mô tả các optimizations đã được implement để cải thiện performance của Laravel backend.

## Query Optimization

### Eager Loading

Sử dụng `with()` để eager load relationships và tránh N+1 queries:

```php
// ✅ Đúng - Eager load relationships
$collections = Collection::with(['user', 'workspace', 'shares.sharedWithUser'])
    ->where('user_id', Auth::id())
    ->get();

// ❌ Sai - N+1 queries
$collections = Collection::where('user_id', Auth::id())->get();
foreach ($collections as $collection) {
    $collection->user; // N+1 query
}
```

### Database Indexes

Migration `2025_12_13_090000_add_performance_indexes.php` thêm indexes cho:

- **Collections**: `user_id`, `workspace_id`, `updated_at`, `is_shared`
- **Collection Shares**: `collection_id`, `shared_with_user_id`
- **Collection Versions**: `collection_id`, `version_number`
- **Comments**: `collection_id`, `user_id`, `parent_id`, `created_at`
- **Workspaces**: `owner_id`
- **Team Members**: `team_id`, `user_id`
- **Notifications**: `user_id`, `read_at`
- **Activity Logs**: `user_id`, `workspace_id`, `created_at`

**Lợi ích:**
- Tăng tốc WHERE clauses
- Tăng tốc JOIN operations
- Tăng tốc ORDER BY operations

## Caching

### Cache Strategy

Sử dụng Laravel Cache để cache frequently accessed data:

```php
// Cache collections list
$cacheKey = $this->getUserCacheKey('collections', Auth::id());
$collections = $this->cache($cacheKey, 300, function () {
    return Collection::with(['user', 'workspace'])
        ->where('user_id', Auth::id())
        ->get();
});
```

### Cache Invalidation

Invalidate cache khi data thay đổi:

```php
// After creating/updating/deleting
Cache::forget($this->getUserCacheKey('collections', Auth::id()));
```

### Cache TTL

- **Collections/Workspaces**: 300 seconds (5 minutes)
- **Comments**: 60 seconds (1 minute) - shorter vì real-time updates
- **Shared Collections**: 300 seconds

## Pagination

### BaseController Pagination

Sử dụng `paginate()` method từ `BaseController`:

```php
public function index(Request $request)
{
    $query = Collection::where('user_id', Auth::id())
        ->with(['user', 'workspace'])
        ->orderBy('updated_at', 'desc');
    
    // Pagination
    if ($request->has('page') || $request->has('per_page')) {
        $collections = $this->paginate($query, $request);
    } else {
        $collections = $query->get();
    }
    
    return response()->json($collections);
}
```

### Pagination Parameters

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 15, max: 100)

**Example:**
```
GET /api/collections?page=1&per_page=20
```

## Query Optimization Best Practices

### 1. Select Only Needed Columns

```php
// ✅ Đúng - Select specific columns
$collections = Collection::select('id', 'name', 'description')
    ->where('user_id', Auth::id())
    ->get();

// ❌ Sai - Select all columns
$collections = Collection::where('user_id', Auth::id())->get();
```

### 2. Use Query Scopes

```php
// In Model
public function scopeForUser($query, $userId)
{
    return $query->where('user_id', $userId);
}

// Usage
$collections = Collection::forUser(Auth::id())->get();
```

### 3. Avoid N+1 Queries

```php
// ✅ Đúng
$collections = Collection::with('user')->get();

// ❌ Sai
$collections = Collection::all();
foreach ($collections as $collection) {
    $collection->user; // N+1
}
```

### 4. Use Database Transactions

```php
DB::transaction(function () {
    // Multiple operations
    $collection = Collection::create([...]);
    $version = CollectionVersion::create([...]);
});
```

### 5. Batch Operations

```php
// ✅ Đúng - Batch insert
Collection::insert([...]);

// ❌ Sai - Individual inserts
foreach ($data as $item) {
    Collection::create($item);
}
```

## Performance Monitoring

### Query Logging

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

### Laravel Debugbar

Sử dụng Laravel Debugbar để:
- Monitor query count
- Identify N+1 queries
- Analyze slow queries

### Slow Query Log

Enable MySQL slow query log:

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

## Caching Best Practices

### 1. Cache Frequently Accessed Data

- User-specific lists (collections, workspaces)
- Shared resources
- Aggregated data

### 2. Use Appropriate TTL

- Short TTL (60s) cho real-time data
- Medium TTL (300s) cho frequently updated data
- Long TTL (3600s) cho static data

### 3. Invalidate on Updates

Always invalidate cache khi:
- Creating new records
- Updating existing records
- Deleting records

### 4. Cache Keys

Use consistent cache key patterns:
- `{resource}:user:{userId}`
- `{resource}:collection:{collectionId}`
- `{resource}:workspace:{workspaceId}`

## Database Optimization

### 1. Indexes

- Index foreign keys
- Index columns used in WHERE clauses
- Index columns used in ORDER BY
- Composite indexes cho multiple columns

### 2. Query Optimization

- Use EXPLAIN để analyze queries
- Optimize JOIN operations
- Avoid SELECT *
- Use LIMIT cho large datasets

### 3. Connection Pooling

Configure connection pooling trong `config/database.php`:

```php
'connections' => [
    'mysql' => [
        'options' => [
            PDO::ATTR_PERSISTENT => true,
        ],
    ],
],
```

## Future Optimizations

1. **Redis Caching**: Move từ file cache sang Redis
2. **Query Caching**: Cache query results
3. **Database Replication**: Read replicas cho read-heavy operations
4. **Full-Text Search**: Elasticsearch cho search functionality
5. **CDN**: Serve static assets qua CDN
