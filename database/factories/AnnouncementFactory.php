<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\Category;
use App\Models\User;
use App\Models\Department;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Announcement>
 */
class AnnouncementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $publishAt = $this->faker->dateTimeBetween('-30 days', '+7 days');
        $status = $this->faker->randomElement(['draft', 'published', 'archived']);
        
        return [
            'title' => $this->faker->sentence(6),
            'content' => '<p>' . implode('</p><p>', $this->faker->paragraphs(3)) . '</p>',
            'category_id' => Category::where('type', 'announcement')->inRandomOrder()->first()?->id,
            'created_by' => User::inRandomOrder()->first()?->id ?? 1,
            'updated_by' => null,
            'department_id' => $this->faker->boolean(20) ? Department::inRandomOrder()->first()?->id : null,
            'location_id' => $this->faker->boolean(20) ? Location::inRandomOrder()->first()?->id : null,
            'recipient_roles' => $this->faker->boolean(10) ? $this->faker->randomElements([1, 2, 3, 4], rand(1, 2)) : [],
            'recipient_departments' => $this->faker->boolean(10) ? $this->faker->randomElements([1, 2, 3, 4], rand(1, 2)) : [],
            'is_featured' => $this->faker->boolean(20),
            'is_pinned' => $this->faker->boolean(10),
            'show_on_login' => $this->faker->boolean(15),
            'status' => $status,
            'publish_at' => $status === 'published' ? $publishAt : now(),
            'expire_at' => $this->faker->boolean(30) ? $this->faker->dateTimeBetween('+1 day', '+60 days') : null,
            'cover_image_path' => null,
        ];
    }

    /**
     * Indicate that the announcement is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'publish_at' => now()->subDays(rand(1, 30)),
        ]);
    }

    /**
     * Indicate that the announcement is draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
        ]);
    }

    /**
     * Indicate that the announcement is featured.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }

    /**
     * Indicate that the announcement is pinned.
     */
    public function pinned(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_pinned' => true,
        ]);
    }

    /**
     * Indicate that the announcement should show on login.
     */
    public function showOnLogin(): static
    {
        return $this->state(fn (array $attributes) => [
            'show_on_login' => true,
        ]);
    }
}
