<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * User Profile Controller
 * Quản lý profile và preferences cho user
 */
class ProfileController extends Controller
{
    /**
     * Get user profile
     */
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json($user);
    }

    /**
     * Update profile
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($request->only(['name', 'email']));

        return response()->json($user->fresh());
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/|confirmed',
        ], [
            'password.regex' => 'Password phải chứa ít nhất một chữ hoa, một chữ thường và một số.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Mật khẩu hiện tại không đúng'], 400);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password đã được cập nhật']);
    }

    /**
     * Get preferences
     */
    public function getPreferences(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'preferences' => $user->preferences ?? [],
        ]);
    }

    /**
     * Update preferences
     */
    public function updatePreferences(Request $request)
    {
        $request->validate([
            'preferences' => 'required|array',
        ]);

        $user = $request->user();
        $user->update([
            'preferences' => $request->preferences,
        ]);

        return response()->json([
            'preferences' => $user->preferences,
        ]);
    }
}
