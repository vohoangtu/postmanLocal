<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * Base Controller với common methods cho pagination và caching
 */
class BaseController extends Controller
{
    /**
     * Paginate query results
     */
    protected function paginate($query, Request $request, $perPage = 15)
    {
        $perPage = $request->get('per_page', $perPage);
        $perPage = min(max(1, (int)$perPage), 100); // Limit between 1 and 100
        
        return $query->paginate($perPage);
    }

    /**
     * Cache response với TTL
     */
    protected function cache($key, $ttl, $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Invalidate cache by pattern
     */
    protected function invalidateCache($pattern)
    {
        // Note: Laravel doesn't support pattern-based cache invalidation by default
        // This would need Redis with tags or a custom implementation
        // For now, we'll use specific keys
    }

    /**
     * Get cache key for user-specific data
     */
    protected function getUserCacheKey($prefix, $userId = null)
    {
        $userId = $userId ?? auth()->id();
        return "{$prefix}:user:{$userId}";
    }
}
