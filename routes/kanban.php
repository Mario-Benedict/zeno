<?php

use App\Http\Controllers\KanbanController;
use App\Http\Controllers\Kanban\KanbanBoardController;
use App\Http\Controllers\Kanban\KanbanCardController;
use App\Http\Controllers\Kanban\KanbanCardDetailController;
use App\Http\Controllers\Kanban\KanbanChecklistController;
use App\Http\Controllers\Kanban\KanbanCommentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Kanban Routes
|--------------------------------------------------------------------------
|
| All kanban-related routes for the application. This file is included
| from web.php inside the `/p/{project:project_slug}/` route group, so
| every endpoint declared here is automatically scoped to the current
| project (e.g. `/p/{project}/kanban/...`).
|
| Route name prefix: `projects.kanban.`
|
| Grouped by feature:
|   - Kanban Overview      → page render
|   - Boards               → board CRUD + reorder
|   - Board Cards          → cards inside a board (create / move / delete)
|   - Card Detail          → title, description, completion state
|   - Card Dates           → start & due dates
|   - Card Labels          → assign / unassign / create / delete labels
|   - Card Members         → assign / unassign project users
|   - Card Checklists      → checklists & their items
|   - Card Comments        → comments on a card
|
*/

Route::name('kanban.')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Kanban Overview
    |--------------------------------------------------------------------------
    | Loads the kanban page for the project. The `show` method hydrates the
    | full board tree (boards → cards → details → labels / members / etc.)
    | and renders the React kanban view via Inertia.
    */
    Route::get('kanban', [KanbanController::class, 'show'])->name('show');

    /*
    |--------------------------------------------------------------------------
    | Boards (columns)
    |--------------------------------------------------------------------------
    | Create new boards, rename them, reorder via drag-and-drop, and delete
    | them. A board belongs to exactly one project.
    */
    Route::controller(KanbanBoardController::class)
        ->prefix('kanban/boards')
        ->name('boards.')
        ->group(function () {
            Route::post('/', 'store')->name('store');

            Route::prefix('{board}')->name('board.')->group(function () {
                Route::patch('/', 'update')->name('update');
                Route::delete('/', 'destroy')->name('destroy');

                /*
                 * Cards nested under a specific board — create a card, move
                 * one across columns, or delete it.
                 */
                Route::controller(KanbanCardController::class)
                    ->prefix('cards')
                    ->name('cards.')
                    ->group(function () {
                        Route::post('/', 'store')->name('store');
                        Route::patch('{card}/move', 'move')->name('move');
                        Route::delete('{card}', 'destroy')->name('destroy');
                    });
            });
        });

    /*
    |--------------------------------------------------------------------------
    | Card Detail
    |--------------------------------------------------------------------------
    | Endpoints that operate on a single card (looked up by its UUID, not by
    | board). Used by the card detail modal: title, description, completion,
    | dates, labels and members.
    */
    Route::controller(KanbanCardDetailController::class)
        ->prefix('cards/{card}')
        ->name('cards.')
        ->group(function () {
            // Title / description / completion
            Route::patch('detail', 'update')->name('detail.update');

            // Start date & due date
            Route::patch('dates', 'updateDates')->name('dates.update');

            /*
             * Labels — attach an existing label, create a new project-scoped
             * label, detach a label from this card, or delete the label
             * entirely from the project.
             */
            Route::prefix('labels')->name('labels.')->group(function () {
                Route::post('/', 'addLabel')->name('store');
                Route::post('create', 'createLabel')->name('create');
                Route::delete('{label}', 'removeLabel')->name('destroy');
                Route::delete('{label}/global', 'deleteLabel')->name('delete');
            });

            /*
             * Members — assign or unassign project users to / from a card.
             */
            Route::prefix('members')->name('members.')->group(function () {
                Route::post('/', 'addMember')->name('store');
                Route::delete('{user}', 'removeMember')->name('destroy');
            });
        });

    /*
    |--------------------------------------------------------------------------
    | Card Checklists
    |--------------------------------------------------------------------------
    | Create checklists on a card, add / toggle / delete items, and delete
    | the checklist itself. Routes split between card-scoped (creation) and
    | resource-scoped (mutations on existing entities by their own id).
    */
    Route::controller(KanbanChecklistController::class)->group(function () {
        // Checklists themselves
        Route::post('cards/{card}/checklists', 'store')
            ->name('cards.checklists.store');
        Route::delete('checklists/{checklist}', 'destroy')
            ->name('checklists.destroy');

        // Items within a checklist
        Route::post('checklists/{checklist}/items', 'addItem')
            ->name('checklist.items.store');

        Route::prefix('checklist-items/{item}')->name('checklist.items.')->group(function () {
            Route::patch('/', 'updateItem')->name('update');
            Route::delete('/', 'destroyItem')->name('destroy');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Card Comments
    |--------------------------------------------------------------------------
    | Post comments on a card and delete them. Comments are addressed
    | directly by their own id when deleting.
    */
    Route::controller(KanbanCommentController::class)->group(function () {
        Route::post('cards/{card}/comments', 'store')
            ->name('cards.comments.store');
        Route::delete('comments/{comment}', 'destroy')
            ->name('comments.destroy');
    });
});
