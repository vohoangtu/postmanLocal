<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Device Fingerprint Service
 * Generate và verify device fingerprint
 */
class DeviceFingerprintService
{
    /**
     * Generate device fingerprint từ request
     * 
     * @param Request $request
     * @return string Device fingerprint hash
     */
    public function generate(Request $request): string
    {
        // Collect device information
        $deviceInfo = [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'accept_language' => $request->header('Accept-Language', ''),
            'platform' => $request->header('X-Platform', ''),
            'screen_resolution' => $request->header('X-Screen-Resolution', ''),
            'timezone' => $request->header('X-Timezone', ''),
        ];

        // Tạo fingerprint từ các thông tin này
        $fingerprintString = implode('|', array_filter($deviceInfo));
        
        // Hash để tạo unique identifier
        return hash('sha256', $fingerprintString);
    }

    /**
     * Generate từ client-provided fingerprint
     * 
     * @param string $clientFingerprint
     * @return string
     */
    public function generateFromClient(string $clientFingerprint): string
    {
        // Nếu client đã gửi fingerprint, sử dụng nó
        // Có thể combine với server-side info để tăng security
        return hash('sha256', $clientFingerprint);
    }

    /**
     * Verify device fingerprint match
     * 
     * @param string $storedFingerprint
     * @param Request $request
     * @return bool
     */
    public function verify(string $storedFingerprint, Request $request): bool
    {
        $currentFingerprint = $this->generate($request);
        return hash_equals($storedFingerprint, $currentFingerprint);
    }

    /**
     * Verify với client-provided fingerprint
     * 
     * @param string $storedFingerprint
     * @param string $clientFingerprint
     * @return bool
     */
    public function verifyClient(string $storedFingerprint, string $clientFingerprint): bool
    {
        $hashedClient = $this->generateFromClient($clientFingerprint);
        return hash_equals($storedFingerprint, $hashedClient);
    }

    /**
     * Get device info từ request
     * 
     * @param Request $request
     * @return array
     */
    public function getDeviceInfo(Request $request): array
    {
        return [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'accept_language' => $request->header('Accept-Language', ''),
            'platform' => $request->header('X-Platform', ''),
            'screen_resolution' => $request->header('X-Screen-Resolution', ''),
            'timezone' => $request->header('X-Timezone', ''),
            'fingerprint' => $request->header('X-Device-Fingerprint', ''),
        ];
    }
}
