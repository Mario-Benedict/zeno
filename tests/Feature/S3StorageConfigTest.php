<?php

use App\Services\StorageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('the s3 disk is configured with an overridable endpoint for R2 compatibility', function () {
    $disk = config('filesystems.disks.s3');

    expect($disk)->not->toBeNull()
        ->and($disk['driver'])->toBe('s3')
        ->and($disk)->toHaveKey('endpoint')
        ->and($disk)->toHaveKey('use_path_style_endpoint');
});

test('StorageService uses the configured S3-compatible chat disk', function () {
    config(['filesystems.chat_disk' => 's3']);

    expect((new StorageService)->disk())->toBe('s3');
});

test('chat uploads stay on the public disk in local development', function () {
    Storage::fake('public');
    config(['filesystems.chat_disk' => 'public']);

    $path = (new StorageService)->put(
        UploadedFile::fake()->image('preview.png'),
        'chats/images',
    );

    Storage::disk('public')->assertExists($path);
});

test('chat uploads use the standard s3 disk without a provider-specific driver', function () {
    Storage::fake('s3');
    config(['filesystems.chat_disk' => 's3']);

    $path = (new StorageService)->put(
        UploadedFile::fake()->create('brief.pdf', 128, 'application/pdf'),
        'chats/files',
    );

    Storage::disk('s3')->assertExists($path);
});

test('the production environment template selects s3 for chat uploads', function () {
    expect(file_get_contents(base_path('docker/env.production.example')))
        ->toContain('CHAT_STORAGE_DISK=s3');
});
