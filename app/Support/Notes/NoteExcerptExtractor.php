<?php

namespace App\Support\Notes;

/**
 * NoteExcerptExtractor
 * ----------------------
 * Turns a Tiptap/ProseMirror JSON document (the shape stored in
 * `notes.content`) into a short plain-text preview for list views, so the
 * frontend never has to ship or parse the full block tree just to render a
 * sidebar row.
 */
class NoteExcerptExtractor
{
    private const MAX_LENGTH = 180;

    /**
     * @param  array<string, mixed>|null  $document  A ProseMirror doc: { type: 'doc', content: [...] }
     */
    public static function extract(?array $document): ?string
    {
        if (empty($document)) {
            return null;
        }

        $text = trim(preg_replace('/\s+/', ' ', self::collectText($document)) ?? '');

        if ($text === '') {
            return null;
        }

        return mb_strlen($text) > self::MAX_LENGTH
            ? mb_substr($text, 0, self::MAX_LENGTH).'…'
            : $text;
    }

    /**
     * @param  array<string, mixed>  $node
     */
    private static function collectText(array $node): string
    {
        // Text leaves concatenate directly — adjacent text nodes are often
        // just the same word split across a mark boundary (e.g. "wor" +
        // bold "ld" for "wor**ld**"), so inserting a space here would
        // garble the excerpt mid-word.
        if (isset($node['text']) && is_string($node['text'])) {
            return $node['text'];
        }

        $childText = '';

        foreach ($node['content'] ?? [] as $child) {
            if (is_array($child)) {
                $childText .= self::collectText($child);
            }
        }

        // Block-level nodes (paragraph, heading, listItem, …) get a
        // trailing space so text from the next sibling block doesn't run
        // into this one.
        $isInline = in_array($node['type'] ?? null, ['text', 'hardBreak'], true);

        return $isInline ? $childText : $childText.' ';
    }
}
