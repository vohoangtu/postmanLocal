<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Base Model với UUID v7 support
 * Tất cả models nên extend từ BaseModel này để tự động sử dụng UUID v7
 */
abstract class BaseModel extends Model
{
    use HasUuids;

    /**
     * Loại khóa chính là string (UUID)
     */
    protected $keyType = 'string';

    /**
     * Không sử dụng auto-increment
     */
    public $incrementing = false;

    /**
     * Tên cột khóa chính
     */
    protected $primaryKey = 'id';

    /**
     * Generate UUID v7 mới khi tạo model
     * Laravel 12's HasUuids trait sẽ tự động sử dụng Str::uuid() 
     * mà mặc định là UUID v7
     */
    public function newUniqueId(): string
    {
        return (string) Str::uuid();
    }

    /**
     * Lấy tên cột để lưu UUID
     */
    public function uniqueIds(): array
    {
        return ['id'];
    }
}
