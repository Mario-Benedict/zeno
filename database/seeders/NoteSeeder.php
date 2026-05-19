<?php

namespace Database\Seeders;

use App\Models\Note;
use App\Models\User;
use Illuminate\Database\Seeder;

class NoteSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();

        if (!$user) return;

        $personalNotes = [
            [
                'title'       => 'API Specs V2',
                'description' => 'Review of endpoints 1-5 for integration with the...',
                'content'     => "Lorem ipsum dolor sit amet consectetur. Magna proin sapien amet cursus luctus. Cras facilisis duis dis euismod nisi odio donec augue. Porttitor feugiat ac pharetra tincidunt ipsum porta.\n\nNunc tellus risus consectetur nunc id. At maecenas faucibus nunc felis interdum senectus. Eu cum felis posuere at sapien mi tristique sodales.",
                'embed_url'   => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'embed_title' => 'Shalz Create Aeronautics is Released!',
            ],
            [
                'title'       => 'UX Feedback',
                'description' => 'Summary of feedback from sprint re...',
                'content'     => "Summary of UX feedback collected during the sprint review session.\n\nKey points discussed include navigation flow improvements and color contrast issues.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'QA Test Cases',
                'description' => 'End-to-end testing for login flow',
                'content'     => "Test cases for the login flow including Google OAuth and email/password authentication.\n\nCovers happy path and edge cases.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'Deployment Logs',
                'description' => 'Status of production server v1.4',
                'content'     => "Deployment log for version 1.4 to production server.\n\nAll services running nominally. No rollback required.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'Frontend Docs',
                'description' => 'Setup guide for React components',
                'content'     => "Documentation for setting up and using shared React components.\n\nIncludes props reference and usage examples.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'UX Feedback',
                'description' => 'Checklist for pending UI updates ba...',
                'content'     => "Checklist of pending UI updates based on user testing feedback.\n\nItems sorted by priority and assigned to respective team members.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
        ];

        $sharedNotes = [
            [
                'title'       => 'API Specs V2',
                'description' => 'Review of endpoints 1-5 for integration with the...',
                'content'     => "Lorem ipsum dolor sit amet consectetur. Egestas diam volutpat mus magna iaculis integer. At amet est neque eu sed ut elit rutrum nunc. Enim donec vulputate in nibh.\n\nGravida aliquet lorem facilisi bibendum vitae. Orci turpis aliquet donec egestas fermentum. Elementum feugiat iaculis maecenas amet sit.",
                'embed_url'   => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'embed_title' => 'Shalz Create Aeronautics is Released!',
            ],
            [
                'title'       => 'UX Feedback',
                'description' => 'Summary of feedback from sprint review',
                'content'     => "Summary of UX feedback collected during the sprint review session.\n\nKey points discussed include navigation flow improvements and color contrast issues.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'QA Test Cases',
                'description' => 'End-to-end testing for login flow',
                'content'     => "Test cases for the login flow including Google OAuth and email/password authentication.\n\nCovers happy path and edge cases.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'Deployment Logs',
                'description' => 'Status of production server v1.4',
                'content'     => "Deployment log for version 1.4 to production server.\n\nAll services running nominally. No rollback required.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'Frontend Docs',
                'description' => 'Setup guide for React components',
                'content'     => "Documentation for setting up and using shared React components.\n\nIncludes props reference and usage examples.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'UX Feedback',
                'description' => 'Checklist for pending UI updates based on user te...',
                'content'     => "Checklist of pending UI updates based on user testing feedback.\n\nItems sorted by priority and assigned to respective team members.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
            [
                'title'       => 'API Specs V2',
                'description' => 'Review of endpoints 1-5 for integr...',
                'content'     => "Full API specification review for endpoints 1-5.\n\nIncludes request/response schema and integration notes.",
                'embed_url'   => null,
                'embed_title' => null,
            ],
        ];

        foreach ($personalNotes as $note) {
            Note::create([
                'user_id'      => $user->id,
                'project_slug' => 'test-project',
                'title'        => $note['title'],
                'description'  => $note['description'],
                'content'      => $note['content'],
                'embed_url'    => $note['embed_url'],
                'embed_title'  => $note['embed_title'],
                'type'         => 'personal',
            ]);
        }

        foreach ($sharedNotes as $note) {
            Note::create([
                'user_id'      => $user->id,
                'project_slug' => 'test-project',
                'title'        => $note['title'],
                'description'  => $note['description'],
                'content'      => $note['content'],
                'embed_url'    => $note['embed_url'],
                'embed_title'  => $note['embed_title'],
                'type'         => 'shared',
            ]);
        }
    }
}