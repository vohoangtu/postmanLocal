<?php

namespace Database\Factories;

use App\Models\Annotation;
use App\Models\User;
use App\Models\Collection;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnnotationFactory extends Factory
{
    protected $model = Annotation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'collection_id' => Collection::factory(),
            'request_id' => 'req-' . $this->faker->uuid(),
            'content' => $this->faker->sentence(),
            'position' => [
                'line' => $this->faker->numberBetween(1, 100),
                'column' => $this->faker->numberBetween(1, 50),
            ],
        ];
    }
}
