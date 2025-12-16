<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Thêm indexes để cải thiện query performance
     */
    public function up(): void
    {
        // Collections table indexes
        Schema::table('collections', function (Blueprint $table) {
            if (!$this->hasIndex('collections', 'collections_user_id_index')) {
                $table->index('user_id', 'collections_user_id_index');
            }
            if (!$this->hasIndex('collections', 'collections_workspace_id_index')) {
                $table->index('workspace_id', 'collections_workspace_id_index');
            }
            if (!$this->hasIndex('collections', 'collections_updated_at_index')) {
                $table->index('updated_at', 'collections_updated_at_index');
            }
            if (!$this->hasIndex('collections', 'collections_is_shared_index')) {
                $table->index('is_shared', 'collections_is_shared_index');
            }
        });

        // Collection shares indexes
        Schema::table('collection_shares', function (Blueprint $table) {
            if (!$this->hasIndex('collection_shares', 'collection_shares_collection_id_index')) {
                $table->index('collection_id', 'collection_shares_collection_id_index');
            }
            if (!$this->hasIndex('collection_shares', 'collection_shares_shared_with_user_id_index')) {
                $table->index('shared_with_user_id', 'collection_shares_shared_with_user_id_index');
            }
        });

        // Collection versions indexes
        Schema::table('collection_versions', function (Blueprint $table) {
            if (!$this->hasIndex('collection_versions', 'collection_versions_collection_id_index')) {
                $table->index('collection_id', 'collection_versions_collection_id_index');
            }
            if (!$this->hasIndex('collection_versions', 'collection_versions_version_number_index')) {
                $table->index('version_number', 'collection_versions_version_number_index');
            }
        });

        // Comments indexes
        Schema::table('comments', function (Blueprint $table) {
            if (!$this->hasIndex('comments', 'comments_collection_id_index')) {
                $table->index('collection_id', 'comments_collection_id_index');
            }
            if (!$this->hasIndex('comments', 'comments_user_id_index')) {
                $table->index('user_id', 'comments_user_id_index');
            }
            if (!$this->hasIndex('comments', 'comments_parent_id_index')) {
                $table->index('parent_id', 'comments_parent_id_index');
            }
            if (!$this->hasIndex('comments', 'comments_created_at_index')) {
                $table->index('created_at', 'comments_created_at_index');
            }
        });

        // Workspaces indexes
        Schema::table('workspaces', function (Blueprint $table) {
            if (!$this->hasIndex('workspaces', 'workspaces_owner_id_index')) {
                $table->index('owner_id', 'workspaces_owner_id_index');
            }
        });

        // Team members indexes
        Schema::table('team_members', function (Blueprint $table) {
            if (!$this->hasIndex('team_members', 'team_members_team_id_index')) {
                $table->index('team_id', 'team_members_team_id_index');
            }
            if (!$this->hasIndex('team_members', 'team_members_user_id_index')) {
                $table->index('user_id', 'team_members_user_id_index');
            }
        });

        // Notifications indexes
        Schema::table('notifications', function (Blueprint $table) {
            if (!$this->hasIndex('notifications', 'notifications_user_id_index')) {
                $table->index('user_id', 'notifications_user_id_index');
            }
            if (!$this->hasIndex('notifications', 'notifications_read_at_index')) {
                $table->index('read_at', 'notifications_read_at_index');
            }
        });

        // Activity logs indexes
        Schema::table('activity_logs', function (Blueprint $table) {
            if (!$this->hasIndex('activity_logs', 'activity_logs_user_id_index')) {
                $table->index('user_id', 'activity_logs_user_id_index');
            }
            if (!$this->hasIndex('activity_logs', 'activity_logs_workspace_id_index')) {
                $table->index('workspace_id', 'activity_logs_workspace_id_index');
            }
            if (!$this->hasIndex('activity_logs', 'activity_logs_created_at_index')) {
                $table->index('created_at', 'activity_logs_created_at_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->dropIndex('collections_user_id_index');
            $table->dropIndex('collections_workspace_id_index');
            $table->dropIndex('collections_updated_at_index');
            $table->dropIndex('collections_is_shared_index');
        });

        Schema::table('collection_shares', function (Blueprint $table) {
            $table->dropIndex('collection_shares_collection_id_index');
            $table->dropIndex('collection_shares_shared_with_user_id_index');
        });

        Schema::table('collection_versions', function (Blueprint $table) {
            $table->dropIndex('collection_versions_collection_id_index');
            $table->dropIndex('collection_versions_version_number_index');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex('comments_collection_id_index');
            $table->dropIndex('comments_user_id_index');
            $table->dropIndex('comments_parent_id_index');
            $table->dropIndex('comments_created_at_index');
        });

        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropIndex('workspaces_owner_id_index');
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->dropIndex('team_members_team_id_index');
            $table->dropIndex('team_members_user_id_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_user_id_index');
            $table->dropIndex('notifications_read_at_index');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('activity_logs_user_id_index');
            $table->dropIndex('activity_logs_workspace_id_index');
            $table->dropIndex('activity_logs_created_at_index');
        });
    }

    /**
     * Check if index exists (compatible with SQLite and MySQL)
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();
        
        try {
            if ($driver === 'sqlite') {
                // SQLite: Query sqlite_master table
                $result = $connection->select(
                    "SELECT name FROM sqlite_master 
                     WHERE type = 'index' AND name = ? AND tbl_name = ?",
                    [$indexName, $table]
                );
                return count($result) > 0;
            } else {
                // MySQL/PostgreSQL: Use information_schema
                $database = $connection->getDatabaseName();
                $result = $connection->select(
                    "SELECT COUNT(*) as count FROM information_schema.statistics 
                     WHERE table_schema = ? AND table_name = ? AND index_name = ?",
                    [$database, $table, $indexName]
                );
                return $result[0]->count > 0;
            }
        } catch (\Exception $e) {
            // Nếu có lỗi, giả sử index chưa tồn tại
            return false;
        }
    }
};
