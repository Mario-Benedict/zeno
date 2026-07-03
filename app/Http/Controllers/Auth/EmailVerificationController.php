<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AccountSessionService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    public function notice(Request $request): Response|RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->redirectToProjects($request);
        }

        return Inertia::render('auth/verify-email', [
            'status' => session('status'),
        ]);
    }

    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->fulfill();
            event(new Verified($request->user()));
        }

        $request->session()->forget('url.intended');

        return redirect()->route('projects.index', [
            'accountIndex' => AccountSessionService::getActiveIndex($request),
            'verified' => 1,
        ]);
    }

    public function resend(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return $this->redirectToProjects($request);
        }

        $request->user()->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    }

    private function redirectToProjects(Request $request): RedirectResponse
    {
        $request->session()->forget('url.intended');

        return redirect()->route('projects.index', [
            'accountIndex' => AccountSessionService::getActiveIndex($request),
        ]);
    }
}
