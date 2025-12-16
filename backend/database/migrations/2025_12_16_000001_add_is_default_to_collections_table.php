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
    public function up(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('data');
        });

        // Thêm unique index để đảm bảo mỗi user chỉ có 1 default collection
        // Sử dụng raw SQL vì Laravel không hỗ trợ partial unique index trực tiếp
        $driver = Schema::getConnection()->getDriverName();
        
        // Tạo unique index để đảm bảo mỗi user chỉ có 1 default collection
        // Sử dụng raw SQL vì Laravel không hỗ trợ partial unique index trực tiếp
        try {
            if ($driver === 'sqlite') {
                // SQLite: Tạo unique index với WHERE clause
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS collections_user_id_is_default_unique ON collections(user_id) WHERE is_default = 1');
            } elseif ($driver === 'mysql') {
                // MySQL: Không hỗ trợ partial unique index trực tiếp, sử dụng trigger hoặc application logic
                // Tạm thời bỏ qua unique constraint ở database level cho MySQL
                // Logic sẽ được đảm bảo ở application level (Collection model)
            } else {
                // PostgreSQL: Tạo unique index với WHERE clause
                DB::statement('CREATE UNIQUE INDEX collections_user_id_is_default_unique ON collections(user_id) WHERE is_default = true');
            }
        } catch (\Exception $e) {
            // Index có thể đã tồn tại, bỏ qua
            if (strpos($e->getMessage(), 'already exists') === false && 
                strpos($e->getMessage(), 'Duplicate key') === false &&
                strpos($e->getMessage(), 'duplicate') === false) {
                throw $e;
            }
        }

        // Set default collection cho users hiện tại (collection đầu tiên của mỗi user)
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite: Sử dụng subquery không có alias trong UPDATE
            DB::statement('
                UPDATE collections
                SET is_default = true
                WHERE id IN (
                    SELECT MIN(id)
                    FROM collections
                    GROUP BY user_id
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM collections c2
                    WHERE c2.user_id = collections.user_id
                    AND c2.is_default = 1
                )
            ');
        } else {
            // MySQL/PostgreSQL: Sử dụng alias
            DB::statement('
                UPDATE collections c1
                SET is_default = true
                WHERE c1.id = (
                    SELECT MIN(c2.id)
                    FROM collections c2
                    WHERE c2.user_id = c1.user_id
                )
                AND NOT EXISTS (
                    SELECT 1
                    FROM collections c3
                    WHERE c3.user_id = c1.user_id
                    AND c3.is_default = true
                )
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop unique index
        Schema::table('collections', function (Blueprint $table) {
            $table->dropIndex('collections_user_id_is_default_unique');
        });

        Schema::table('collections', function (Blueprint $table) {
            $table->dropColumn('is_default');
        });
    }
};
