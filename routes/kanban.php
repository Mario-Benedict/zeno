<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\KanbanController;
use App\Http\Controllers\Kanban\KanbanBoardController;
use App\Http\Controllers\Kanban\KanbanCardController;
use App\Http\Controllers\Kanban\KanbanCardDetailController;
use App\Http\Controllers\Kanban\KanbanChecklistController;
use App\Http\Controllers\Kanban\KanbanCommentController;

Route::name('kanban.')->group(function () {

    Route::controller(KanbanController::class)->group(function () {
        Route::get('/p/{project:project_slug}/kanbanboard', 'show')->name('show');
    });

    Route::controller(KanbanBoardController::class)->group(function () {
        Route::post('/p/{project:project_slug}/boards', 'store')->name('boards.store');
        
        Route::prefix('boards/{board}')->name('boards.')->group(function () {
            Route::patch('/', 'update')->name('update');
            Route::delete('/', 'destroy')->name('destroy');
        });
    });

    Route::controller(KanbanCardController::class)->group(function () {
        Route::post('/boards/{board}/cards', 'store')->name('cards.store');
        Route::patch('/cards/{card}/move', 'move')->name('cards.move');
        Route::delete('/cards/{card}', 'destroy')->name('cards.destroy');
    });

    Route::controller(KanbanCardDetailController::class)
        ->prefix('cards/{card}')
        ->name('cards.')
        ->group(function () {
            
        Route::patch('/detail', 'update')->name('detail.update');
        Route::patch('/dates', 'updateDates')->name('dates.update');
        
        // Grouping Labels
        Route::prefix('labels')->name('labels.')->group(function () {
            Route::post('/', 'addLabel')->name('store');
            Route::post('/create', 'createLabel')->name('create');
            Route::delete('/{label}', 'removeLabel')->name('destroy');
            Route::delete('/{label}/global', 'deleteLabel')->name('delete');
        });
        
        // Grouping Members
        Route::prefix('members')->name('members.')->group(function () {
            Route::post('/', 'addMember')->name('store');
            Route::delete('/{user}', 'removeMember')->name('destroy');
        });
    });

    Route::controller(KanbanChecklistController::class)->group(function () {
        // Checklist Utama
        Route::post('/cards/{card}/checklists', 'store')->name('cards.checklists.store');
        Route::delete('/checklists/{checklist}', 'destroy')->name('checklists.destroy');
        
        // Checklist Items
        Route::post('/checklists/{checklist}/items', 'addItem')->name('checklist.items.store');
        
        Route::prefix('checklist-items/{item}')->name('checklist.items.')->group(function () {
            Route::patch('/', 'updateItem')->name('update');
            Route::delete('/', 'destroyItem')->name('destroy');
        });
    });

    Route::controller(KanbanCommentController::class)->group(function () {
        Route::post('/cards/{card}/comments', 'store')->name('cards.comments.store');
        Route::delete('/comments/{comment}', 'destroy')->name('comments.destroy');
    });

});