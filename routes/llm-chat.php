<?php

use App\Http\Controllers\LlmChatController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================
 *  LLM Chat Routes
 * ============================================================
 *
 * File location: routes/llm-chat.php
 * Include in:    routes/web.php inside /u/{accountIndex}/p/{project:project_slug}.
 *
 * Naming convention:
 *   llm-chat.index    GET    /u/{accountIndex}/p/{project}/llm-chat
 *   llm-chat.show     GET    /u/{accountIndex}/p/{project}/llm-chat/{session}
 *   llm-chat.ask      POST   /u/{accountIndex}/p/{project}/llm-chat
 *   llm-chat.reply    POST   /u/{accountIndex}/p/{project}/llm-chat/{session}/reply
 *   llm-chat.destroy  DELETE /u/{accountIndex}/p/{project}/llm-chat/{session}
 *
 * Route model binding:
 *   - {project} → App\Models\Project              (uses project_slug column)
 *   - {session} → App\Models\LlmChat\LlmChatSession (uses llm_chat_session_id PK)
 *
 * ============================================================
 */
Route::prefix('llm-chat')
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
