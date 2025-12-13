<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|regex:/^[a-zA-Z0-9\s\-_]+$/', // Alphanumeric và spaces only
            'email' => 'required|string|email|max:255|unique:users|regex:/^[^\s@]+@[^\s@]+\.[^\s@]+$/',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', // At least one lowercase, uppercase, and number
        ], [
            'password.regex' => 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token', ['*'], now()->addHours(1))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'refresh_token' => $refreshToken,
            'expires_at' => now()->addHours(1)->toIso8601String(),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token', ['*'], now()->addHours(1))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'refresh_token' => $refreshToken,
            'expires_at' => now()->addHours(1)->toIso8601String(),
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Refresh access token using refresh token
     */
    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        // Find token in database
        $token = \Laravel\Sanctum\PersonalAccessToken::findToken($request->refresh_token);
        
        if (!$token) {
            return response()->json(['message' => 'Invalid refresh token'], 401);
        }

        $user = $token->tokenable;

        // Delete old token
        $token->delete();

        // Create new token
        $newToken = $user->createToken('auth_token')->plainTextToken;
        
        // Create refresh token (longer expiry)
        $refreshToken = $user->createToken('refresh_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'token' => $newToken,
            'refresh_token' => $refreshToken,
            'expires_at' => now()->addHours(1)->toIso8601String(),
        ]);
    }
}

