<?php

use App\Http\Controllers\Notes\NoteController;
use Illuminate\Support\Facades\Route;

Route::get('notes/personal', [NoteController::class, 'personal'])->name('notes.personal');
Route::get('notes/trash', [NoteController::class, 'trash'])->name('notes.trash');
Route::post('notes', [NoteController::class, 'store'])->name('notes.store');
Route::patch('notes/{note}', [NoteController::class, 'update'])->name('notes.update');
Route::delete('notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');
Route::patch('notes/{noteId}/restore', [NoteController::class, 'restore'])->name('notes.restore');
Route::delete('notes/{noteId}/force', [NoteController::class, 'forceDelete'])->name('notes.forceDelete');