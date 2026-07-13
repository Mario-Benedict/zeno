<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AccountSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    private const DECAY_SECONDS = 60;

    private const TWO_FACTOR_TTL_MINUTES = 5;

    public function create(): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $key = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            Log::warning('Login rate limited', ['email' => $request->input('email')]);

            return back()->withErrors([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($key, self::DECAY_SECONDS);

            Log::warning('Failed login attempt', ['email' => $credentials['email']]);

            return back()->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ])->onlyInput('email');
        }

        RateLimiter::clear($key);

        $user = Auth::user();

        if ($user->hasTwoFactorEnabled()) {
            $request->session()->put('auth.2fa_user_id', $user->id);
            $request->session()->put('auth.2fa_expires_at', now()->addMinutes(self::TWO_FACTOR_TTL_MINUTES)->timestamp);
            Auth::logout();

            return redirect()->route('two-factor');
        }

        $request->session()->regenerate();

        // Register the user in the multi-account session array.
        $accountIndex = AccountSessionService::addAccount($request, $user->id);
        $request->session()->forget('url.intended');

        Log::info('User logged in', ['user_id' => $user->id, 'method' => 'password']);

        return redirect()->route('projects.index', ['accountIndex' => $accountIndex]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        $redirectTo = $request->validate([
            'redirect_to' => ['nullable', 'string', 'in:home,login,register,add_account,signout_all'],
        ])['redirect_to'] ?? 'home';

        $activeIndex = AccountSessionService::getActiveIndex($request);

        Log::info('User logged out', ['user_id' => $request->user()?->id, 'redirect_to' => $redirectTo]);

        // ── Add another account ───────────────────────────────────────────
        // Drop the standard Laravel auth token so the guest middleware lets the
        // user through to /login, but keep the accounts array intact so existing
        // sessions remain accessible.
        if ($redirectTo === 'add_account') {
            Auth::logout();
            $request->session()->forget('url.intended');

            return redirect()->route('login');
        }

        // ── Sign out of all accounts ──────────────────────────────────────
        if ($redirectTo === 'signout_all') {
            AccountSessionService::clearAll($request);
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('home');
        }

        // ── Sign out of current account only ─────────────────────────────
        $nextIndex = AccountSessionService::removeAccount($request, $activeIndex);

        Auth::logout();

        if ($nextIndex === null) {
            // No more accounts — full sign-out
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return match ($redirectTo) {
                'login' => redirect()->route('login'),
                'register' => redirect()->route('register'),
                default => redirect()->route('home'),
            };
        }

        // Switch to the next remaining account
        return redirect()->route('projects.index', ['accountIndex' => $nextIndex]);
    }

    private function throttleKey(Request $request): string
    {
        return 'login.'.Str::lower($request->input('email', '')).'.'.$request->ip();
    }
}
