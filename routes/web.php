<?php

use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\PomodoroSettingsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectInvitationController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectSettingsController;
use App\Models\Project;
use App\Services\AccountSessionService;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('u/{accountIndex}')
        ->whereNumber('accountIndex')
        ->group(function () {
            Route::prefix('projects')->name('projects.')->group(function () {
                Route::get('/', [ProjectController::class, 'index'])->name('index');
                Route::post('/', [ProjectController::class, 'store'])->name('store');
                Route::get('/check-slug', [ProjectController::class, 'checkSlug'])->name('check-slug');
            });

            Route::inertia('account', 'account/show')->name('account.show');
            Route::patch('profile', [ProfileController::class, 'update'])->name('profile.update');
            Route::patch('profile/pomodoro-settings', [PomodoroSettingsController::class, 'update'])
                ->name('pomodoro.settings.update');

            Route::prefix('p/{project:project_slug}')
                ->middleware('project.member')
                ->group(function () {
                    Route::name('projects.')->group(function () {
                        Route::get('/', [ProjectController::class, 'show'])->name('show');
                        Route::patch('/pin', [ProjectController::class, 'togglePin'])->name('toggle-pin');
                        Route::post('/leave', [ProjectSettingsController::class, 'leave'])->name('leave');

                        Route::middleware('project.role:OWNER,ADMIN')->group(function () {
                            Route::patch('/', [ProjectSettingsController::class, 'update'])->name('settings.update');
                            Route::patch('/avatar', [ProjectSettingsController::class, 'updateAvatar'])->name('settings.avatar.update');
                            Route::post('/avatar', [ProjectSettingsController::class, 'storeAvatarImage'])->name('settings.avatar.store');
                            Route::delete('/avatar', [ProjectSettingsController::class, 'destroyAvatarImage'])->name('settings.avatar.destroy');
                        });

                        Route::middleware('project.role:OWNER')->group(function () {
                            Route::delete('/', [ProjectSettingsController::class, 'destroy'])->name('settings.destroy');
                        });

                        require __DIR__.'/kanban.php';
                        require __DIR__.'/calendar.php';

                        Route::middleware('project.role:OWNER,ADMIN')->group(function () {
                            Route::post('/invitations', [ProjectInvitationController::class, 'store'])
                                ->name('invitations.store');
                            Route::post('/invitations/link', [ProjectInvitationController::class, 'createLink'])
                                ->name('invitations.link.store');
                            Route::patch('/invitations/link', [ProjectInvitationController::class, 'updateLink'])
                                ->name('invitations.link.update');
                            Route::delete('/invitations/link', [ProjectInvitationController::class, 'destroyLink'])
                                ->name('invitations.link.destroy');

                            Route::patch('/members/{user}', [ProjectMemberController::class, 'update'])
                                ->name('members.update');
                            Route::delete('/members/{user}', [ProjectMemberController::class, 'destroy'])
                                ->name('members.destroy');
                        });
                    });

                    require __DIR__.'/dashboard.php';

                    require __DIR__.'/chat.php';

                    require __DIR__.'/llm-chat.php';

                    require __DIR__.'/notes.php';

                    require __DIR__.'/reminders.php';
                });
        });

    Route::get('/projects', fn () => redirect()->route('projects.index', [
        'accountIndex' => AccountSessionService::getActiveIndex(request()),
    ]));
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/check-slug', [ProjectController::class, 'checkSlug']);

    Route::get('/p/{project:project_slug}/{path?}', function (Project $project, ?string $path = null) {
        $suffix = $path === null ? '' : '/'.$path;

        $accountIndex = AccountSessionService::getActiveIndex(request());

        return redirect('/u/'.$accountIndex.'/p/'.$project->project_slug.$suffix);
    })->where('path', '.*');

    Route::get('/invite/{token}', [ProjectInvitationController::class, 'accept'])
        ->name('projects.invitations.accept');

    Route::prefix('two-factor')->name('two-factor.')->group(function () {
        Route::post('generate', [TwoFactorSetupController::class, 'generate'])->name('generate');
        Route::post('verify', [TwoFactorSetupController::class, 'verify'])->name('verify');
        Route::post('disable', [TwoFactorSetupController::class, 'disable'])->name('disable');
    });
});

require __DIR__.'/auth.php';
