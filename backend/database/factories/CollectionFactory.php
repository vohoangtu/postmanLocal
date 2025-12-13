<?php

namespace Database\Factories;

use App\Models\Collection;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class CollectionFactory extends Factory
{
    protected $model = Collection::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->sentence(),
            'data' => [
                'requests' => [],
            ],
            'is_shared' => false,
            'version' => 1,
        ];
    }

    public function withWorkspace(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'workspace_id' => Workspace::factory(),
            ];
        });
    }

    public function shared(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'is_shared' => true,
            ];
        });
    }
}
