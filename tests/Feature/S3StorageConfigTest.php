<?php

use App\Services\StorageService;

test('the s3 disk is configured with an overridable endpoint for R2 compatibility', function () {
    $disk = config('filesystems.disks.s3');

    expect($disk)->not->toBeNull()
        ->and($disk['driver'])->toBe('s3')
        ->and($disk)->toHaveKey('endpoint')
        ->and($disk)->toHaveKey('use_path_style_endpoint');
});

test('StorageService uses the s3 disk when STORAGE_DRIVER is set to s3', function () {
    config(['filesystems.chat_disk' => 's3']);

    expect((new StorageService)->disk())->toBe('s3');
});
