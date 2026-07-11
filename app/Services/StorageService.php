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
 * Migrasi local → S3: cukup ganti CHAT_STORAGE_DISK=s3 di .env, tidak ada
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

        // R2 and many S3-compatible providers do not support object ACLs.
        // Local public storage still needs explicit public visibility; S3
        // objects are read through signed URLs instead.
        $options = $this->usesS3Driver() ? [] : ['visibility' => 'public'];

        if ($this->usesS3Driver() && str_starts_with($folder, 'chats/files')) {
            $options['ContentDisposition'] = 'attachment; filename="'.
                $this->safeFilename($file->getClientOriginalName()).'"';
        }

        $stored = Storage::disk($this->disk)->putFileAs(
            $folder,
            $file,
            $filename,
            $options,
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

        $disk = Storage::disk($this->disk);

        if ($this->usesS3Driver()) {
            return $disk->temporaryUrl($path, $this->temporaryUrlExpiration());
        }

        return $disk->url($path);
    }

    /**
     * Resolve a URL that asks object storage to download with the original name.
     */
    public function downloadUrl(?string $path, ?string $filename): ?string
    {
        if (! $path) {
            return null;
        }

        if (! $this->usesS3Driver()) {
            return Storage::disk($this->disk)->url($path);
        }

        $safeFilename = $this->safeFilename($filename);

        return Storage::disk($this->disk)->temporaryUrl(
            $path,
            $this->temporaryUrlExpiration(),
            ['ResponseContentDisposition' => "attachment; filename=\"{$safeFilename}\""],
        );
    }

    public function disk(): string
    {
        return $this->disk;
    }

    private function usesS3Driver(): bool
    {
        return config("filesystems.disks.{$this->disk}.driver") === 's3';
    }

    private function temporaryUrlExpiration(): \DateTimeInterface
    {
        return now()->addMinutes(max(1, (int) config('filesystems.temporary_url_ttl', 60)));
    }

    private function safeFilename(?string $filename): string
    {
        return preg_replace(
            '/[^A-Za-z0-9._-]/',
            '_',
            Str::ascii($filename ?: 'download'),
        ) ?: 'download';
    }
}
