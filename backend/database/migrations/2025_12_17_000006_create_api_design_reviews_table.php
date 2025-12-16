<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tạo bảng api_design_reviews để quản lý design reviews
     */
    public function up(): void
    {
        Schema::create('api_design_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('schema_id');
            $table->uuid('workspace_id');
            $table->uuid('requested_by_id');
            $table->uuid('reviewer_id')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'changes_requested'])->default('pending');
            $table->text('comments')->nullable();
            $table->json('review_data')->nullable(); // Lưu schema data tại thời điểm review
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('cascade');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('requested_by_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('reviewer_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['schema_id', 'status']);
            $table->index(['workspace_id', 'status']);
        });
    }

    /**
     * Revert migration
     */
    public function down(): void
    {
        Schema::dropIfExists('api_design_reviews');
    }
};
