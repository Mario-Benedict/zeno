<?php

use App\Http\Controllers\Notes\NoteCollaboratorController;
use App\Http\Controllers\Notes\NoteController;
use App\Http\Controllers\Notes\NoteImageController;
use App\Http\Controllers\Notes\NoteShareController;
use Illuminate\Support\Facades\Route;

/**
 * ============================================================
 *  Notes Routes
 * ============================================================
 *
 * File location: routes/notes.php
 * Include in:    routes/web.php inside /u/{accountIndex}/p/{project:project_slug}.
 *
 * A single workspace page (`index`) renders both personal and shared
 * notes — there is no per-tab route. `show`, `store`, `update`, `destroy`
 * are plain JSON endpoints so the frontend can autosave and lazy-load
 * content without a full Inertia page reload.
 *
 * Naming convention:
 *   notes.index               GET    /u/{accountIndex}/p/{project}/notes
 *   notes.show                GET    /u/{accountIndex}/p/{project}/notes/{note}
 *   notes.store                POST   /u/{accountIndex}/p/{project}/notes
 *   notes.update               PATCH  /u/{accountIndex}/p/{project}/notes/{note}
 *   notes.destroy               DELETE /u/{accountIndex}/p/{project}/notes/{note}
 *   notes.share                 POST   /u/{accountIndex}/p/{project}/notes/{note}/share
 *   notes.collaborators.store   POST   /u/{accountIndex}/p/{project}/notes/{note}/collaborators
 *   notes.collaborators.update  PATCH  /u/{accountIndex}/p/{project}/notes/{note}/collaborators/{user}
 *   notes.collaborators.destroy DELETE /u/{accountIndex}/p/{project}/notes/{note}/collaborators/{user}
 *   notes.images.store          POST   /u/{accountIndex}/p/{project}/notes/{note}/images
 *
 * Route model binding:
 *   - {project} → App\Models\Project (uses project_slug column)
 *   - {note}    → App\Models\Note    (uses note_id column, also project-scoped by project.member middleware)
 *
 * ============================================================
 */
Route::controller(NoteController::class)
    ->prefix('notes')
    ->name('notes.')
    ->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/{note}', 'show')->name('show');
        Route::post('/', 'store')->name('store');
        Route::patch('/{note}', 'update')->name('update');
        Route::delete('/{note}', 'destroy')->name('destroy');
    });

Route::post('notes/{note}/share', [NoteShareController::class, 'store'])->name('notes.share');

Route::controller(NoteCollaboratorController::class)
    ->prefix('notes/{note}/collaborators')
    ->name('notes.collaborators.')
    ->group(function () {
        Route::post('/', 'store')->name('store');
        Route::patch('/{user}', 'update')->name('update');
        Route::delete('/{user}', 'destroy')->name('destroy');
    });

Route::post('notes/{note}/images', [NoteImageController::class, 'store'])->name('notes.images.store');
