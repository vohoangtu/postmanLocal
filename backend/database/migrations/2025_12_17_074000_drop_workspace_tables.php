<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     * Drop workspace-related tables
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // Drop indexes liên quan đến workspace_id trước (cho SQLite)
        if ($driver === 'sqlite') {
            try {
                DB::statement('DROP INDEX IF EXISTS team_members_workspace_id_index');
            } catch (\Exception $e) {
                // Ignore
            }
        }
        
        // Drop workspace_members table trước (có foreign key đến workspaces)
        Schema::dropIfExists('workspace_members');
        
        // Drop workspaces table
        Schema::dropIfExists('workspaces');
        
        // Drop workspace_id columns từ các tables khác (cho SQLite)
        if ($driver === 'sqlite') {
            $tables = ['collections', 'discussions', 'tasks', 'activity_logs', 'request_reviews'];
            foreach ($tables as $table) {
                if (Schema::hasColumn($table, 'workspace_id')) {
                    try {
                        // SQLite cần recreate table để drop column
                        // Tạm thời bỏ qua, columns sẽ được ignore trong queries
                        \Log::info("Note: workspace_id column still exists in {$table} table (SQLite limitation)");
                    } catch (\Exception $e) {
                        \Log::warning("Could not drop workspace_id from {$table}: " . $e->getMessage());
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     * Note: Không thể restore data, chỉ tạo lại structure
     */
    public function down(): void
    {
        // Tạo lại workspaces table
        Schema::create('workspaces', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id'); // Owner
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('is_team')->default(false);
            $table->timestamps();
            
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('user_id');
        });

        // Tạo lại workspace_members table
        Schema::create('workspace_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('workspace_id');
            $table->uuid('user_id');
            $table->enum('role', ['admin', 'member', 'viewer'])->default('member');
            $table->timestamps();
            
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['workspace_id', 'user_id']);
            $table->index(['workspace_id']);
            $table->index(['user_id']);
        });
    }
};
