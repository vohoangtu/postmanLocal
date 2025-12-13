<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained()->onDelete('cascade');
            $table->integer('version_number');
            $table->json('data'); // Snapshot of collection data
            $table->text('description')->nullable();
            $table->foreignId('created_by_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['collection_id', 'version_number']);
            $table->index(['collection_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_versions');
    }
};


