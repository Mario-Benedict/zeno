<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AccountSessionService;
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
            return $this->redirectToProjects($request);
        }

        return Inertia::render('auth/verify-email', [
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->redirectToProjects($request);
        }

        $key = 'otp-verify.'.$user->id;

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);

            return back()->withErrors([
                'code' => "You've tried too many codes. Wait {$seconds} seconds, then try again.",
            ]);
        }

        $request->validate(['code' => ['required', 'string', 'digits:6']]);

        $otp = $user->emailOtps()
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (! $otp) {
            RateLimiter::hit($key, self::DECAY_SECONDS);

            return back()->withErrors([
                'code' => 'That code is invalid or has expired. Request a new code and try again.',
            ]);
        }

        RateLimiter::clear($key);
        $otp->delete();
        $user->markEmailAsVerified();

        return $this->redirectToProjects($request);
    }

    public function resend(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->redirectToProjects($request);
        }

        $user->sendEmailVerificationNotification();

        return back()->with('status', 'verification-code-sent');
    }

    private function redirectToProjects(Request $request): RedirectResponse
    {
        $request->session()->forget('url.intended');

        return redirect()->route('projects.index', [
            'accountIndex' => AccountSessionService::getActiveIndex($request),
        ]);
    }
}
