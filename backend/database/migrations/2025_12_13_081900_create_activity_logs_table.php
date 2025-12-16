<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('action', ['created', 'updated', 'deleted', 'shared', 'commented', 'annotated'])->default('updated');
            $table->string('entity_type'); // 'collection', 'request', 'comment', etc.
            $table->unsignedBigInteger('entity_id');
            $table->json('metadata')->nullable(); // Additional data about the action
            $table->timestamps();
            
            $table->index(['workspace_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};




