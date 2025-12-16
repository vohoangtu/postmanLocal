<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tạo bảng api_versions để quản lý phiên bản API
     */
    public function up(): void
    {
        Schema::create('api_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('schema_id');
            $table->integer('version_number')->default(1);
            $table->string('version_name')->nullable();
            $table->text('changelog')->nullable();
            $table->json('schema_data');
            $table->boolean('is_current')->default(false);
            $table->uuid('created_by_id');
            $table->timestamps();

            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('cascade');
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['schema_id', 'version_number']);
            $table->index(['schema_id', 'is_current']);
        });
    }

    /**
     * Revert migration
     */
    public function down(): void
    {
        Schema::dropIfExists('api_versions');
    }
};
