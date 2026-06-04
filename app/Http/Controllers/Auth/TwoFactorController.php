<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountSessionService;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const DECAY_SECONDS = 600; // 10 minutes

    public function create(Request $request): Response|RedirectResponse
    {
        if (! $this->challengeIsValid($request)) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/two-factor');
    }

    public function store(Request $request): RedirectResponse
    {
        if (! $this->challengeIsValid($request)) {
            return redirect()->route('login')->withErrors([
                'email' => 'Your session expired. Please log in again.',
            ]);
        }

        $userId = $request->session()->get('auth.2fa_user_id');
        $key = 'two-factor.'.$userId;

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            return back()->withErrors([
                'code' => "Too many attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $request->validate(['code' => ['required', 'string', 'digits:6']]);

        $user = User::findOrFail($userId);
        $counter = Totp::verify($user->two_factor_secret, $request->code);

        if ($counter === false) {
            RateLimiter::hit($key, self::DECAY_SECONDS);

            return back()->withErrors(['code' => 'Invalid authentication code.']);
        }

        // Reject replayed codes — same counter window already accepted.
        if ($user->two_factor_last_counter !== null && $user->two_factor_last_counter === $counter) {
            RateLimiter::hit($key, self::DECAY_SECONDS);

            return back()->withErrors(['code' => 'This code has already been used. Wait for the next code.']);
        }

        RateLimiter::clear($key);
        $user->update(['two_factor_last_counter' => $counter]);

        $request->session()->forget(['auth.2fa_user_id', 'auth.2fa_expires_at']);
        Auth::login($user);
        $request->session()->regenerate();
        $accountIndex = AccountSessionService::addAccount($request, $user->id);
        $request->session()->forget('url.intended');

        return redirect()->route('projects.index', ['accountIndex' => $accountIndex]);
    }

    private function challengeIsValid(Request $request): bool
    {
        $userId = $request->session()->get('auth.2fa_user_id');
        $expiresAt = $request->session()->get('auth.2fa_expires_at');

        if (! $userId || ! $expiresAt) {
            return false;
        }

        if (now()->timestamp > $expiresAt) {
            $request->session()->forget(['auth.2fa_user_id', 'auth.2fa_expires_at']);

            return false;
        }

        return true;
    }
}
