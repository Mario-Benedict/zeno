<?php

use App\Http\Controllers\Timeline\TimelineController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Timeline Routes
|--------------------------------------------------------------------------
|
| The Timeline is a per-project module that re-visualises the project's
| existing Kanban tasks on a horizontal time axis. This file is included
| from web.php inside the `/p/{project:project_slug}/` route group (within
| the `projects.` name group), so the endpoint is automatically scoped to
| the current project and guarded by `project.member`.
|
| Route name prefix: `projects.timeline.`
|
| Timeline is read-only: it renders the page and then reuses the existing
| Kanban write endpoints (`projects.kanban.cards.dates.update`,
| `projects.kanban.boards.board.cards.store`) for every mutation, so no
| Timeline-specific write routes are declared here.
|
*/

Route::name('timeline.')->group(function () {
    Route::get('timeline', [TimelineController::class, 'show'])->name('show');
});
