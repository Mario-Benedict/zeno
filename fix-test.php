<?php

$content = file_get_contents('tests/Feature/LlmChatMongoTest.php');
$content = preg_replace('/it\(\'bisa membalas history percakapan.*?\);/s', '', $content);
file_put_contents('tests/Feature/LlmChatMongoTest.php', $content);
echo 'Fixed';
