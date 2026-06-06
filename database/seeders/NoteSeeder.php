<?php

namespace Database\Seeders;

use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NoteSeeder extends Seeder
{
    public function run(): void
    {
        $user    = User::first();
        $project = Project::first();

        if (! $user || ! $project) {
            $this->command->warn('No user or project found. Run DatabaseSeeder first.');
            return;
        }

        $personalNotes = [
            [
                'title'   => 'API Specs V2',
                'content' => [
                    'html'       => '<p>Lorem ipsum dolor sit amet consectetur. Magna proin sapien amet cursus luctus.</p><p>Nunc tellus risus consectetur nunc id. At maecenas faucibus nunc felis interdum senectus.</p>',
                    'text'       => "Lorem ipsum dolor sit amet consectetur. Magna proin sapien amet cursus luctus.\n\nNunc tellus risus consectetur nunc id. At maecenas faucibus nunc felis interdum senectus.",
                    'embedUrl'   => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                    'embedTitle' => 'Shalz Create Aeronautics is Released!',
                ],
            ],
            [
                'title'   => 'UX Feedback',
                'content' => [
                    'html' => '<p>Summary of UX feedback collected during the sprint review session.</p><p>Key points discussed include navigation flow improvements.</p>',
                    'text' => "Summary of UX feedback collected during the sprint review session.\n\nKey points discussed include navigation flow improvements.",
                ],
            ],
            [
                'title'   => 'QA Test Cases',
                'content' => [
                    'html' => '<p>Test cases for the login flow including Google OAuth and email/password authentication.</p><p>Covers happy path and edge cases.</p>',
                    'text' => "Test cases for the login flow including Google OAuth and email/password authentication.\n\nCovers happy path and edge cases.",
                ],
            ],
            [
                'title'   => 'Deployment Logs',
                'content' => [
                    'html' => '<p>Deployment log for version 1.4 to production server.</p><p>All services running nominally.</p>',
                    'text' => "Deployment log for version 1.4 to production server.\n\nAll services running nominally.",
                ],
            ],
            [
                'title'   => 'Frontend Docs',
                'content' => [
                    'html' => '<p>Documentation for setting up and using shared React components.</p><p>Includes props reference and usage examples.</p>',
                    'text' => "Documentation for setting up and using shared React components.\n\nIncludes props reference and usage examples.",
                ],
            ],
        ];

        foreach ($personalNotes as $note) {
            Note::create([
                'note_id'    => Str::uuid(),
                'user_id'    => $user->id,
                'project_id' => $project->project_id,
                'title'      => $note['title'],
                'content'    => $note['content'],
                'is_shared'  => false,
            ]);
        }
    }
}