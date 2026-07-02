<?php

use App\Http\Controllers\Notes\NoteCollaboratorController;
use App\Http\Controllers\Notes\NoteController;
use App\Http\Controllers\Notes\NoteImageController;
use App\Http\Controllers\Notes\NoteShareController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notes Routes
|--------------------------------------------------------------------------
|
| Included from web.php inside the `/p/{project:project_slug}/` group, so
| every endpoint here is scoped to the current project (`/p/{project}/notes/...`).
| Route name prefix: `projects.notes.`
|
| A single workspace page (`index`) renders both personal and shared notes —
| there is no more per-tab route. `show`, `store`, `update`, `destroy` are
| plain JSON endpoints so the frontend can autosave and lazy-load content
| without a full Inertia page reload.
|
*/

Route::controller(NoteController::class)->prefix('notes')->name('notes.')->group(function () {
    Route::get('/', 'index')->name('index');
    Route::get('{note}', 'show')->name('show');
    Route::post('/', 'store')->name('store');
    Route::patch('{note}', 'update')->name('update');
    Route::delete('{note}', 'destroy')->name('destroy');
});

Route::post('notes/{note}/share', [NoteShareController::class, 'store'])->name('notes.share');

Route::controller(NoteCollaboratorController::class)
    ->prefix('notes/{note}/collaborators')
    ->name('notes.collaborators.')
    ->group(function () {
        Route::post('/', 'store')->name('store');
        Route::patch('{user}', 'update')->name('update');
        Route::delete('{user}', 'destroy')->name('destroy');
    });

Route::post('notes/{note}/images', [NoteImageController::class, 'store'])->name('notes.images.store');
