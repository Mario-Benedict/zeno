<?php

use App\Http\Controllers\LlmChatController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================
 *  LLM Chat Routes
 * ============================================================
 *
 * File location: routes/llm-chat.php
 * Include in:    routes/web.php  →  require __DIR__.'/llm-chat.php';
 *
 * Naming convention:
 *   llm-chat.index    GET    /p/{project}/llm-chat
 *   llm-chat.show     GET    /p/{project}/llm-chat/{session}
 *   llm-chat.ask      POST   /p/{project}/llm-chat
 *   llm-chat.reply    POST   /p/{project}/llm-chat/{session}/reply
 *   llm-chat.destroy  DELETE /p/{project}/llm-chat/{session}
 *
 * Middleware stack (applied at group level):
 *   - auth           : user must be logged in
 *   - verified       : email must be verified
 *   - project.member : ensures the authenticated user is a member
 *                      of the {project} route parameter
 *
 * Route model binding:
 *   - {project} → App\Models\Project              (uses project_slug column)
 *   - {session} → App\Models\LlmChat\LlmChatSession (uses llm_chat_session_id PK)
 *
 * ============================================================
 */
Route::middleware(['auth', 'verified', 'project.member'])
    ->prefix('p/{project:project_slug}/llm-chat')
    ->name('llm-chat.')
    ->group(function () {

        // GET /p/{project}/llm-chat
        Route::get('/', [LlmChatController::class, 'index'])->name('index');

        // GET /p/{project}/llm-chat/{session}
        Route::get('/{session}', [LlmChatController::class, 'show'])->name('show');

        // POST /p/{project}/llm-chat
        Route::post('/', [LlmChatController::class, 'ask'])->name('ask');

        // POST /p/{project}/llm-chat/{session}/reply
        Route::post('/{session}/reply', [LlmChatController::class, 'reply'])->name('reply');

        // DELETE /p/{project}/llm-chat/{session}
        Route::delete('/{session}', [LlmChatController::class, 'destroy'])->name('destroy');
    });
