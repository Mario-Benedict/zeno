<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * StorageService
 * ---------------
 * Adapter yang mengabstraksi penyimpanan file fisik.
 * Baca driver dari config/env → local atau S3, tanpa mengubah API caller.
 *
 * Strategi path:
 *  - MongoDB  : menyimpan relative path saja  → "chats/media/uuid.webp"
 *  - Saat read: service ini resolve ke full URL secara dinamis
 *
 * Cara pakai:
 *   $path = $storage->put($file, 'chats/media');
 *   $url  = $storage->url($path);
 *
 * Migrasi local → S3: cukup ganti STORAGE_DRIVER=s3 di .env, tidak ada
 * kode lain yang perlu diubah, dan data lama (path relatif di MongoDB)
 * tetap valid karena URL di-resolve ulang saat dibaca.
 */
class StorageService
{
    /** Disk yang aktif sesuai env: 'local' | 's3' */
    private string $disk;

    public function __construct()
    {
        $this->disk = config('filesystems.chat_disk', 'public');
    }

    // ──────────────────────────────────────────────────────────────
    //  Write
    // ──────────────────────────────────────────────────────────────

    /**
     * Upload sebuah file dan kembalikan relative path-nya.
     *
     * @param  string  $folder  Contoh: 'chats/media', 'avatars'
     * @return string Relative path, contoh: 'chats/media/uuid.png'
     *
     * @throws \RuntimeException jika upload gagal
     */
    public function put(UploadedFile $file, string $folder): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid().'.'.$extension;
        $path = $folder.'/'.$filename;

        $stored = Storage::disk($this->disk)->putFileAs(
            $folder,
            $file,
            $filename,
            'public',
        );

        if ($stored === false) {
            throw new \RuntimeException("Failed to store file: {$path}");
        }

        return $path;
    }

    /**
     * Hapus file dari storage berdasarkan relative path.
     *
     * @param  string  $path  Contoh: 'chats/media/uuid.png'
     */
    public function delete(string $path): bool
    {
        return Storage::disk($this->disk)->delete($path);
    }

    /**
     * Hapus beberapa file sekaligus.
     *
     * @param  string[]  $paths
     */
    public function deleteMany(array $paths): void
    {
        if (empty($paths)) {
            return;
        }
        Storage::disk($this->disk)->delete($paths);
    }

    /**
     * Resolve relative path → full URL.
     *
     * - local / public disk : menggunakan Storage::url() → http://localhost/storage/...
     * - S3 disk             : menggunakan Storage::url() → https://bucket.s3.region.amazonaws.com/...
     *
     * MongoDB tidak pernah menyimpan URL; URL selalu di-generate fresh di sini
     * sehingga migrasi storage tidak merusak data lama.
     */
    public function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Storage::disk($this->disk)->url($path);
    }

    public function disk(): string
    {
        return $this->disk;
    }
}
