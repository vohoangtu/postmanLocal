<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\CollectionShare;
use App\Models\CollectionVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class CollectionController extends BaseController
{
    public function index(Request $request)
    {
        try {
            $userId = Auth::id();
            if (!$userId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $cacheKey = $this->getUserCacheKey('collections', $userId);
            
            $collections = $this->cache($cacheKey, 300, function () use ($request, $userId) {
                try {
                    $query = Collection::where('user_id', $userId)
                        ->with('user')
                        ->orderBy('updated_at', 'desc');
                    
                    // Chỉ load permissions nếu bảng tồn tại
                    if (\Schema::hasTable('collection_permissions')) {
                        $query->with([
                            'permissions' => function ($query) {
                                $query->with('user');
                            }
                        ]);
                    }
                    
                    // Pagination
                    if ($request->has('page') || $request->has('per_page')) {
                        return $this->paginate($query, $request);
                    }
                    
                    return $query->get();
                } catch (\Exception $e) {
                    // Fallback: load không có permissions nếu có lỗi
                    \Log::warning('Error loading permissions in collections: ' . $e->getMessage());
                    $query = Collection::where('user_id', $userId)
                        ->with('user')
                        ->orderBy('updated_at', 'desc');
                    
                    if ($request->has('page') || $request->has('per_page')) {
                        return $this->paginate($query, $request);
                    }
                    
                    return $query->get();
                }
            });

            return response()->json($collections);
        } catch (\Exception $e) {
            \Log::error('Error fetching collections: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error fetching collections',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $userId = Auth::id();
            if (!$userId) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'data' => 'nullable|array', // Chấp nhận array/object, Laravel sẽ tự động convert thành JSON
            ]);

            $collection = Collection::create([
                'user_id' => $userId,
                'name' => $request->name,
                'description' => $request->description,
                'data' => $request->data, // Laravel sẽ tự động cast thành JSON nhờ $casts trong Model
            ]);

            // Tự động set làm default nếu user chưa có default collection
            $defaultCollection = Collection::getDefaultCollection($userId);
            if (!$defaultCollection) {
                $collection->setAsDefault();
            }

            // Invalidate cache
            Cache::forget($this->getUserCacheKey('collections', $userId));

            return response()->json($collection->load([
                'user',
                'permissions' => function ($query) {
                    $query->with('user');
                }
            ]), 201);
        } catch (\Exception $e) {
            \Log::error('Error creating collection: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Error creating collection',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function show($id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->with([
                'shares.sharedWithUser',
                'shares.sharedBy',
                'user',
                'permissions' => function ($query) {
                    $query->with('user');
                }
            ])
            ->findOrFail($id);
        return response()->json($collection);
    }

    public function update(Request $request, $id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'data' => 'nullable|json',
        ]);

        $collection->update($request->only(['name', 'description', 'data']));

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        return response()->json($collection->load([
            'user',
            'permissions' => function ($query) {
                $query->with('user');
            }
        ]));
    }

    public function destroy($id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);
        $collection->delete();

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        return response()->json(['message' => 'Collection deleted successfully']);
    }

    public function sync(Request $request)
    {
        $request->validate([
            'collections' => 'required|array',
        ]);

        $synced = [];
        foreach ($request->collections as $collectionData) {
            $collection = Collection::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'name' => $collectionData['name'],
                ],
                [
                    'description' => $collectionData['description'] ?? null,
                    'data' => json_encode($collectionData['data'] ?? []),
                ]
            );
            $synced[] = $collection;
        }

        return response()->json(['collections' => $synced]);
    }

    /**
     * Share collection with a user
     */
    public function share(Request $request, $id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'email' => 'required|email|exists:users,email',
            'permission' => 'required|in:read,write,admin',
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        // Check if already shared
        $existingShare = CollectionShare::where('collection_id', $collection->id)
            ->where('shared_with_user_id', $user->id)
            ->first();

        if ($existingShare) {
            $existingShare->update([
                'permission' => $request->permission,
            ]);
            return response()->json($existingShare->load('sharedWithUser'));
        }

        $share = CollectionShare::create([
            'collection_id' => $collection->id,
            'shared_with_user_id' => $user->id,
            'permission' => $request->permission,
            'shared_by_id' => Auth::id(),
        ]);

        $collection->update(['is_shared' => true]);

        return response()->json($share->load('sharedWithUser'), 201);
    }

    /**
     * Get shared collections
     */
    public function shared(Request $request)
    {
        $cacheKey = $this->getUserCacheKey('shared_collections', Auth::id());
        
        $sharedCollections = $this->cache($cacheKey, 300, function () use ($request) {
            $query = Collection::whereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->with([
                'user',
                'shares.sharedWithUser',
                'permissions' => function ($query) {
                    $query->with('user');
                }
            ])
            ->orderBy('updated_at', 'desc');
            
            // Pagination
            if ($request->has('page') || $request->has('per_page')) {
                return $this->paginate($query, $request);
            }
            
            return $query->get();
        });

        return response()->json($sharedCollections);
    }

    /**
     * Update permission for a shared collection
     */
    public function updatePermission(Request $request, $id)
    {
        $collection = Collection::findOrFail($id);

        // Check if user owns the collection
        if ($collection->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'shareId' => 'required|exists:collection_shares,id',
            'permission' => 'required|in:read,write,admin',
        ]);

        $share = CollectionShare::where('collection_id', $collection->id)
            ->where('id', $request->shareId)
            ->firstOrFail();

        $share->update(['permission' => $request->permission]);

        return response()->json($share->load('sharedWithUser'));
    }

    /**
     * Unshare collection
     */
    public function unshare($id, $shareId)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $share = CollectionShare::where('collection_id', $collection->id)
            ->where('id', $shareId)
            ->firstOrFail();

        $share->delete();

        // Update is_shared if no more shares
        if ($collection->shares()->count() === 0) {
            $collection->update(['is_shared' => false]);
        }

        return response()->json(['message' => 'Collection unshared successfully']);
    }

    /**
     * List versions of a collection
     */
    public function versions(Request $request, $id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->findOrFail($id);

        $query = CollectionVersion::where('collection_id', $collection->id)
            ->with('createdBy')
            ->orderBy('version_number', 'desc');
        
        // Pagination
        if ($request->has('page') || $request->has('per_page')) {
            $versions = $this->paginate($query, $request);
        } else {
            $versions = $query->get();
        }

        return response()->json($versions);
    }

    /**
     * Create a new version
     */
    public function createVersion(Request $request, $id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $request->validate([
            'description' => 'nullable|string',
        ]);

        // Get current version number
        $latestVersion = CollectionVersion::where('collection_id', $collection->id)
            ->orderBy('version_number', 'desc')
            ->first();

        $versionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;

        $version = CollectionVersion::create([
            'collection_id' => $collection->id,
            'version_number' => $versionNumber,
            'data' => [
                'name' => $collection->name,
                'description' => $collection->description,
                'data' => $collection->data,
            ],
            'description' => $request->description,
            'created_by_id' => Auth::id(),
        ]);

        // Update collection's current version
        $collection->update(['current_version_id' => $version->id]);

        return response()->json($version->load('createdBy'), 201);
    }

    /**
     * Get a specific version
     */
    public function getVersion($id, $versionId)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->orWhereHas('shares', function ($query) {
                $query->where('shared_with_user_id', Auth::id());
            })
            ->findOrFail($id);

        $version = CollectionVersion::where('collection_id', $collection->id)
            ->where('id', $versionId)
            ->with('createdBy')
            ->firstOrFail();

        return response()->json($version);
    }

    /**
     * Restore collection to a specific version
     */
    public function restoreVersion($id, $versionId)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $version = CollectionVersion::where('collection_id', $collection->id)
            ->where('id', $versionId)
            ->firstOrFail();

        // Restore collection data
        $collection->update([
            'name' => $version->data['name'] ?? $collection->name,
            'description' => $version->data['description'] ?? $collection->description,
            'data' => $version->data['data'] ?? $collection->data,
            'current_version_id' => $version->id,
        ]);

        return response()->json(['message' => 'Collection restored to version ' . $version->version_number]);
    }

    /**
     * Lấy default collection của user hiện tại
     */
    public function getDefault()
    {
        $defaultCollection = Collection::getDefaultCollection(Auth::id());
        
        if (!$defaultCollection) {
            return response()->json([
                'message' => 'Default collection not found',
            ], 404);
        }

        return response()->json($defaultCollection->load([
            'user',
            'permissions' => function ($query) {
                $query->with('user');
            }
        ]));
    }

    /**
     * Set collection làm default
     */
    public function setDefault($id)
    {
        $collection = Collection::where('user_id', Auth::id())
            ->findOrFail($id);

        $collection->setAsDefault();

        // Invalidate cache
        Cache::forget($this->getUserCacheKey('collections', Auth::id()));

        return response()->json([
            'message' => 'Collection set as default successfully',
            'collection' => $collection->load([
                'user',
                'permissions' => function ($query) {
                    $query->with('user');
                }
            ]),
        ]);
    }

    /**
     * Get templates (all user templates)
     */
    public function getTemplates(Request $request)
    {
        $query = Collection::where('user_id', Auth::id())
            ->where('is_template', true)
            ->with([
                'user',
                'permissions' => function ($query) {
                    $query->with('user');
                }
            ])
            ->orderBy('updated_at', 'desc');

        // Filter by category
        if ($request->has('category') && $request->category) {
            $query->where('template_category', $request->category);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Pagination
        if ($request->has('page') || $request->has('per_page')) {
            return $this->paginate($query, $request);
        }

        return response()->json($query->get());
    }
}

