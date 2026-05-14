<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Notifications\EmailOtpNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class OtpController extends Controller
{
    private const MAX_ATTEMPTS = 5;
    private const DECAY_SECONDS = 600; // 10 minutes

    public function create(Request $request): Response|RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard'));
        }

        return Inertia::render('auth/verify-email', [
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard'));
        }

        $key = 'otp-verify.' . $user->id;

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);
            return back()->withErrors([
                'code' => "Too many attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $request->validate(['code' => ['required', 'string', 'digits:6']]);

        $otp = $user->emailOtps()
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            RateLimiter::hit($key, self::DECAY_SECONDS);
            return back()->withErrors(['code' => 'Invalid or expired verification code.']);
        }

        RateLimiter::clear($key);
        $otp->delete();
        $user->markEmailAsVerified();

        return redirect()->intended(route('dashboard'));
    }

    public function resend(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard'));
        }

        $code = $user->generateEmailOtp();
        $user->notify(new EmailOtpNotification($code));

        return back()->with('status', 'verification-link-sent');
    }
}
