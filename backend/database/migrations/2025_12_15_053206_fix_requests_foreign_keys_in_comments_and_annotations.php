<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Sửa foreign key constraints cho comments và annotations
     * Vì bảng requests không tồn tại, cần drop foreign key constraints
     */
    public function up(): void
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        // Sửa bảng comments
        if (Schema::hasTable('comments')) {
            if ($driver === 'sqlite') {
                // SQLite: Recreate table không có foreign key đến requests
                DB::statement('PRAGMA foreign_keys=off;');
                
                // Tạo bảng tạm
                DB::statement('
                    CREATE TABLE comments_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        collection_id INTEGER NULL,
                        request_id INTEGER NULL,
                        user_id INTEGER NOT NULL,
                        content TEXT NOT NULL,
                        parent_id INTEGER NULL,
                        created_at TIMESTAMP NULL,
                        updated_at TIMESTAMP NULL,
                        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
                    )
                ');
                
                // Copy data
                DB::statement('
                    INSERT INTO comments_new (id, collection_id, request_id, user_id, content, parent_id, created_at, updated_at)
                    SELECT id, collection_id, request_id, user_id, content, parent_id, created_at, updated_at
                    FROM comments
                ');
                
                // Drop bảng cũ và rename bảng mới
                DB::statement('DROP TABLE comments');
                DB::statement('ALTER TABLE comments_new RENAME TO comments');
                
                DB::statement('PRAGMA foreign_keys=on;');
            } else {
                // MySQL/PostgreSQL: Drop foreign key constraint
                try {
                    Schema::table('comments', function (Blueprint $table) {
                        $table->dropForeign(['request_id']);
                    });
                } catch (\Exception $e) {
                    // Foreign key có thể không tồn tại, bỏ qua
                }
            }
        }

        // Sửa bảng annotations
        if (Schema::hasTable('annotations')) {
            if ($driver === 'sqlite') {
                // SQLite: Recreate table không có foreign key đến requests
                DB::statement('PRAGMA foreign_keys=off;');
                
                // Tạo bảng tạm
                DB::statement('
                    CREATE TABLE annotations_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        request_id INTEGER NOT NULL,
                        user_id INTEGER NOT NULL,
                        type VARCHAR(255) NOT NULL DEFAULT "note",
                        content TEXT NOT NULL,
                        position TEXT NULL,
                        created_at TIMESTAMP NULL,
                        updated_at TIMESTAMP NULL,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                ');
                
                // Copy data
                DB::statement('
                    INSERT INTO annotations_new (id, request_id, user_id, type, content, position, created_at, updated_at)
                    SELECT id, request_id, user_id, type, content, position, created_at, updated_at
                    FROM annotations
                ');
                
                // Drop bảng cũ và rename bảng mới
                DB::statement('DROP TABLE annotations');
                DB::statement('ALTER TABLE annotations_new RENAME TO annotations');
                
                DB::statement('PRAGMA foreign_keys=on;');
            } else {
                // MySQL/PostgreSQL: Drop foreign key constraint
                try {
                    Schema::table('annotations', function (Blueprint $table) {
                        $table->dropForeign(['request_id']);
                    });
                } catch (\Exception $e) {
                    // Foreign key có thể không tồn tại, bỏ qua
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Không cần reverse vì đây là fix migration
        // Nếu cần, có thể recreate foreign keys nhưng bảng requests phải tồn tại
    }
};
