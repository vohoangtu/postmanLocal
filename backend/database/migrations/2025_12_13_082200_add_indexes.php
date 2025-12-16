<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Helper function để tạo index an toàn
        $addIndexSafely = function ($tableName, $indexName, $callback) {
            if (!Schema::hasTable($tableName)) {
                return;
            }
            
            try {
                Schema::table($tableName, function (Blueprint $table) use ($callback) {
                    $callback($table);
                });
            } catch (\Exception $e) {
                // Index đã tồn tại hoặc có lỗi khác, bỏ qua
                // Log để debug nếu cần
                // \Log::info("Index creation skipped for {$tableName}: " . $e->getMessage());
            }
        };

        // Collections indexes
        $addIndexSafely('collections', 'user_id', function ($table) {
            $table->index('user_id');
        });
        $addIndexSafely('collections', 'workspace_id', function ($table) {
            $table->index('workspace_id');
        });
        $addIndexSafely('collections', 'is_shared', function ($table) {
            $table->index('is_shared');
        });
        $addIndexSafely('collections', 'is_template', function ($table) {
            $table->index('is_template');
        });
        $addIndexSafely('collections', 'user_id_workspace_id', function ($table) {
            $table->index(['user_id', 'workspace_id']);
        });

        // Workspaces indexes
        $addIndexSafely('workspaces', 'owner_id', function ($table) {
            $table->index('owner_id');
        });
        $addIndexSafely('workspaces', 'is_team', function ($table) {
            $table->index('is_team');
        });

        // Team members indexes
        $addIndexSafely('team_members', 'workspace_id', function ($table) {
            $table->index('workspace_id');
        });
        $addIndexSafely('team_members', 'user_id', function ($table) {
            $table->index('user_id');
        });
        $addIndexSafely('team_members', 'role', function ($table) {
            $table->index('role');
        });

        // Collection shares indexes
        $addIndexSafely('collection_shares', 'collection_id', function ($table) {
            $table->index('collection_id');
        });
        $addIndexSafely('collection_shares', 'shared_with_user_id', function ($table) {
            $table->index('shared_with_user_id');
        });

        // Comments indexes
        $addIndexSafely('comments', 'collection_id', function ($table) {
            $table->index('collection_id');
        });
        $addIndexSafely('comments', 'user_id', function ($table) {
            $table->index('user_id');
        });
        $addIndexSafely('comments', 'parent_id', function ($table) {
            $table->index('parent_id');
        });
        $addIndexSafely('comments', 'created_at', function ($table) {
            $table->index('created_at');
        });

        // Annotations indexes
        $addIndexSafely('annotations', 'request_id', function ($table) {
            $table->index('request_id');
        });
        $addIndexSafely('annotations', 'user_id', function ($table) {
            $table->index('user_id');
        });

        // Notifications indexes - index ['user_id', 'read_at'] đã được tạo trong create_notifications_table migration
        $addIndexSafely('notifications', 'created_at', function ($table) {
            $table->index('created_at');
        });

        // Collection versions indexes
        $addIndexSafely('collection_versions', 'collection_id_version_number', function ($table) {
            $table->index(['collection_id', 'version_number']);
        });
        $addIndexSafely('collection_versions', 'created_at', function ($table) {
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['workspace_id']);
            $table->dropIndex(['is_shared']);
            $table->dropIndex(['is_template']);
            $table->dropIndex(['user_id', 'workspace_id']);
        });

        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropIndex(['owner_id']);
            $table->dropIndex(['is_team']);
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->dropIndex(['workspace_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['role']);
        });

        Schema::table('collection_shares', function (Blueprint $table) {
            $table->dropIndex(['collection_id']);
            $table->dropIndex(['shared_with_user_id']);
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['collection_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['parent_id']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('annotations', function (Blueprint $table) {
            $table->dropIndex(['request_id']);
            $table->dropIndex(['user_id']);
        });

        // Chỉ drop index created_at, index ['user_id', 'read_at'] sẽ được drop khi drop table
        Schema::table('notifications', function (Blueprint $table) {
            try {
                $table->dropIndex(['created_at']);
            } catch (\Exception $e) {
                // Index có thể không tồn tại, bỏ qua
            }
        });

        Schema::table('collection_versions', function (Blueprint $table) {
            $table->dropIndex(['collection_id', 'version_number']);
            $table->dropIndex(['created_at']);
        });
    }
};



