<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('uploads a profile picture and stores its relative path', function () {
    Storage::fake('public');

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

    $user->refresh();

    expect($user->avatar_url)->not->toBeNull();
    Storage::disk('public')->assertExists($user->avatar_url);
});

it('replaces the previous avatar file when uploading a new one', function () {
    Storage::fake('public');

    $user = User::factory()->create(['avatar_url' => 'user-avatars/old.jpg']);
    Storage::disk('public')->put('user-avatars/old.jpg', 'fake-content');

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->post('/u/0/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('new.jpg'),
        ])
        ->assertRedirect();

    Storage::disk('public')->assertMissing('user-avatars/old.jpg');
});

it('rejects a non-image file for the avatar upload', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->post('/u/0/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('document.pdf', 100),
        ])
        ->assertSessionHasErrors('avatar');
});

it('removes the current avatar', function () {
    Storage::fake('public');
    Storage::disk('public')->put('user-avatars/current.jpg', 'fake-content');

    $user = User::factory()->create(['avatar_url' => 'user-avatars/current.jpg']);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->delete('/u/0/profile/avatar')
        ->assertRedirect();

    $user->refresh();

    expect($user->avatar_url)->toBeNull();
    Storage::disk('public')->assertMissing('user-avatars/current.jpg');
});
