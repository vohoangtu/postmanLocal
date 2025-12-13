<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->boolean('is_template')->default(false)->after('is_shared');
            $table->string('template_category')->nullable()->after('is_template');
            $table->text('template_tags')->nullable()->after('template_category'); // JSON array
        });
    }

    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->dropColumn(['is_template', 'template_category', 'template_tags']);
        });
    }
};


