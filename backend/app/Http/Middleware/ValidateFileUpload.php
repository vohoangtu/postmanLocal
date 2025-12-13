<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validate File Upload Middleware
 * Validate file types, sizes, và scan for malware
 */
class ValidateFileUpload
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Chỉ validate nếu có file upload
        if (!$request->hasFile('file') && !$request->hasFile('files')) {
            return $next($request);
        }

        $config = config('files', []);
        $allowedTypes = $config['allowed_types'] ?? ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt', 'json', 'xml'];
        $maxSize = $config['max_size'] ?? 10485760; // 10MB default

        $files = $request->allFiles();
        
        foreach ($files as $file) {
            if (is_array($file)) {
                foreach ($file as $singleFile) {
                    $this->validateFile($singleFile, $allowedTypes, $maxSize);
                }
            } else {
                $this->validateFile($file, $allowedTypes, $maxSize);
            }
        }

        return $next($request);
    }

    /**
     * Validate single file
     */
    protected function validateFile($file, array $allowedTypes, int $maxSize): void
    {
        // Validate file size
        if ($file->getSize() > $maxSize) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                ['file' => ['File size vượt quá giới hạn cho phép (' . $this->formatBytes($maxSize) . ').']]
            );
        }

        // Validate file type
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();

        if (!in_array($extension, $allowedTypes)) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                ['file' => ['File type không được phép. Chỉ chấp nhận: ' . implode(', ', $allowedTypes) . '.']]
            );
        }

        // Validate MIME type
        $allowedMimeTypes = $this->getMimeTypesForExtensions($allowedTypes);
        if (!in_array($mimeType, $allowedMimeTypes)) {
            throw new \Illuminate\Validation\ValidationException(
                validator([], []),
                ['file' => ['File type không hợp lệ.']]
            );
        }

        // TODO: Scan for malware nếu có thể
        // $this->scanForMalware($file);
    }

    /**
     * Get MIME types for extensions
     */
    protected function getMimeTypesForExtensions(array $extensions): array
    {
        $mimeTypes = [
            'jpg' => ['image/jpeg'],
            'jpeg' => ['image/jpeg'],
            'png' => ['image/png'],
            'gif' => ['image/gif'],
            'pdf' => ['application/pdf'],
            'txt' => ['text/plain'],
            'json' => ['application/json'],
            'xml' => ['application/xml', 'text/xml'],
        ];

        $result = [];
        foreach ($extensions as $ext) {
            if (isset($mimeTypes[$ext])) {
                $result = array_merge($result, $mimeTypes[$ext]);
            }
        }

        return array_unique($result);
    }

    /**
     * Format bytes to human readable
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
