<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
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
                    'name'              => $googleUser->getName(),
                    'email_verified_at' => now(),
                ],
            );

            if (!$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            $user->socialAccounts()->create([
                'provider'    => 'google',
                'provider_id' => $googleUser->getId(),
                'avatar'      => $googleUser->getAvatar(),
            ]);
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('projects.index'));
    }
}
