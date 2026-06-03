<?php

namespace App\Services\MongoDB;

use Illuminate\Support\Facades\DB;
use MongoDB\Client;
use MongoDB\Collection;
use MongoDB\Database;

/**
 * MongoConnection
 * ----------------
 * Thin adapter yang menggunakan koneksi MongoDB dari Laravel DB Manager.
 *
 * Driver   : mongodb/laravel-mongodb (menggunakan driver 'mongodb')
 * Config   : config/database.php → connections.mongodb
 * Env keys : MONGODB_URI, MONGODB_DATABASE
 *
 * Interface publik tetap sama sehingga ChatMessageService dan
 * SetupMongoIndexes tidak perlu diubah.
 */
class MongoConnection
{
    /**
     * Ambil sebuah collection dari database aktif.
     *
     * @param  string  $name  Nama collection, contoh: 'chat_messages'
     */
    public function collection(string $name): Collection
    {
        return $this->database()->selectCollection($name);
    }

    public function database(): Database
    {
        return DB::connection('mongodb')->getMongoDB();
    }

    public function client(): Client
    {
        return DB::connection('mongodb')->getMongoClient();
    }
}
