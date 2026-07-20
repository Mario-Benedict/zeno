<?php

use App\Http\Controllers\Chat\ChatMessageController;
use App\Http\Controllers\Chat\ChatRoomController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================
 *  Chat Routes
 * ============================================================
 *
 * File location: routes/chat.php
 * Include in:    routes/web.php inside /u/{accountIndex}/p/{project:project_slug}.
 *
 * Naming convention:
 *   chat.index          GET  /u/{accountIndex}/p/{project}/chat
 *   chat.rooms.store    POST /u/{accountIndex}/p/{project}/chat/rooms
 *   chat.rooms.show     GET  /u/{accountIndex}/p/{project}/chat/rooms/{room}
 *   chat.messages.index GET  /u/{accountIndex}/p/{project}/chat/rooms/{room}/messages
 *   chat.messages.store POST /u/{accountIndex}/p/{project}/chat/rooms/{room}/messages
 *   chat.messages.destroy DELETE /u/{accountIndex}/p/{project}/chat/rooms/{room}/messages/{message}
 *
 * Route model binding:
 *   - {project} → App\Models\Project   (uses project_slug column via inline binding)
 *   - {room}    → App\Models\ChatRoom  (uses uuid column via getRouteKeyName)
 *
 * ============================================================
 */
Route::prefix('chat')
    ->name('chat.')
    ->group(function () {

        // ── Inertia page ────────────────────────────────────────────
        //
        // GET /p/{project:project_slug}/chat
        // Renders Chat/Index.tsx with all rooms + last-message previews.

        Route::get('/', [ChatRoomController::class, 'index'])
            ->name('index');

        // ── Room management ─────────────────────────────────────────
        //
        // Grouped under /rooms so we can expand with update/delete later.

        Route::prefix('rooms')->name('rooms.')->group(function () {

            // POST /p/{project:project_slug}/chat/rooms
            // Find or create a DM room with another project member.
            Route::post('/', [ChatRoomController::class, 'store'])
                ->name('store');

            // POST /p/{project:project_slug}/chat/rooms/group
            // Create a new group room with a chosen subset of project members.
            Route::post('/group', [ChatRoomController::class, 'storeGroup'])
                ->name('group.store');

            // GET /p/{project:project_slug}/chat/rooms/{room}
            // Return a single room as JSON (used by the frontend on deep-link open).
            Route::get('/{room}', [ChatRoomController::class, 'show'])
                ->name('show');

            // ── Message management ───────────────────────────────────
            //
            // Nested under /{room}/messages.

            Route::prefix('/{room}/messages')->name('messages.')->group(function () {

                // GET /p/{project:project_slug}/chat/rooms/{room}/messages
                // Cursor-paginated list of messages (newest-first, infinite scroll).
                Route::get('/', [ChatMessageController::class, 'index'])
                    ->name('index');

                // POST /p/{project:project_slug}/chat/rooms/{room}/messages
                // Send a new message (text / image / file, supports bulk attachments).
                Route::post('/', [ChatMessageController::class, 'store'])
                    ->name('store');

                // DELETE /p/{project:project_slug}/chat/rooms/{room}/messages/{message}
                // Redact / soft-delete a message (author or room admin only).
                Route::delete('/{message}', [ChatMessageController::class, 'destroy'])
                    ->name('destroy');
            });
        });
    });
