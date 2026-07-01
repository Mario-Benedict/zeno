<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('appends a newly logged in account and redirects to its own account index', function () {
    [$first, $second, $third] = User::factory()->count(3)->create();

    $this->withSession([
        'accounts' => [
            ['user_id' => $first->id],
            ['user_id' => $second->id],
        ],
        'account_active_index' => 1,
        'url.intended' => '/u/0/projects',
    ])->post('/login', [
        'email' => $third->email,
        'password' => 'password',
    ])->assertRedirect(route('projects.index', ['accountIndex' => 2], false));

    expect(session('accounts'))->toBe([
        ['user_id' => $first->id],
        ['user_id' => $second->id],
        ['user_id' => $third->id],
    ]);
    expect(session('account_active_index'))->toBe(2);
});

it('removes the active account without deleting account index zero', function () {
    [$first, $second, $third] = User::factory()->count(3)->create();

    $this->actingAs($second)
        ->withSession([
            'accounts' => [
                ['user_id' => $first->id],
                ['user_id' => $second->id],
                ['user_id' => $third->id],
            ],
            'account_active_index' => 1,
        ])
        ->post('/logout', ['redirect_to' => 'home'])
        ->assertRedirect(route('projects.index', ['accountIndex' => 0], false));

    expect(session('accounts'))->toBe([
        ['user_id' => $first->id],
        ['user_id' => $third->id],
    ]);
    expect(session('account_active_index'))->toBe(0);
});

it('resolves the authenticated user from the account index in the url', function () {
    [$first, $second] = User::factory()->count(2)->create();

    $this->actingAs($first)
        ->withSession([
            'accounts' => [
                ['user_id' => $first->id],
                ['user_id' => $second->id],
            ],
            'account_active_index' => 0,
        ])
        ->get(route('projects.index', ['accountIndex' => 1], false))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('projects/index')
            ->where('auth.user.id', $second->id)
            ->where('account.index', 1));
});
