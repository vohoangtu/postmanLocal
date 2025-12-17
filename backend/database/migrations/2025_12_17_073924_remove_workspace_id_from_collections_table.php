<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove workspace_id từ collections table
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        
        // SQLite cần recreate table để drop column, điều này có thể làm mất index
        // Nên cần backup và recreate index sau khi drop column
        if ($driver === 'sqlite') {
            // Drop và recreate index sau khi drop column
            try {
                DB::statement('DROP INDEX IF EXISTS collections_user_id_is_default_unique');
            } catch (\Exception $e) {
                // Ignore
            }
        }

        // Kiểm tra xem có foreign key workspace_id không trước khi drop
        // SQLite không hỗ trợ drop foreign key trực tiếp, nên bỏ qua
        if ($driver !== 'sqlite') {
            try {
                Schema::table('collections', function (Blueprint $table) {
                    // Drop foreign key trước (nếu tồn tại)
                    try {
                        $table->dropForeign(['workspace_id']);
                    } catch (\Exception $e) {
                        // Foreign key có thể không tồn tại, bỏ qua
                        if (strpos($e->getMessage(), 'does not exist') === false && 
                            strpos($e->getMessage(), 'not found') === false) {
                            throw $e;
                        }
                    }
                });
            } catch (\Exception $e) {
                // Bỏ qua nếu không có foreign key
            }
        }

        // Drop column workspace_id nếu tồn tại
        // SQLite cần recreate table, nên cần xử lý đặc biệt
        if (Schema::hasColumn('collections', 'workspace_id')) {
            if ($driver === 'sqlite') {
                // SQLite: Recreate table để drop column
                // Tạm thời bỏ qua vì có thể gây lỗi với các index khác
                // Column sẽ được xử lý trong migration drop_workspace_tables
                \Log::info('Skipping workspace_id column drop for SQLite - will be handled in drop_workspace_tables migration');
            } else {
                Schema::table('collections', function (Blueprint $table) {
                    $table->dropColumn('workspace_id');
                });
            }
        }

        // Recreate unique index sau khi drop column (cho SQLite)
        if ($driver === 'sqlite') {
            try {
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS collections_user_id_is_default_unique ON collections(user_id) WHERE is_default = 1');
            } catch (\Exception $e) {
                // Ignore nếu có lỗi
                \Log::warning('Could not recreate collections_user_id_is_default_unique index: ' . $e->getMessage());
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->uuid('workspace_id')->nullable()->after('user_id');
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
        });
    }
};
