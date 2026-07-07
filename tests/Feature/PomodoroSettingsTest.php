<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->user = User::factory()->create();
});

it('persists pomodoro settings for the current user', function () {
    /** @var mixed $this */
    $this->actingAs($this->user)
        ->patch('/u/0/profile/pomodoro-settings', [
            'focus_minutes' => 50,
            'break_minutes' => 10,
        ])
        ->assertRedirect();

    $this->user->refresh();

    expect($this->user->pomodoro_settings)->toBe([
        'focus_minutes' => 50,
        'break_minutes' => 10,
    ]);
});

it('rejects out-of-range focus and break minutes', function () {
    /** @var mixed $this */
    $this->actingAs($this->user)
        ->patch('/u/0/profile/pomodoro-settings', [
            'focus_minutes' => 0,
            'break_minutes' => 999,
        ])
        ->assertSessionHasErrors(['focus_minutes', 'break_minutes']);
});
