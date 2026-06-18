<?php

use App\Http\Controllers\Notes\NoteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    // ✂️ POTONG PREFIX: Karena sudah dibungkus group /p/{project} di web.php, kita langsung mulai dari 'notes/'
    Route::get('notes/personal', [NoteController::class, 'personal'])->name('notes.personal');
    Route::post('notes', [NoteController::class, 'store'])->name('notes.store');

    // Gunakan {note:note_id} langsung tanpa embel-embel project di depannya
    Route::patch('notes/{note:note_id}', [NoteController::class, 'update'])->name('notes.update');
    Route::delete('notes/{note:note_id}', [NoteController::class, 'destroy'])->name('notes.destroy');
});