<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\AccountSessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        $googleUser = Socialite::driver('google')->user();

        $social = SocialAccount::where('provider', 'google')
            ->where('provider_id', $googleUser->getId())
            ->first();

        if ($social) {
            $social->update(['avatar' => $googleUser->getAvatar()]);
            $user = $social->user;
        } else {
            $user = User::firstOrCreate(
                ['email' => $googleUser->getEmail()],
                [
                    'name' => $googleUser->getName(),
                    'email_verified_at' => now(),
                ],
            );

            if (! $user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            $user->socialAccounts()->create([
                'provider' => 'google',
                'provider_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);
        }

        // Enforce 2FA challenge — same as password login
        if ($user->hasTwoFactorEnabled()) {
            $request->session()->put('auth.2fa_user_id', $user->id);
            $request->session()->put('auth.2fa_expires_at', now()->addMinutes(5)->timestamp);
            $request->session()->put('auth.2fa_remember', true);

            return redirect()->route('two-factor');
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $accountIndex = AccountSessionService::addAccount($request, $user->id);
        $request->session()->forget('url.intended');

        Log::info('User logged in', ['user_id' => $user->id, 'method' => 'google']);

        return redirect()->route('projects.index', ['accountIndex' => $accountIndex]);
    }
}
