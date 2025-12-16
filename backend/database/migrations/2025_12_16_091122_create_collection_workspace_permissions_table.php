<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
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
            // Đảm bảo mỗi user chỉ có 1 permission record cho mỗi collection trong workspace
            $table->unique(['collection_id', 'workspace_id', 'user_id']);
            
            // Indexes cho performance
            $table->index(['collection_id', 'workspace_id']);
            $table->index(['workspace_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('collection_workspace_permissions');
    }
};
