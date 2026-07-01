<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Manages the multi-account session array.
 *
 * Session keys (flat, no dot-notation to avoid nested-array collisions):
 *   'accounts'              → list<array{user_id: int}>  (numerically indexed)
 *   'account_active_index'  → int
 *
 * Switching accounts is a pure front-end navigation to `/u/{index}/...`.
 * SetAccountRouteDefaults reads the index and calls `Auth::setUser()`.
 */
final class AccountSessionService
{
    private const KEY_LIST = 'accounts';

    private const KEY_ACTIVE = 'account_active_index'; // flat key — no dot notation

    // ── Read ──────────────────────────────────────────────────────────────────

    /** Return only the valid (array-shaped) entries from the accounts session. */
    public static function getAccounts(Request $request): array
    {
        $raw = $request->session()->get(self::KEY_LIST, []);

        // Defensive: drop any stale non-array entries (e.g. from a previous
        // session schema where dot-notation wrote 'active_index' into this array).
        return array_filter(
            is_array($raw) ? $raw : [],
            fn ($entry) => is_array($entry) && isset($entry['user_id']),
        );
    }

    public static function getActiveIndex(Request $request): int
    {
        return max(0, (int) $request->session()->get(self::KEY_ACTIVE, 0));
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * Register a user in the session accounts list.
     * Returns the account index (existing or newly created).
     */
    public static function addAccount(Request $request, int $userId): int
    {
        $accounts = self::getAccounts($request);

        foreach ($accounts as $index => $account) {
            if ((int) $account['user_id'] === $userId) {
                $request->session()->put(self::KEY_ACTIVE, $index);

                return $index;
            }
        }

        // Re-index to fill any gaps left by previous removals
        $accounts = array_values($accounts);
        $index = count($accounts);
        $accounts[$index] = ['user_id' => $userId];

        $request->session()->put(self::KEY_LIST, $accounts);
        $request->session()->put(self::KEY_ACTIVE, $index);

        return $index;
    }

    /**
     * Remove one account and re-index.
     * Returns the new active index, or null when no accounts remain.
     */
    public static function removeAccount(Request $request, int $removeIndex): ?int
    {
        $accounts = self::getAccounts($request);
        unset($accounts[$removeIndex]);
        $accounts = array_values($accounts);

        if (empty($accounts)) {
            $request->session()->forget([self::KEY_LIST, self::KEY_ACTIVE]);

            return null;
        }

        $request->session()->put(self::KEY_LIST, $accounts);
        $request->session()->put(self::KEY_ACTIVE, 0);

        return 0;
    }

    /** Full sign-out — wipe every account. */
    public static function clearAll(Request $request): void
    {
        $request->session()->forget([self::KEY_LIST, self::KEY_ACTIVE]);
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    /**
     * Hydrate accounts with User models for the Inertia frontend.
     *
     * @return list<array{index:int, name:string, email:string, avatar:string|null, is_active:bool}>
     */
    public static function accountsList(Request $request): array
    {
        $accounts = self::getAccounts($request);
        $activeIndex = (int) $request->attributes->get('account.index', 0);
        $list = [];

        if (empty($accounts)) {
            return $list;
        }

        $users = User::query()
            ->whereKey(
                collect($accounts)
                    ->pluck('user_id')
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values()
                    ->all(),
            )
            ->get()
            ->keyBy('id');

        foreach ($accounts as $index => $account) {
            $user = $users->get((int) $account['user_id']);

            if ($user === null) {
                continue;
            }

            $list[] = [
                'index' => $index,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => is_string($user->avatar ?? null) ? $user->avatar : null,
                'is_active' => $index === $activeIndex,
            ];
        }

        return $list;
    }
}
