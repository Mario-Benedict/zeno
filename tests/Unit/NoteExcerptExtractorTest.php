<?php

use App\Support\Notes\NoteExcerptExtractor;

it('keeps complete normalized note text available for search', function () {
    $needle = 'ultravioletneedle';
    $document = [
        'type' => 'doc',
        'content' => [
            [
                'type' => 'paragraph',
                'content' => [
                    ['type' => 'text', 'text' => str_repeat('prefix ', 30)],
                    ['type' => 'text', 'text' => $needle],
                ],
            ],
            [
                'type' => 'paragraph',
                'content' => [['type' => 'text', 'text' => 'second block']],
            ],
        ],
    ];

    expect(NoteExcerptExtractor::extract($document))
        ->not->toContain($needle)
        ->and(NoteExcerptExtractor::plainText($document))
        ->toContain($needle)
        ->toEndWith('second block');
});

it('returns null plain text for an empty document', function () {
    expect(NoteExcerptExtractor::plainText(null))->toBeNull()
        ->and(NoteExcerptExtractor::plainText([]))->toBeNull();
});
