<?php

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;
use App\Services\StorageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('the s3 disk is configured with an overridable endpoint for R2 compatibility', function () {
    $disk = config('filesystems.disks.s3');

    expect($disk)->not->toBeNull()
        ->and($disk['driver'])->toBe('s3')
        ->and($disk)->toHaveKey('endpoint')
        ->and($disk)->toHaveKey('use_path_style_endpoint');
});

test('StorageService uses the configured S3-compatible uploads disk', function () {
    config(['filesystems.uploads_disk' => 's3']);

    expect((new StorageService)->disk())->toBe('s3');
});

test('uploads stay on the public disk in local development', function () {
    Storage::fake('public');
    config(['filesystems.uploads_disk' => 'public']);

    $path = (new StorageService)->put(
        UploadedFile::fake()->image('preview.png'),
        'chats/images',
    );

    Storage::disk('public')->assertExists($path);
});

test('uploads use the standard s3 disk without a provider-specific driver', function () {
    Storage::fake('s3');
    config(['filesystems.uploads_disk' => 's3']);

    $path = (new StorageService)->put(
        UploadedFile::fake()->create('brief.pdf', 128, 'application/pdf'),
        'chats/files',
    );

    Storage::disk('s3')->assertExists($path);
});

test('profile avatars use the shared configured upload disk', function () {
    Storage::fake('s3');
    config(['filesystems.uploads_disk' => 's3']);
    app()->forgetInstance(StorageService::class);

    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->post('/u/0/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
        ])
        ->assertRedirect();

    Storage::disk('s3')->assertExists($user->refresh()->avatar_url);
});

test('project avatars use the shared configured upload disk', function () {
    Storage::fake('s3');
    config(['filesystems.uploads_disk' => 's3']);
    app()->forgetInstance(StorageService::class);

    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Storage Project',
        'project_slug' => Project::generateUniqueSlug('Storage Project'),
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->post("/u/0/p/{$project->project_slug}/avatar", [
            'avatar' => UploadedFile::fake()->image('project-avatar.jpg'),
        ])
        ->assertRedirect();

    Storage::disk('s3')->assertExists($project->refresh()->avatar_url);
});

test('the production environment template selects s3 for all uploads', function () {
    expect(file_get_contents(base_path('docker/env.production.example')))
        ->toContain('UPLOADS_STORAGE_DISK=s3');
});
