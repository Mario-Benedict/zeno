<?php

use App\Http\Controllers\Reminders\NotificationController;
use App\Http\Controllers\Reminders\ReminderController;
use App\Http\Controllers\Reminders\ReminderStepController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Reminders & Notification Inbox Routes
|--------------------------------------------------------------------------
|
| Included from web.php inside the `/p/{project:project_slug}/` route
| group, so every endpoint declared here is automatically scoped to the
| current project (e.g. `/p/{project}/reminders/...`).
|
| Route name prefix: `projects.reminders.` / `projects.notifications.`
|
*/

Route::controller(ReminderController::class)
    ->prefix('reminders')
    ->name('reminders.')
    ->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::patch('/{reminder}', 'update')->name('update');
        Route::patch('/{reminder}/pin', 'togglePin')->name('toggle-pin');
        Route::delete('/{reminder}', 'destroy')->name('destroy');
    });

Route::controller(ReminderStepController::class)
    ->prefix('reminders/{reminder}/steps')
    ->name('reminders.steps.')
    ->group(function () {
        Route::post('/', 'store')->name('store');
        Route::patch('/{step}', 'update')->name('update');
        Route::delete('/{step}', 'destroy')->name('destroy');
    });

Route::get('notifications', [NotificationController::class, 'index'])
    ->name('notifications.index');
Route::post('notifications/reminders/{reminder}/open', [NotificationController::class, 'openReminder'])
    ->name('notifications.reminders.open');
Route::post('notifications/assignments/{notice}/open', [NotificationController::class, 'openCardAssignment'])
    ->name('notifications.assignments.open');
