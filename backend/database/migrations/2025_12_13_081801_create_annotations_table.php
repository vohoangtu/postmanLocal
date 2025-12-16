<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            // request_id không có foreign key vì bảng requests không tồn tại
            // Requests được lưu trong JSON data của collection
            $table->string('request_id');
            $table->uuid('user_id');
            $table->enum('type', ['note', 'highlight'])->default('note');
            $table->text('content');
            $table->json('position')->nullable(); // Store position data (line, column, etc.)
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annotations');
    }
};



