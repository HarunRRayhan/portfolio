<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subscriber>
 */
class SubscriberFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'source' => fake()->randomElement(['bio', 'homepage', 'blog', null]),
            'referrer' => fake()->randomElement(['direct', 'twitter', 'google', null]),
            'status' => 'subscribed',
        ];
    }
}
