<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorSetupController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const DECAY_SECONDS = 600;

    public function show(Request $request): Response
    {
        $user = $request->user();
        $secret = $user->two_factor_secret;
        $qrCodeUrl = null;

        if ($secret) {
            $otpUrl = Totp::getQrCodeUrl(config('app.name'), $user->email, $secret);
            $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='.urlencode($otpUrl);
        }

        return Inertia::render('auth/two-factor-setup', [
            'enabled' => $user->hasTwoFactorEnabled(),
            'secret' => $secret,
            'qrCodeUrl' => $qrCodeUrl,
            'status' => session('status'),
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $request->user()->update([
            'two_factor_secret' => Totp::generateSecret(),
            'two_factor_enabled_at' => null,
            'two_factor_last_counter' => null,
        ]);

        return back();
    }

    public function verify(Request $request): RedirectResponse
    {
        $user = $request->user();
        $key = 'two-factor-setup.'.$user->id;

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            return back()->withErrors([
                'code' => "Too many attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $request->validate(['code' => ['required', 'string', 'digits:6']]);

        if (! $user->two_factor_secret) {
            return back()->withErrors(['code' => 'No 2FA secret set. Generate one first.']);
        }

        $counter = Totp::verify($user->two_factor_secret, $request->code);

        if ($counter === false) {
            RateLimiter::hit($key, self::DECAY_SECONDS);

            return back()->withErrors(['code' => 'Invalid code — check your authenticator app and try again.']);
        }

        // Reject replayed codes.
        if ($user->two_factor_last_counter !== null && $user->two_factor_last_counter === $counter) {
            RateLimiter::hit($key, self::DECAY_SECONDS);

            return back()->withErrors(['code' => 'This code has already been used. Wait for the next code.']);
        }

        RateLimiter::clear($key);

        $user->update([
            'two_factor_enabled_at' => now(),
            'two_factor_last_counter' => $counter,
        ]);

        return back()->with('status', '2fa-enabled');
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->user()->update([
            'two_factor_secret' => null,
            'two_factor_enabled_at' => null,
            'two_factor_last_counter' => null,
        ]);

        return back()->with('status', '2fa-disabled');
    }
}
