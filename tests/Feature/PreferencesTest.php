<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->user = User::factory()->create();
});

it('persists the locale and theme preference for the current user', function () {
    /** @var mixed $this */
    $this->actingAs($this->user)
        ->patch('/u/0/profile/preferences', [
            'locale' => 'id',
            'theme' => 'light',
        ])
        ->assertRedirect();

    $this->user->refresh();

    expect($this->user->locale)->toBe('id')
        ->and($this->user->theme)->toBe('light');
});

it('persists a single preference field without touching the other', function () {
    /** @var mixed $this */
    $this->user->update(['locale' => 'en', 'theme' => 'dark']);

    $this->actingAs($this->user)
        ->patch('/u/0/profile/preferences', ['locale' => 'id'])
        ->assertRedirect();

    $this->user->refresh();

    expect($this->user->locale)->toBe('id')
        ->and($this->user->theme)->toBe('dark');
});

it('rejects an unsupported locale or theme value', function () {
    /** @var mixed $this */
    $this->actingAs($this->user)
        ->patch('/u/0/profile/preferences', [
            'locale' => 'fr',
            'theme' => 'blue',
        ])
        ->assertSessionHasErrors(['locale', 'theme']);
});

it('defaults new users to english and dark theme', function () {
    /** @var mixed $this */
    $this->user->refresh();

    expect($this->user->locale)->toBe('en')
        ->and($this->user->theme)->toBe('dark');
});
