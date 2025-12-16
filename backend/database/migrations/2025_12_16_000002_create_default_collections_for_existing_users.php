<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Collection;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tạo default collection cho tất cả users chưa có default collection
     */
    public function up(): void
    {
        // Lấy tất cả users
        $users = User::all();

        foreach ($users as $user) {
            // Kiểm tra xem user đã có default collection chưa
            $hasDefaultCollection = Collection::where('user_id', $user->id)
                ->where('is_default', true)
                ->exists();

            if ($hasDefaultCollection) {
                // User đã có default collection, bỏ qua
                continue;
            }

            // Kiểm tra xem user có collection nào không
            $hasAnyCollection = Collection::where('user_id', $user->id)->exists();

            if (!$hasAnyCollection) {
                // Nếu user chưa có collection nào, tạo default collection
                Collection::create([
                    'user_id' => $user->id,
                    'name' => 'My Requests',
                    'description' => 'Default collection for your requests',
                    'is_default' => true,
                    'data' => ['requests' => []],
                ]);
            } else {
                // Nếu user đã có collections nhưng chưa có default, set collection đầu tiên làm default
                $firstCollection = Collection::where('user_id', $user->id)
                    ->orderBy('id', 'asc')
                    ->first();
                
                if ($firstCollection) {
                    $firstCollection->setAsDefault();
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Không cần reverse - chỉ là data migration
        // Nếu cần, có thể unset tất cả default collections được tạo bởi migration này
        // Nhưng không cần thiết vì đây là one-time migration
    }
};
