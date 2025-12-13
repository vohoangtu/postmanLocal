<?php

namespace Database\Factories;

use App\Models\CollectionVersion;
use App\Models\Collection;
use Illuminate\Database\Eloquent\Factories\Factory;

class CollectionVersionFactory extends Factory
{
    protected $model = CollectionVersion::class;

    public function definition(): array
    {
        return [
            'collection_id' => Collection::factory(),
            'version' => $this->faker->numberBetween(1, 10),
            'snapshot' => [
                'name' => $this->faker->words(3, true),
                'requests' => [],
            ],
        ];
    }
}
