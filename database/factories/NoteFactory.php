<?php

namespace Database\Factories;

use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
{
    protected $model = Note::class;

    public function definition(): array
    {
        return [
            'user_id'    => User::factory(),
            'project_id' => Project::factory(),
            'title'      => $this->faker->sentence(3),
            'content'    => [
                'html' => '<p>' . $this->faker->paragraph() . '</p>',
                'text' => $this->faker->paragraph(),
            ],
            'is_shared'  => false,
        ];
    }

    public function shared(): static
    {
        return $this->state(['is_shared' => true]);
    }

    public function personal(): static
    {
        return $this->state(['is_shared' => false]);
    }
}