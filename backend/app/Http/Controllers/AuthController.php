<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PasswordReset;
use App\Services\SecurityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    protected SecurityLogger $securityLogger;

    public function __construct(SecurityLogger $securityLogger)
    {
        $this->securityLogger = $securityLogger;
    }
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
            'two_factor_code' => 'nullable|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        // Kiểm tra account lockout
        if ($user && $user->isLocked()) {
            $this->securityLogger->logLoginFailure($request->email, $request, 'account_locked');
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đã bị khóa. Vui lòng thử lại sau ' . $user->locked_until->diffForHumans() . '.'],
            ]);
        }

        // Kiểm tra credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                $user->incrementFailedAttempts();
                if ($user->isLocked()) {
                    $this->securityLogger->logAccountLockout($user->id, $request);
                }
            }
            $this->securityLogger->logLoginFailure($request->email, $request, 'invalid_credentials');
            throw ValidationException::withMessages([
                'email' => ['Thông tin đăng nhập không chính xác.'],
            ]);
        }

        // Kiểm tra 2FA nếu đã bật
        if ($user->two_factor_enabled) {
            if (!$request->has('two_factor_code')) {
                return response()->json([
                    'requires_2fa' => true,
                    'message' => 'Vui lòng nhập mã xác thực 2FA.',
                ], 200);
            }

            $google2fa = new Google2FA();
            $valid = $google2fa->verifyKey($user->two_factor_secret, $request->two_factor_code);

            if (!$valid) {
                // Kiểm tra recovery codes
                $recoveryCodes = $user->two_factor_recovery_codes ?? [];
                if (!in_array($request->two_factor_code, $recoveryCodes)) {
                    $this->securityLogger->logLoginFailure($request->email, $request, 'invalid_2fa_code');
                    throw ValidationException::withMessages([
                        'two_factor_code' => ['Mã xác thực không hợp lệ.'],
                    ]);
                } else {
                    // Xóa recovery code đã sử dụng
                    $recoveryCodes = array_values(array_diff($recoveryCodes, [$request->two_factor_code]));
                    $user->update(['two_factor_recovery_codes' => $recoveryCodes]);
                }
            }
        }

        // Reset failed attempts sau khi login thành công
        $user->resetFailedAttempts();
        $user->unlock();

        $token = $user->createToken('auth_token', ['*'], now()->addHours(1))->plainTextToken;
        $refreshToken = $user->createToken('refresh_token', ['*'], now()->addDays(30))->plainTextToken;

        $this->securityLogger->logLoginSuccess($user->id, $request);

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
        $user = $request->user();
        $tokenId = $user->currentAccessToken()->id;
        
        // Revoke current token
        $user->currentAccessToken()->delete();
        
        $this->securityLogger->logTokenRevoked($user->id, $request, (string)$tokenId);

        return response()->json(['message' => 'Đăng xuất thành công']);
    }

    /**
     * Revoke all tokens của user
     */
    public function revokeAllTokens(Request $request)
    {
        $user = $request->user();
        
        // Revoke tất cả tokens
        $user->tokens()->delete();
        
        $this->securityLogger->logTokenRevoked($user->id, $request, 'all');

        return response()->json(['message' => 'Đã thu hồi tất cả tokens']);
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
            return response()->json(['message' => 'Refresh token không hợp lệ'], 401);
        }

        $user = $token->tokenable;

        // Delete old token
        $token->delete();

        // Create new token
        $newToken = $user->createToken('auth_token', ['*'], now()->addHours(1))->plainTextToken;
        
        // Create refresh token (longer expiry)
        $refreshToken = $user->createToken('refresh_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'token' => $newToken,
            'refresh_token' => $refreshToken,
            'expires_at' => now()->addHours(1)->toIso8601String(),
        ]);
    }

    /**
     * Request password reset
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            // Không tiết lộ email có tồn tại hay không
            return response()->json([
                'message' => 'Nếu email tồn tại, chúng tôi đã gửi link reset password.',
            ]);
        }

        // Tạo reset token
        $token = PasswordReset::createToken($user->email);
        
        $this->securityLogger->logPasswordResetRequest($user->email, $request);

        // TODO: Gửi email với reset link
        // Mail::to($user->email)->send(new PasswordResetMail($token));

        // Trong môi trường development, trả về token (chỉ để test)
        if (config('app.env') === 'local') {
            return response()->json([
                'message' => 'Password reset token đã được tạo (chỉ trong development)',
                'token' => $token, // Chỉ trong development
            ]);
        }

        return response()->json([
            'message' => 'Nếu email tồn tại, chúng tôi đã gửi link reset password.',
        ]);
    }

    /**
     * Reset password với token
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/',
        ], [
            'password.regex' => 'Password phải chứa ít nhất một chữ hoa, một chữ thường và một số.',
        ]);

        // Verify token
        if (!PasswordReset::verifyToken($request->email, $request->token)) {
            throw ValidationException::withMessages([
                'token' => ['Token không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            throw ValidationException::withMessages([
                'email' => ['Email không tồn tại.'],
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Xóa token đã sử dụng
        PasswordReset::deleteToken($user->email);

        // Revoke tất cả tokens cũ
        $user->tokens()->delete();

        $this->securityLogger->logPasswordResetSuccess($user->id, $request);

        return response()->json([
            'message' => 'Password đã được reset thành công.',
        ]);
    }

    /**
     * Enable 2FA
     */
    public function enable2FA(Request $request)
    {
        $user = $request->user();
        
        if ($user->two_factor_enabled) {
            return response()->json(['message' => '2FA đã được bật'], 400);
        }

        $google2fa = new Google2FA();
        $secret = $google2fa->generateSecretKey();
        
        // Generate recovery codes
        $recoveryCodes = [];
        for ($i = 0; $i < 10; $i++) {
            $recoveryCodes[] = bin2hex(random_bytes(4));
        }

        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => $recoveryCodes,
        ]);

        // Generate QR code URL
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'PostmanLocal'),
            $user->email,
            $secret
        );

        $this->securityLogger->log2FAEnabled($user->id, $request);

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Verify và enable 2FA
     */
    public function verify2FA(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        
        if (!$user->two_factor_secret) {
            return response()->json(['message' => '2FA chưa được setup'], 400);
        }

        $google2fa = new Google2FA();
        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (!$valid) {
            throw ValidationException::withMessages([
                'code' => ['Mã xác thực không hợp lệ.'],
            ]);
        }

        $user->update(['two_factor_enabled' => true]);
        $this->securityLogger->log2FAEnabled($user->id, $request);

        return response()->json([
            'message' => '2FA đã được kích hoạt thành công.',
        ]);
    }

    /**
     * Disable 2FA
     */
    public function disable2FA(Request $request)
    {
        $user = $request->user();
        
        if (!$user->two_factor_enabled) {
            return response()->json(['message' => '2FA chưa được bật'], 400);
        }

        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
        ]);

        $this->securityLogger->log2FADisabled($user->id, $request);

        return response()->json([
            'message' => '2FA đã được tắt.',
        ]);
    }

    /**
     * Generate recovery codes mới
     */
    public function generateRecoveryCodes(Request $request)
    {
        $user = $request->user();
        
        if (!$user->two_factor_enabled) {
            return response()->json(['message' => '2FA chưa được bật'], 400);
        }

        $recoveryCodes = [];
        for ($i = 0; $i < 10; $i++) {
            $recoveryCodes[] = bin2hex(random_bytes(4));
        }

        $user->update(['two_factor_recovery_codes' => $recoveryCodes]);

        return response()->json([
            'recovery_codes' => $recoveryCodes,
        ]);
    }
}

