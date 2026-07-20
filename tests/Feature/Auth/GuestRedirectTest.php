<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('redirects an already-authenticated user away from login to their project list', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['account_active_index' => 1])
        ->get('/login')
        ->assertRedirect(route('projects.index', ['accountIndex' => 1], false));
});

it('redirects an already-authenticated user away from register to their project list', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['account_active_index' => 0])
        ->get('/register')
        ->assertRedirect(route('projects.index', ['accountIndex' => 0], false));
});

it('lets a guest reach the login page normally', function () {
    $this->get('/login')->assertOk();
});
