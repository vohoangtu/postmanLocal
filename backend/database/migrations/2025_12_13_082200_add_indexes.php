<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Collections indexes
        Schema::table('collections', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('workspace_id');
            $table->index('is_shared');
            $table->index('is_template');
            $table->index(['user_id', 'workspace_id']);
        });

        // Workspaces indexes
        Schema::table('workspaces', function (Blueprint $table) {
            $table->index('owner_id');
            $table->index('is_team');
        });

        // Team members indexes
        Schema::table('team_members', function (Blueprint $table) {
            $table->index('workspace_id');
            $table->index('user_id');
            $table->index('role');
        });

        // Collection shares indexes
        Schema::table('collection_shares', function (Blueprint $table) {
            $table->index('collection_id');
            $table->index('shared_with_user_id');
        });

        // Comments indexes
        Schema::table('comments', function (Blueprint $table) {
            $table->index('collection_id');
            $table->index('user_id');
            $table->index('parent_id');
            $table->index('created_at');
        });

        // Annotations indexes
        Schema::table('annotations', function (Blueprint $table) {
            $table->index('request_id');
            $table->index('user_id');
        });

        // Activity logs indexes (already have indexes from migration)
        // Notifications indexes
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['user_id', 'read_at']);
            $table->index('created_at');
        });

        // Collection versions indexes
        Schema::table('collection_versions', function (Blueprint $table) {
            $table->index(['collection_id', 'version_number']);
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

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'read_at']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('collection_versions', function (Blueprint $table) {
            $table->dropIndex(['collection_id', 'version_number']);
            $table->dropIndex(['created_at']);
        });
    }
};


