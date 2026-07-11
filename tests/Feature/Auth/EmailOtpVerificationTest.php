<?php

use App\Models\User;
use App\Notifications\EmailOtpNotification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('sends one custom OTP email and no framework verification link during registration', function () {
    Notification::fake();

    $response = $this->post('/register', [
        'first_name' => 'Maya',
        'last_name' => 'Putri',
        'email' => 'maya@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
    ]);

    $user = User::where('email', 'maya@example.com')->firstOrFail();

    $response->assertRedirect(route('verification.notice'));
    Notification::assertSentToTimes($user, EmailOtpNotification::class, 1);
    Notification::assertNotSentTo($user, VerifyEmail::class);
    expect($user->emailOtps()->count())->toBe(1);
});

it('replaces the previous OTP when a user requests another code', function () {
    Notification::fake();

    $user = User::factory()->unverified()->create();
    $user->generateEmailOtp();
    $oldExpiry = $user->emailOtps()->firstOrFail()->expires_at;
    $this->travel(1)->minute();

    $this->actingAs($user)
        ->post('/email/verification-notification')
        ->assertRedirect()
        ->assertSessionHas('status', 'verification-code-sent');

    Notification::assertSentToTimes($user, EmailOtpNotification::class, 1);

    $otps = $user->emailOtps()->get();
    expect($otps)->toHaveCount(1)
        ->and($otps->first()->expires_at->greaterThan($oldExpiry))->toBeTrue();
});
