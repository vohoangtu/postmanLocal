<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     * Remove workspace_id từ tasks table, ensure collection_id is required
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // SQLite không hỗ trợ drop column trực tiếp nếu có index liên quan
        if ($driver === 'sqlite') {
            \Log::info('Skipping workspace_id column drop from tasks for SQLite - will be handled in drop_workspace_tables migration');
            return;
        }

        Schema::table('tasks', function (Blueprint $table) {
            // Drop foreign key và index trước
            try {
                $table->dropForeign(['workspace_id']);
            } catch (\Exception $e) {
                // Ignore
            }
            try {
                $table->dropIndex(['workspace_id', 'status']);
            } catch (\Exception $e) {
                // Ignore
            }
            // Drop column
            if (Schema::hasColumn('tasks', 'workspace_id')) {
                $table->dropColumn('workspace_id');
            }
            
            // Ensure collection_id is required (not nullable)
            if (Schema::hasColumn('tasks', 'collection_id')) {
                $table->uuid('collection_id')->nullable(false)->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Make collection_id nullable again
            $table->uuid('collection_id')->nullable()->change();
            
            // Add workspace_id back
            $table->uuid('workspace_id')->after('id');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->index(['workspace_id', 'status']);
        });
    }
};
