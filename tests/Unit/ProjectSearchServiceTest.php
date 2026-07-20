<?php

use App\Services\ProjectSearchService;

it('gives an exact normalized match the highest fuzzy score', function () {
    $service = new ProjectSearchService;

    expect($service->fuzzyScore('  PROJÉCT ', 'project'))->toBe(1000);
});

it('ranks a candidate prefix below an exact match', function () {
    $service = new ProjectSearchService;

    $score = $service->fuzzyScore('cal', 'calendar event');

    expect($score)->toBeGreaterThan(0)->toBeLessThan(1000);
});

it('finds a close typo within a candidate word', function () {
    $service = new ProjectSearchService;

    expect($service->fuzzyScore('calender', 'calendar event'))
        ->toBeGreaterThan(0);
});

it('finds an ordered subsequence when it is not a typo match', function () {
    $service = new ProjectSearchService;

    expect($service->fuzzyScore('cldr', 'calendar'))
        ->toBeGreaterThan(0)
        ->toBeLessThan(500);
});

it('returns zero when a query does not match', function () {
    $service = new ProjectSearchService;

    expect($service->fuzzyScore('zebra', 'calendar'))->toBe(0);
});
