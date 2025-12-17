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
     * Add collection_id to discussions, remove workspace_id
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // SQLite không hỗ trợ drop column trực tiếp nếu có index liên quan
        // Sẽ được xử lý trong migration drop_workspace_tables
        if ($driver === 'sqlite') {
            \Log::info('Skipping workspace_id column drop from discussions for SQLite - will be handled in drop_workspace_tables migration');
            // Chỉ thêm collection_id nếu chưa có
            if (!Schema::hasColumn('discussions', 'collection_id')) {
                Schema::table('discussions', function (Blueprint $table) {
                    $table->uuid('collection_id')->nullable()->after('id');
                    $table->foreign('collection_id')->references('id')->on('collections')->onDelete('cascade');
                    $table->index(['collection_id', 'resolved']);
                });
            }
            return;
        }

        Schema::table('discussions', function (Blueprint $table) {
            // Drop foreign key và index trước
            try {
                $table->dropForeign(['workspace_id']);
            } catch (\Exception $e) {
                // Ignore
            }
            try {
                $table->dropIndex(['workspace_id', 'resolved']);
            } catch (\Exception $e) {
                // Ignore
            }
            
            // Add collection_id column
            if (!Schema::hasColumn('discussions', 'collection_id')) {
                $table->uuid('collection_id')->nullable()->after('id');
                $table->foreign('collection_id')->references('id')->on('collections')->onDelete('cascade');
                $table->index(['collection_id', 'resolved']);
            }
            
            // Drop workspace_id column
            if (Schema::hasColumn('discussions', 'workspace_id')) {
                $table->dropColumn('workspace_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('discussions', function (Blueprint $table) {
            // Drop collection_id
            $table->dropForeign(['collection_id']);
            $table->dropIndex(['collection_id', 'resolved']);
            $table->dropColumn('collection_id');
            
            // Add workspace_id back
            $table->uuid('workspace_id')->after('id');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->index(['workspace_id', 'resolved']);
        });
    }
};
