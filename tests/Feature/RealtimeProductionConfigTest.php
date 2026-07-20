<?php

it('keeps the production Reverb runtime key aligned with the frontend bundle', function () {
    $workflow = file_get_contents(base_path('.github/workflows/deploy.yml'));
    $compose = file_get_contents(base_path('docker-compose.prod.yml'));

    expect($workflow)
        ->toContain('Validate realtime build variables')
        ->toContain('REVERB_APP_KEY=${{ vars.REVERB_APP_KEY }}')
        ->toContain('logs --tail=200 app web reverb caddy');

    expect($compose)
        ->toContain("@fsockopen('127.0.0.1', 8080)")
        ->toContain("reverb:\n        condition: service_healthy");
});

it('authenticates private sockets through the account-indexed endpoint', function () {
    $echo = file_get_contents(base_path('resources/js/echo.ts'));
    $routes = file_get_contents(base_path('routes/web.php'));

    expect($echo)
        ->toContain('`/u/${accountIndex}/broadcasting/auth`');
    expect($routes)
        ->toContain("Route::post('broadcasting/auth'")
        ->toContain("name('account.broadcasting.auth')");
});

it('keeps upload limits inside the application error-handling boundary', function () {
    $dockerfile = file_get_contents(base_path('docker/Dockerfile'));
    $php = file_get_contents(base_path('docker/php/uploads.ini'));
    $nginx = file_get_contents(base_path('docker/nginx.conf'));
    $frontend = file_get_contents(base_path('resources/js/app.tsx'));

    expect($dockerfile)->toContain('COPY docker/php/uploads.ini');
    expect($php)
        ->toContain('upload_max_filesize=50M')
        ->toContain('post_max_size=55M');
    expect($nginx)->toContain('client_max_body_size 60m');
    expect($frontend)
        ->toContain("router.on('httpException'")
        ->toContain('notifyUploadTooLarge()');
});

it('rebases dirty shared notes onto incoming realtime versions', function () {
    $editor = file_get_contents(base_path('resources/js/components/notes/useNoteEditor.ts'));
    $realtime = file_get_contents(base_path('resources/js/components/notes/useNoteRealtime.ts'));

    expect($editor)
        ->toContain('The remote document is now the merge base.')
        ->toContain('scheduleSave(editor);');
    expect($realtime)
        ->toContain('setHasStaleRemoteChange(!applied)');
});
