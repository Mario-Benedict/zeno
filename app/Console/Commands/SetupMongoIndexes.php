<?php

namespace App\Console\Commands;

use App\Services\MongoDB\MongoConnection;
use Illuminate\Console\Command;
use MongoDB\Model\IndexInfo;


class SetupMongoIndexes extends Command
{
    protected $signature   = 'mongo:setup-indexes';
    protected $description = 'Create required MongoDB indexes for the Chat feature.';

    public function handle(MongoConnection $mongo): int
    {
        $this->info('Creating MongoDB indexes for chat_messages...');

        $collection = $mongo->collection('chat_messages');

        $indexes = [
            [
                'key'        => ['room_id' => 1, '_id' => -1],
                'name'       => 'room_id_1__id_-1',
                'background' => true,
            ],
            [
                'key'        => ['room_id' => 1, 'created_at' => -1],
                'name'       => 'room_id_1_created_at_-1',
                'background' => true,
            ],
            [
                'key'        => ['sender_id' => 1],
                'name'       => 'sender_id_1',
                'background' => true,
            ],
            [
                'key'                  => ['room_id' => 1, 'is_deleted' => 1, '_id' => -1],
                'name'                 => 'room_id_1_is_deleted_1__id_-1',
                'background'           => true,
                'partialFilterExpression' => ['is_deleted' => false],
            ],
        ];

        $existing = collect(iterator_to_array($collection->listIndexes()))
            ->map(fn (IndexInfo $i) => $i->getName())
            ->all();

        $created = 0;
        $skipped = 0;

        foreach ($indexes as $spec) {
            $name = $spec['name'];

            if (in_array($name, $existing, true)) {
                $this->line("  <comment>SKIP</comment>  {$name} (already exists)");
                $skipped++;
                continue;
            }

            $collection->createIndex(
                $spec['key'],
                array_diff_key($spec, ['key' => null]),
            );

            $this->line("  <info>OK</info>    {$name}");
            $created++;
        }

        $this->newLine();
        $this->info("Done. Created: {$created}, Skipped: {$skipped}.");

        return self::SUCCESS;
    }
}