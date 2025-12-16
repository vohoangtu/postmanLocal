<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('collection_id');
            $table->integer('version_number');
            $table->json('data'); // Snapshot of collection data
            $table->text('description')->nullable();
            $table->uuid('created_by_id');
            $table->timestamps();
            
            $table->foreign('collection_id')->references('id')->on('collections')->onDelete('cascade');
            $table->foreign('created_by_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['collection_id', 'version_number']);
            $table->index(['collection_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_versions');
    }
};




