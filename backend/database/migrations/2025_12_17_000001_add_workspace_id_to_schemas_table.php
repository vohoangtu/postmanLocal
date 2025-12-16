<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Thêm workspace_id vào bảng schemas để hỗ trợ workspace-level schemas
     */
    public function up(): void
    {
        Schema::table('schemas', function (Blueprint $table) {
            $table->uuid('workspace_id')->nullable()->after('user_id');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->index(['workspace_id', 'user_id']);
        });
    }

    /**
     * Revert migration
     */
    public function down(): void
    {
        Schema::table('schemas', function (Blueprint $table) {
            $table->dropForeign(['workspace_id']);
            $table->dropIndex(['workspace_id', 'user_id']);
            $table->dropColumn('workspace_id');
        });
    }
};
