# Performance Optimization Guide - PostmanLocal

Tài liệu này mô tả các optimizations đã được implement để cải thiện performance của ứng dụng.

## Code Splitting

### Lazy Loading Components

Các components lớn được lazy load để giảm initial bundle size:

```tsx
// App.tsx
const CommandPalette = lazy(() => import("./components/CommandPalette/CommandPalette"));
const RequestBuilder = lazy(() => import("./components/RequestBuilder/RequestBuilder"));
const ResponseViewer = lazy(() => import("./components/ResponseViewer/ResponseViewer"));
const TestEditor = lazy(() => import("./components/TestRunner/TestEditor"));
const SyncPanel = lazy(() => import("./components/Sync/SyncPanel"));
```

### Vite Manual Chunks

Vite config được tối ưu để tách code thành các chunks hợp lý:

- `monaco-editor`: Monaco Editor và dependencies
- `react-vendor`: React core libraries
- `ui-vendor`: UI libraries (lucide-react, framer-motion)
- `stores`: Zustand stores
- `services`: Service layer
- `request-components`: RequestBuilder, ResponseViewer
- `collection-components`: CollectionManager, WorkspaceManager
- `utils`: Utility functions

## Memoization

### React.memo

Các components được wrap với `React.memo` để tránh re-render không cần thiết:

```tsx
// RequestHistory.tsx
export default memo(RequestHistory);

// CollectionManager.tsx
export default memo(CollectionManager);

// App.tsx
export default memo(App);
```

### useMemo

Sử dụng `useMemo` cho expensive computations:

```tsx
// RequestHistory.tsx
const filteredHistory = useMemo(() => {
  if (!debouncedSearchQuery.trim()) return history;
  const query = debouncedSearchQuery.toLowerCase();
  return history.filter(/* ... */);
}, [history, debouncedSearchQuery]);

// App.tsx
const activeTab = useMemo(
  () => activeTabId ? tabs.find((t) => t.id === activeTabId) : null,
  [tabs, activeTabId]
);
```

### useCallback

Sử dụng `useCallback` để memoize callbacks:

```tsx
const handleNewRequest = useCallback(() => {
  addTab({
    name: "New Request",
    method: "GET",
    url: "",
  });
}, [addTab]);
```

## Virtual Scrolling

### VirtualList Component

Component `VirtualList` được tạo để render large lists hiệu quả:

```tsx
<VirtualList
  items={filteredHistory}
  itemHeight={80}
  containerHeight={window.innerHeight - 200}
  renderItem={(item, index) => <HistoryItem item={item} />}
  overscan={5}
/>
```

**Lợi ích:**
- Chỉ render items visible trong viewport + overscan
- Giảm DOM nodes khi render large lists
- Cải thiện scroll performance

**Sử dụng khi:**
- Lists có > 50 items
- Items có fixed height
- Scroll performance là vấn đề

## Debouncing

### useDebounce Hook

Hook `useDebounce` được tạo để debounce values và callbacks:

```tsx
// Debounce search query
const [searchQuery, setSearchQuery] = useState("");
const debouncedSearchQuery = useDebounce(searchQuery, 300);

// Debounce callback
const debouncedCallback = useDebouncedCallback(handleSearch, 300);
```

**Lợi ích:**
- Giảm số lần re-render khi typing
- Giảm số lần gọi API/search operations
- Cải thiện UX với smoother interactions

## Best Practices

### 1. Lazy Load Large Components

Luôn lazy load components lớn (> 50KB):

```tsx
const LargeComponent = lazy(() => import('./LargeComponent'));

<Suspense fallback={<Loading />}>
  <LargeComponent />
</Suspense>
```

### 2. Memoize Expensive Computations

Sử dụng `useMemo` cho:
- Filtering/sorting large arrays
- Complex calculations
- Derived state

### 3. Memoize Callbacks

Sử dụng `useCallback` cho:
- Event handlers passed to child components
- Dependencies của other hooks
- Callbacks trong loops

### 4. Use Virtual Scrolling

Sử dụng `VirtualList` cho:
- Lists với > 50 items
- Long scrollable content
- Performance-critical lists

### 5. Debounce User Input

Debounce:
- Search inputs
- Form validations
- API calls triggered by input

### 6. Code Splitting Strategy

Tách code theo:
- Feature boundaries
- Route boundaries
- Component size (> 50KB)

## Performance Monitoring

### React DevTools Profiler

Sử dụng React DevTools Profiler để:
- Identify slow components
- Find unnecessary re-renders
- Optimize render performance

### Chrome DevTools Performance

Sử dụng Chrome DevTools để:
- Analyze bundle size
- Identify long tasks
- Optimize loading performance

## Metrics

### Target Metrics

- **Initial Load**: < 3s
- **Time to Interactive**: < 5s
- **Bundle Size**: < 500KB (gzipped)
- **Largest Contentful Paint**: < 2.5s

### Monitoring

- Bundle size được track trong build output
- Performance metrics được log trong development
- Error tracking cho performance issues

## Future Optimizations

1. **Service Worker**: Cache static assets
2. **Image Optimization**: Lazy load và optimize images
3. **Font Optimization**: Subset fonts, preload critical fonts
4. **Prefetching**: Prefetch routes/components on hover
5. **Web Workers**: Move heavy computations to workers
