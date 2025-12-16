<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tạo bảng api_templates để quản lý API design templates
     */
    public function up(): void
    {
        Schema::create('api_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('category'); // REST, GraphQL, gRPC, etc.
            $table->text('description')->nullable();
            $table->json('template_data'); // OpenAPI schema template
            $table->boolean('is_public')->default(false);
            $table->uuid('created_by_id')->nullable();
            $table->timestamps();

            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['category', 'is_public']);
        });
    }

    /**
     * Revert migration
     */
    public function down(): void
    {
        Schema::dropIfExists('api_templates');
    }
};
