<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
|
| Included from web.php inside the `/p/{project:project_slug}/` route group.
| Every endpoint here is automatically scoped to the current project.
|
*/

Route::name('projects.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'show'])->name('dashboard');
    Route::patch('/dashboard', [DashboardController::class, 'update'])->name('dashboard.update');
});
