<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LlmChatController;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/auth.php';

Route::name('chat.')->group(function() {
	Route::get('/llmchat', [LlmChatController::class, 'index'])->name('index');
  Route::get('/llmchat/{llm_chat_session_id}', [LlmChatController::class, 'switch'])->name('switch');
  Route::post('/llmchat/new', [LlmChatController::class, 'ask'])->name('ask');
  Route::post('/llmchat/{llm_chat_session_id}/reply', [LlmChatController::class, 'reply'])->name('reply');
});
