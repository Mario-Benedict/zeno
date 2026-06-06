<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);

        return [
            'project_name' => ucwords($name),
            'project_slug' => Str::slug($name) . '-' . $this->faker->numerify('###'),
            'is_pinned'    => false,
        ];
    }
}