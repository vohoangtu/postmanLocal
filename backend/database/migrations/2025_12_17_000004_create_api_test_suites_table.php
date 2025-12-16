<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tạo bảng api_test_suites để quản lý test suites
     */
    public function up(): void
    {
        Schema::create('api_test_suites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('schema_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('test_config');
            $table->json('results')->nullable();
            $table->enum('status', ['pending', 'running', 'passed', 'failed', 'error'])->default('pending');
            $table->uuid('created_by_id');
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('set null');
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['workspace_id', 'status']);
            $table->index(['schema_id']);
        });
    }

    /**
     * Revert migration
     */
    public function down(): void
    {
        Schema::dropIfExists('api_test_suites');
    }
};
