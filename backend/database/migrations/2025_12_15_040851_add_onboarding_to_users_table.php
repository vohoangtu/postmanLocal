<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('onboarding')->nullable()->after('preferences');
        });

        // Set default onboarding cho users hiện tại (đã hoàn thành)
        \DB::table('users')->whereNull('onboarding')->update([
            'onboarding' => json_encode([
                'completed' => true,
                'current_step' => 'complete',
                'completed_steps' => ['welcome', 'create_request', 'send_request', 'explore_features', 'complete'],
                'started_at' => now()->toDateTimeString(),
                'completed_at' => now()->toDateTimeString(),
            ])
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('onboarding');
        });
    }
};
