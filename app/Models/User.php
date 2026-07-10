<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Models\LlmChat\LlmAccount;
use App\Models\LlmChat\LlmChatSession;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name', 'email', 'password',
    'email_verified_at',
    'two_factor_secret', 'two_factor_enabled_at', 'two_factor_last_counter',
    'pomodoro_settings', 'locale', 'theme', 'calendar_visibility',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'two_factor_enabled_at' => 'datetime',
            'two_factor_last_counter' => 'integer',
            'password' => 'hashed',
            'two_factor_secret' => 'encrypted',
            'pomodoro_settings' => 'array',
        ];
    }

    public function reminders(): HasMany
    {
        return $this->hasMany(Reminder::class, 'reminder_user_id', 'id');
    }

    public function llmChatSessions()
    {
        return $this->hasMany(LlmChatSession::class, 'llm_chat_account_id', 'id');
    }

    public function llmAccounts()
    {
        return $this->hasMany(LlmAccount::class, 'llm_account_id', 'id');
    }

    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    public function emailOtps(): HasMany
    {
        return $this->hasMany(EmailOtp::class);
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user', 'user_id', 'project_id')
            ->withPivot(['role', 'is_pinned', 'opened_at']);
    }

    public function generateEmailOtp(): string
    {
        $this->emailOtps()->delete();

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $this->emailOtps()->create([
            'code' => $code,
            'expires_at' => now()->addMinutes(10),
        ]);

        return $code;
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_enabled_at !== null;
    }
}
