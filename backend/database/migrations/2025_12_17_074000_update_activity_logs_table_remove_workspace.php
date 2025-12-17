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
     * Remove workspace_id từ activity_logs table
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // SQLite không hỗ trợ drop column trực tiếp nếu có index liên quan
        if ($driver === 'sqlite') {
            \Log::info('Skipping workspace_id column drop from activity_logs for SQLite - will be handled in drop_workspace_tables migration');
            return;
        }

        Schema::table('activity_logs', function (Blueprint $table) {
            // Drop foreign key và index trước
            try {
                $table->dropForeign(['workspace_id']);
            } catch (\Exception $e) {
                // Ignore
            }
            try {
                $table->dropIndex(['workspace_id', 'created_at']);
            } catch (\Exception $e) {
                // Ignore
            }
            // Drop column
            if (Schema::hasColumn('activity_logs', 'workspace_id')) {
                $table->dropColumn('workspace_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            // Add workspace_id back
            $table->uuid('workspace_id')->nullable()->after('id');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->index(['workspace_id', 'created_at']);
        });
    }
};
