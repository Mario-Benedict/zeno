<?php

use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('projects')->name('projects.')->group(function() {
        Route::get('/', [ProjectController::class, 'index'])->name('index');
        Route::post('/create', [ProjectController::class, 'store'])->name('store');
        Route::get('/check-slug', [ProjectController::class, 'checkSlug'])->name('check-slug');
    });

    Route::prefix('p/{project:project_slug}')->name('projects.')->group(function() {
        Route::get('/', [ProjectController::class, 'show'])->name('show');
        Route::patch('/pin', [ProjectController::class, 'togglePin'])->name('toggle-pin');

        require __DIR__.'/kanban.php';
    });

    Route::prefix('two-factor')->name('two-factor.')->group(function () {
        Route::get('setup', [TwoFactorSetupController::class, 'show'])->name('setup');
        Route::post('generate', [TwoFactorSetupController::class, 'generate'])->name('generate');
        Route::post('verify', [TwoFactorSetupController::class, 'verify'])->name('verify');
        Route::post('disable', [TwoFactorSetupController::class, 'disable'])->name('disable');
    });
});

require __DIR__.'/auth.php';

require __DIR__.'/chat.php';
