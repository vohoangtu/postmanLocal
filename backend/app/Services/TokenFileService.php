<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserToken;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

/**
 * Token File Service
 * Generate và decrypt token files
 */
class TokenFileService
{
    /**
     * Generate token file cho user
     * 
     * @param User $user
     * @return array ['content' => string, 'filename' => string]
     */
    public function generateTokenFile(User $user): array
    {
        // Tạo token mới
        $token = UserToken::generateToken();
        
        // Lưu token vào database (chưa encrypt trong DB, sẽ encrypt trong file)
        $userToken = UserToken::create([
            'user_id' => $user->id,
            'token' => hash('sha256', $token), // Lưu hash trong DB để verify
        ]);

        // Tạo data để encrypt
        $tokenData = [
            'token' => $token, // Plain token để client dùng
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_name' => $user->name,
            'created_at' => now()->toIso8601String(),
            'token_id' => $userToken->id,
        ];

        // Encrypt data
        $encryptedData = $this->encryptTokenData($tokenData);

        // Tạo JSON structure
        $fileContent = [
            'version' => '1.0',
            'type' => 'postmanlocal_token',
            'encrypted_data' => $encryptedData,
            'created_at' => now()->toIso8601String(),
        ];

        $filename = str_replace(['@', '.'], ['_', '_'], $user->email) . '_token.json';

        return [
            'content' => json_encode($fileContent, JSON_PRETTY_PRINT),
            'filename' => $filename,
            'token_id' => $userToken->id,
        ];
    }

    /**
     * Encrypt token data
     * 
     * @param array $data
     * @return string Encrypted string
     */
    public function encryptTokenData(array $data): string
    {
        $jsonData = json_encode($data);
        return Crypt::encryptString($jsonData);
    }

    /**
     * Decrypt và parse token file
     * 
     * @param string $fileContent JSON file content
     * @return array Decrypted token data
     * @throws \Exception Nếu file invalid hoặc decrypt fail
     */
    public function decryptTokenFile(string $fileContent): array
    {
        // Parse JSON
        $fileData = json_decode($fileContent, true);
        
        if (!$fileData || !isset($fileData['encrypted_data'])) {
            throw new \Exception('Invalid token file format');
        }

        // Decrypt data
        try {
            $decryptedJson = Crypt::decryptString($fileData['encrypted_data']);
            $tokenData = json_decode($decryptedJson, true);
            
            if (!$tokenData || !isset($tokenData['token'])) {
                throw new \Exception('Invalid token data');
            }
            
            return $tokenData;
        } catch (\Exception $e) {
            throw new \Exception('Failed to decrypt token file: ' . $e->getMessage());
        }
    }

    /**
     * Verify token từ decrypted data
     * 
     * @param array $tokenData
     * @return UserToken|null
     */
    public function verifyToken(array $tokenData): ?UserToken
    {
        if (!isset($tokenData['token_id']) || !isset($tokenData['token'])) {
            return null;
        }

        $userToken = UserToken::find($tokenData['token_id']);
        
        if (!$userToken) {
            return null;
        }

        // Verify token hash
        $tokenHash = hash('sha256', $tokenData['token']);
        if ($userToken->token !== $tokenHash) {
            return null;
        }

        return $userToken;
    }
}
