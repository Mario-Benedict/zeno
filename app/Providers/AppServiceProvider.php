<?php

namespace App\Providers;

use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Observers\KanbanBoardCardObserver;
use App\Policies\ProjectPolicy;
use App\Services\AccountSessionService;
use App\Services\MongoDB\MongoConnection;
use App\Services\StorageService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Http\Request;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    // NotePolicy/ChatRoomPolicy aren't listed here — Laravel auto-discovers
    // policies from the `App\Models\{X}` → `App\Policies\{X}Policy` naming
    // convention, same as every other policy in this codebase besides
    // ProjectPolicy (kept explicit only because it predates auto-discovery).
    protected $policies = [
        Project::class => ProjectPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(MongoConnection::class);
        $this->app->singleton(StorageService::class);
    }

    public function boot(): void
    {
        $this->registerPolicies();
        $this->configureDefaults();
        $this->configureQueueLogging();
        $this->configureAuthRedirects();

        KanbanBoardCard::observe(KanbanBoardCardObserver::class);
    }

    /**
     * Register authorization policies.
     */
    protected function registerPolicies(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        if (app()->isProduction()) {
            URL::forceScheme('https');
        }

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
                ? Password::min(12)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                : null,
        );
    }

    /**
     * Laravel's `guest` middleware sends an already-authenticated user who
     * hits a guest-only route (e.g. clicking "Log in" on the landing page
     * while already signed in) to the `dashboard` or `home` named route by
     * default. This app has no `dashboard` route and `home` is the public
     * marketing landing page, so without this override they'd bounce back
     * to `/` instead of their project list.
     */
    protected function configureAuthRedirects(): void
    {
        RedirectIfAuthenticated::redirectUsing(
            fn (Request $request) => route('projects.index', [
                'accountIndex' => max(0, AccountSessionService::getActiveIndex($request)),
            ])
        );
    }

    /**
     * Log queue job failures (mail, broadcasting, etc.) with the exception and
     * job class, so a failure like a misconfigured mail provider surfaces in
     * the log stream instead of only being visible via `failed_jobs`/Horizon.
     */
    protected function configureQueueLogging(): void
    {
        Queue::failing(function (JobFailed $event): void {
            Log::error('Queue job failed', [
                'connection' => $event->connectionName,
                'job' => $event->job->resolveName(),
                'exception' => $event->exception->getMessage(),
            ]);
        });
    }
}
