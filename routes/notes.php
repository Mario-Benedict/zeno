<?php

use App\Http\Controllers\Notes\NoteController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Notes\NoteCollaboratorController;

Route::prefix('notes')->name('notes.')->group(function () {
    // View Pages
    Route::get('personal', [NoteController::class, 'personal'])->name('personal');
    Route::get('shared', [NoteController::class, 'shared'])->name('shared');

    // Core CRUD
    Route::post('', [NoteController::class, 'store'])->name('store');
    Route::patch('{note}', [NoteController::class, 'update'])->name('update');
    Route::delete('{note}', [NoteController::class, 'destroy'])->name('destroy');

    // Collaborators — masuk ke dalam prefix notes supaya URL-nya /notes/{note}/collaborators
    Route::post('{note}/collaborators', [NoteCollaboratorController::class, 'store'])
        ->name('collaborators.store');
    Route::patch('{note}/collaborators/{user}', [NoteCollaboratorController::class, 'update'])
        ->name('collaborators.update');
    Route::delete('{note}/collaborators/{user}', [NoteCollaboratorController::class, 'destroy'])
        ->name('collaborators.destroy');
});