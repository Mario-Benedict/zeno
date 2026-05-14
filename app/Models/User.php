<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name', 'email', 'password',
    'email_verified_at',
    'two_factor_secret', 'two_factor_enabled_at', 'two_factor_last_counter',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'two_factor_enabled_at'   => 'datetime',
            'two_factor_last_counter' => 'integer',
            'password'                => 'hashed',
            'two_factor_secret'       => 'encrypted',
        ];
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function emailOtps(): HasMany
    {
        return $this->hasMany(EmailOtp::class);
    }

    public function generateEmailOtp(): string
    {
        $this->emailOtps()->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->emailOtps()->create([
            'code'       => $code,
            'expires_at' => now()->addMinutes(10),
        ]);

        return $code;
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_enabled_at !== null;
    }
}
