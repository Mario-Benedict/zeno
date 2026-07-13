<?php

it('checks Nginx readiness without coupling web health to PHP-FPM', function () {
    $compose = file_get_contents(base_path('docker-compose.prod.yml'));
    $nginx = file_get_contents(base_path('docker/nginx.conf'));

    expect($compose)
        ->toContain("test: ['CMD', 'wget', '--spider', '-q', 'http://127.0.0.1/nginx-health']")
        ->not->toContain('http://localhost/up');

    expect($nginx)
        ->toContain('location = /nginx-health')
        ->toContain('return 200 "ok\n";');
});

it('prints app and web diagnostics when a production rollout fails', function () {
    $workflow = file_get_contents(base_path('.github/workflows/deploy.yml'));

    expect($workflow)
        ->toContain("trap 'docker compose -f docker-compose.prod.yml ps;")
        ->toContain('logs --tail=200 app web');
});
