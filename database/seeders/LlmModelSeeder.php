<?php

namespace Database\Seeders;

use App\Models\LlmChat\LlmModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LlmModelSeeder extends Seeder
{
    /**
     * Seed the available LLM models.
     *
     * The LLM Chat controller calls `LlmModel::firstOrFail()` as a fallback,
     * so the table must contain at least one row for the feature to work.
     */
    public function run(): void
    {
        $models = [
            ['provider' => 'google', 'name' => 'gemini-2.5-flash'],
        ];

        foreach ($models as $model) {
            LlmModel::updateOrCreate(
                ['llm_model_name' => $model['name']],
                [
                    'llm_model_id'       => (string) Str::uuid(),
                    'llm_model_provider' => $model['provider'],
                ],
            );
        }
    }
}
