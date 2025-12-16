<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AdminAuditService;
use App\Services\SecurityLogger;
use App\Services\TokenFileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Admin User Controller
 * Quản lý users cho admin panel
 */
class UserController extends Controller
{
    protected AdminAuditService $auditService;
    protected SecurityLogger $securityLogger;
    protected TokenFileService $tokenFileService;

    public function __construct(
        AdminAuditService $auditService,
        SecurityLogger $securityLogger,
        TokenFileService $tokenFileService
    ) {
        $this->auditService = $auditService;
        $this->securityLogger = $securityLogger;
        $this->tokenFileService = $tokenFileService;
    }

    /**
     * List users với pagination và filters
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Filters
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('locked')) {
            if ($request->locked === 'true') {
                $query->whereNotNull('locked_until')
                      ->where('locked_until', '>', now());
            } else {
                $query->where(function ($q) {
                    $q->whereNull('locked_until')
                      ->orWhere('locked_until', '<=', now());
                });
            }
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Chi tiết user
     */
    public function show($id)
    {
        $user = User::with(['securityLogs' => function ($query) {
            $query->orderBy('created_at', 'desc')->limit(10);
        }])->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update user
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $admin = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => 'sometimes|in:user,admin,super_admin',
        ]);

        $oldData = $user->toArray();
        $user->update($request->only(['name', 'email', 'role']));

        // Log admin action
        $this->auditService->logAction($admin->id, 'user_updated', [
            'user_id' => $user->id,
            'old_data' => $oldData,
            'new_data' => $user->toArray(),
        ]);

        return response()->json($user);
    }

    /**
     * Delete user
     */
    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $admin = $request->user();

        // Không cho phép xóa chính mình
        if ($user->id === $admin->id) {
            return response()->json(['message' => 'Không thể xóa chính tài khoản của bạn'], 400);
        }

        $userData = $user->toArray();
        $user->delete();

        // Log admin action
        $this->auditService->logAction($admin->id, 'user_deleted', [
            'deleted_user_id' => $id,
            'deleted_user_data' => $userData,
        ]);

        return response()->json(['message' => 'User đã được xóa']);
    }

    /**
     * Lock user account
     */
    public function lock(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $admin = $request->user();

        $minutes = $request->get('minutes', 15);
        $user->lock($minutes);

        // Log admin action
        $this->auditService->logAction($admin->id, 'user_locked', [
            'user_id' => $user->id,
            'locked_until' => $user->locked_until,
        ]);

        $this->securityLogger->logAccountLockout($user->id, $request);

        return response()->json([
            'message' => 'Tài khoản đã bị khóa',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Unlock user account
     */
    public function unlock(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $admin = $request->user();

        $user->unlock();

        // Log admin action
        $this->auditService->logAction($admin->id, 'user_unlocked', [
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Tài khoản đã được mở khóa',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Reset password cho user
     */
    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $admin = $request->user();

        $request->validate([
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
        ], [
            'password.regex' => 'Password phải chứa ít nhất một chữ hoa, một chữ thường và một số.',
        ]);

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Revoke all tokens của user
        $user->tokens()->delete();

        // Log admin action
        $this->auditService->logAction($admin->id, 'user_password_reset', [
            'user_id' => $user->id,
        ]);

        $this->securityLogger->logPasswordResetSuccess($user->id, $request);

        return response()->json(['message' => 'Password đã được reset']);
    }

    /**
     * Generate token file cho user
     */
    public function generateTokenFile(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $admin = $request->user();

        // Generate token file
        $result = $this->tokenFileService->generateTokenFile($user);

        // Log admin action
        $this->auditService->logAction($admin->id, 'user_token_generated', [
            'user_id' => $user->id,
            'token_id' => $result['token_id'],
        ]);

        return response()->json([
            'message' => 'Token file đã được tạo thành công',
            'file_content' => $result['content'],
            'filename' => $result['filename'],
        ]);
    }
}
