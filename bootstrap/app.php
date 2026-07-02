<?php

use App\Http\Middleware\EnsureProjectMember;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            SecurityHeaders::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias(['project.member' => EnsureProjectMember::class,
        ]);

        // Note content is a Tiptap/ProseMirror JSON tree — whitespace inside
        // its text nodes is meaningful document content, not incidental
        // padding, so it must not be auto-trimmed like a normal form field
        // (see NoteExcerptExtractor, which relies on that whitespace being
        // preserved exactly as typed).
        $middleware->trimStrings(except: ['content*']);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
