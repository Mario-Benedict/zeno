<?php

use App\Http\Controllers\Notes\NoteController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Notes\NoteCollaboratorController;

Route::post('/{note}/collaborators', [NoteCollaboratorController::class, 'store'])
    ->name('notes.collaborators.store');

Route::patch('/{note}/collaborators/{user}', [NoteCollaboratorController::class, 'update'])
    ->name('notes.collaborators.update');

Route::delete('/{note}/collaborators/{user}', [NoteCollaboratorController::class, 'destroy'])
    ->name('notes.collaborators.destroy');

Route::prefix('notes')->name('notes.')->group(function () {
    // View Pages
    Route::get('personal', [NoteController::class, 'personal'])->name('personal');
    Route::get('shared', [NoteController::class, 'shared'])->name('shared');

    // Core CRUD
    Route::post('', [NoteController::class, 'store'])->name('store');
    Route::patch('{note}', [NoteController::class, 'update'])->name('update');
    Route::delete('{note}', [NoteController::class, 'destroy'])->name('destroy');
});