<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     * Migrate collection_workspace_permissions → collection_permissions
     * Bỏ workspace_id, chỉ giữ collection_id và user_id
     */
    public function up(): void
    {
        // Tạo table mới collection_permissions
        Schema::create('collection_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('collection_id');
            $table->uuid('user_id');
            $table->enum('permission', ['read', 'write', 'admin'])->default('read');
            $table->timestamps();
            
            $table->foreign('collection_id')->references('id')->on('collections')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            // Đảm bảo mỗi user chỉ có 1 permission record cho mỗi collection
            $table->unique(['collection_id', 'user_id']);
            
            // Indexes cho performance
            $table->index(['collection_id']);
            $table->index(['user_id']);
        });

        // Migrate data từ collection_workspace_permissions sang collection_permissions
        // Copy tất cả records, bỏ workspace_id (chỉ nếu bảng tồn tại)
        if (Schema::hasTable('collection_workspace_permissions')) {
            try {
                DB::statement('
                    INSERT INTO collection_permissions (id, collection_id, user_id, permission, created_at, updated_at)
                    SELECT id, collection_id, user_id, permission, created_at, updated_at
                    FROM collection_workspace_permissions
                ');
            } catch (\Exception $e) {
                // Ignore nếu có lỗi migrate data
                \Log::warning('Could not migrate data from collection_workspace_permissions: ' . $e->getMessage());
            }
        }

        // Drop old table
        Schema::dropIfExists('collection_workspace_permissions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tạo lại collection_workspace_permissions table
        Schema::create('collection_workspace_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('collection_id');
            $table->uuid('workspace_id');
            $table->uuid('user_id');
            $table->enum('permission', ['read', 'write', 'admin'])->default('read');
            $table->timestamps();
            
            $table->foreign('collection_id')->references('id')->on('collections')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['collection_id', 'workspace_id', 'user_id']);
            $table->index(['collection_id', 'workspace_id']);
            $table->index(['workspace_id', 'user_id']);
        });

        // Migrate data back (cần workspace_id, sẽ set NULL hoặc default)
        // Note: Data loss có thể xảy ra vì không có workspace_id mapping
        DB::statement('
            INSERT INTO collection_workspace_permissions (id, collection_id, workspace_id, user_id, permission, created_at, updated_at)
            SELECT id, collection_id, NULL, user_id, permission, created_at, updated_at
            FROM collection_permissions
        ');

        // Drop new table
        Schema::dropIfExists('collection_permissions');
    }
};
