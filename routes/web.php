<?php

use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\NoteController; // Tambahkan import ini
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/check-slug', [ProjectController::class, 'checkSlug'])->name('projects.check-slug');

    Route::get('/p/{project:project_slug}', [ProjectController::class, 'show'])->name('projects.show');
    Route::patch('/p/{project:project_slug}/pin', [ProjectController::class, 'togglePin'])->name('projects.toggle-pin');

    // ─── Grup Route Notes Management (Ditambahkan sesuai arahan tanpa mengubah kode tim) ───
    Route::prefix('p/{project_slug}/notes')->name('projects.notes.')->group(function () {
        Route::get('/personal', [NoteController::class, 'personal'])->name('personal');
        
        // Route shared dipasang fallback array kosong agar tidak crash jika di-klik
        Route::get('/shared', fn($project_slug) => Inertia::render('Projects/Notes/PersonalNotes', [
            'projectSlug' => $project_slug,
            'initialNotes' => []
        ]))->name('shared');
    });

    Route::prefix('two-factor')->name('two-factor.')->group(function () {
        Route::get('setup', [TwoFactorSetupController::class, 'show'])->name('setup');
        Route::post('generate', [TwoFactorSetupController::class, 'generate'])->name('generate');
        Route::post('verify', [TwoFactorSetupController::class, 'verify'])->name('verify');
        Route::post('disable', [TwoFactorSetupController::class, 'disable'])->name('disable');
    });
});

require __DIR__.'/auth.php';