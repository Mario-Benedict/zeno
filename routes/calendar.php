<?php

use App\Http\Controllers\Calendar\CalendarController;
use App\Http\Controllers\Calendar\CalendarEventController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Calendar Routes
|--------------------------------------------------------------------------
|
| Included from web.php inside the `/p/{project:project_slug}/` group.
|
*/

Route::name('calendar.')->group(function () {
    Route::get('calendar', [CalendarController::class, 'show'])->name('show');

    Route::prefix('calendar/events')->name('events.')->group(function () {
        Route::get('/', [CalendarController::class, 'events'])->name('index');
        Route::post('/', [CalendarEventController::class, 'store'])->name('store');
        Route::patch('{event}', [CalendarEventController::class, 'update'])->name('update');
        Route::delete('{event}', [CalendarEventController::class, 'destroy'])->name('destroy');
    });
});
