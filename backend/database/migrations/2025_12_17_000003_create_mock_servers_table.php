<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tạo bảng mock_servers để quản lý mock servers
     */
    public function up(): void
    {
        Schema::create('mock_servers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('schema_id')->nullable();
            $table->string('name');
            $table->string('base_url')->default('http://localhost');
            $table->integer('port')->default(3000);
            $table->boolean('is_active')->default(false);
            $table->json('config')->nullable();
            $table->uuid('created_by_id');
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('set null');
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['workspace_id', 'is_active']);
        });
    }

    /**
     * Revert migration
     */
    public function down(): void
    {
        Schema::dropIfExists('mock_servers');
    }
};
