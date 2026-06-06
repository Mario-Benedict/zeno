<?php

use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\NoteController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/check-slug', [ProjectController::class, 'checkSlug'])->name('projects.check-slug');

    Route::get('/p/{project:project_slug}', [ProjectController::class, 'show'])->name('projects.show');
    Route::patch('/p/{project:project_slug}/pin', [ProjectController::class, 'togglePin'])->name('projects.toggle-pin');

    // ─── Notes Management ───
    Route::prefix('p/{project:project_slug}/notes')->name('projects.notes.')->group(function () {
        Route::get('/personal', [NoteController::class, 'personal'])->name('personal');
        Route::get('/shared', [NoteController::class, 'shared'])->name('shared');
        Route::post('/', [NoteController::class, 'store'])->name('store');
        Route::patch('/{note:note_id}', [NoteController::class, 'update'])->name('update');
        Route::delete('/{note:note_id}', [NoteController::class, 'destroy'])->name('destroy');
    });

    // ─── Two Factor Authentication ───
    Route::prefix('two-factor')->name('two-factor.')->group(function () {
        Route::get('setup', [TwoFactorSetupController::class, 'show'])->name('setup');
        Route::post('generate', [TwoFactorSetupController::class, 'generate'])->name('generate');
        Route::post('verify', [TwoFactorSetupController::class, 'verify'])->name('verify');
        Route::post('disable', [TwoFactorSetupController::class, 'disable'])->name('disable');
    });

    // require __DIR__.'/kanban.php';
});

require __DIR__.'/auth.php';