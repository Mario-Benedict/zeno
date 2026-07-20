<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

it('logs a warning on a failed login attempt', function () {
    Log::spy();

    $user = User::factory()->create(['password' => Hash::make('correct-password')]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $message, array $context) => $message === 'Failed login attempt' && $context['email'] === $user->email)
        ->once();
});

it('logs an info message on a successful login', function () {
    Log::spy();

    $user = User::factory()->create(['password' => Hash::make('correct-password')]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'correct-password',
    ]);

    Log::shouldHaveReceived('info')
        ->withArgs(fn (string $message, array $context) => $message === 'User logged in'
            && $context['user_id'] === $user->id
            && $context['method'] === 'password')
        ->once();
});

it('logs an info message when email verification succeeds', function () {
    Log::spy();

    $user = User::factory()->unverified()->create();
    $code = $user->generateEmailOtp();

    $this->actingAs($user)->post('/email/verify', ['code' => $code]);

    Log::shouldHaveReceived('info')
        ->withArgs(fn (string $message, array $context) => $message === 'Email verified' && $context['user_id'] === $user->id)
        ->once();
});

it('logs a warning when email verification fails', function () {
    Log::spy();

    $user = User::factory()->unverified()->create();
    $user->generateEmailOtp();

    $this->actingAs($user)->post('/email/verify', ['code' => '000000']);

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $message, array $context) => $message === 'Failed email OTP attempt' && $context['user_id'] === $user->id)
        ->once();
});
