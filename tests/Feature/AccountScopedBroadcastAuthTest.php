<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;

uses(RefreshDatabase::class);

it('authorizes private channels as the account selected by the URL', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => 'test-app',
    ]);

    $firstAccount = User::factory()->create();
    $secondAccount = User::factory()->create();
    Broadcast::channel(
        'account-test',
        fn (User $user): bool => $user->is($secondAccount),
    );

    $session = [
        'accounts' => [
            ['user_id' => $firstAccount->id],
            ['user_id' => $secondAccount->id],
        ],
        'account_active_index' => 0,
    ];

    $this->actingAs($firstAccount)
        ->withSession($session)
        ->post('/u/1/broadcasting/auth', [
            'socket_id' => '123.456',
            'channel_name' => 'private-account-test',
        ])
        ->assertOk()
        ->assertJsonStructure(['auth']);

    $this->actingAs($firstAccount)
        ->withSession($session)
        ->post('/u/0/broadcasting/auth', [
            'socket_id' => '123.456',
            'channel_name' => 'private-account-test',
        ])
        ->assertForbidden();
});
