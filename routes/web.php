<?php

use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\ProjectController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LlmChatController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/check-slug', [ProjectController::class, 'checkSlug'])->name('projects.check-slug');

    Route::get('/p/{project:project_slug}', [ProjectController::class, 'show'])->name('projects.show');
    Route::patch('/p/{project:project_slug}/pin', [ProjectController::class, 'togglePin'])->name('projects.toggle-pin');

    Route::prefix('two-factor')->name('two-factor.')->group(function () {
        Route::get('setup', [TwoFactorSetupController::class, 'show'])->name('setup');
        Route::post('generate', [TwoFactorSetupController::class, 'generate'])->name('generate');
        Route::post('verify', [TwoFactorSetupController::class, 'verify'])->name('verify');
        Route::post('disable', [TwoFactorSetupController::class, 'disable'])->name('disable');
    });
});

require __DIR__.'/auth.php';

Route::name('chat.')->group(function() {
	Route::get('/llmchat', [LlmChatController::class, 'index'])->name('index');
  Route::get('/llmchat/{llm_chat_session_id}', [LlmChatController::class, 'switch'])->name('switch');
  Route::post('/llmchat/new', [LlmChatController::class, 'ask'])->name('ask');
  Route::post('/llmchat/{llm_chat_session_id}/reply', [LlmChatController::class, 'reply'])->name('reply');
});
