<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Password Reset Model
 * Quản lý password reset tokens
 */
class PasswordReset extends Model
{
    public $timestamps = false;
    
    protected $fillable = [
        'email',
        'token',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Tạo password reset token
     */
    public static function createToken(string $email): string
    {
        $token = bin2hex(random_bytes(32));
        $hashedToken = Hash::make($token);

        // Xóa các token cũ của email này
        static::where('email', $email)->delete();

        // Tạo token mới
        static::create([
            'email' => $email,
            'token' => $hashedToken,
            'created_at' => now(),
        ]);

        return $token;
    }

    /**
     * Verify token
     */
    public static function verifyToken(string $email, string $token): bool
    {
        $passwordReset = static::where('email', $email)
            ->where('created_at', '>', now()->subHour()) // Token hết hạn sau 1 giờ
            ->get()
            ->first(function ($record) use ($token) {
                return Hash::check($token, $record->token);
            });

        return $passwordReset !== null;
    }

    /**
     * Xóa token sau khi sử dụng
     */
    public static function deleteToken(string $email): void
    {
        static::where('email', $email)->delete();
    }

    /**
     * Xóa các token đã hết hạn
     */
    public static function deleteExpiredTokens(): void
    {
        static::where('created_at', '<', now()->subHour())->delete();
    }
}
