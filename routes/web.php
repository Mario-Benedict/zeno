<?php

use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LlmChatController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('projects')->name('projects.')->group(function() {
        Route::get('/', [ProjectController::class, 'index'])->name('index');
        Route::post('/', [ProjectController::class, 'store'])->name('store');
        Route::get('/check-slug', [ProjectController::class, 'checkSlug'])->name('check-slug');
    });

    Route::prefix('p/{project:project_slug}')->name('projects.')->group(function() {
        Route::get('/', [ProjectController::class, 'show'])->name('show');
        Route::patch('/pin', [ProjectController::class, 'togglePin'])->name('toggle-pin');

        require __DIR__.'/kanban.php';
    });

    // LLM Chat inside project
    Route::prefix('/p/{project:project_slug}/llmchat')->name('chat.')->group(function () {
        Route::get('/', [LlmChatController::class, 'index'])->name('index');
        Route::get('/{llm_chat_session_id}', [LlmChatController::class, 'switch'])->name('switch');
        Route::post('/new', [LlmChatController::class, 'ask'])->name('ask');
        Route::post('/{llm_chat_session_id}/reply', [LlmChatController::class, 'reply'])->name('reply');
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
