<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\AccountSessionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

class SetAccountRouteDefaults
{
    public function handle(Request $request, Closure $next): Response
    {
        $routeIndex = $request->route('accountIndex');
        $sessionIndex = AccountSessionService::getActiveIndex($request);

        $accountIndex = is_numeric($routeIndex)
            ? max(0, (int) $routeIndex)
            : max(0, $sessionIndex);

        // ── Bootstrap accounts array on first login ───────────────────────
        // On first page load after login the accounts array may not have been
        // populated yet (e.g. on page refresh or after a direct Auth::login()
        // call). Read the user ID straight from the session store to avoid
        // calling Auth::check() which would lock the guard into the "standard"
        // session user BEFORE our per-account setUser() override can run.
        $accounts = AccountSessionService::getAccounts($request);

        if (empty($accounts)) {
            // getName() returns e.g. "login_web_<sha1>" — the raw session key
            // under which the standard auth guard stores the user ID.
            $sessionUserId = $request->session()->get(
                Auth::guard()->getName()
            );

            if ($sessionUserId !== null) {
                AccountSessionService::addAccount($request, (int) $sessionUserId);
                $accounts = AccountSessionService::getAccounts($request);
            }
        }

        // ── Authenticate as the requested account ─────────────────────────
        // Account-scoped routes use the URL index. Auth-only legacy routes
        // such as /projects, /invite/{token}, and /logout use the active
        // session index. Guest routes stay untouched so add-account can reach
        // /login and /register while older sessions remain stored.
        if (is_numeric($routeIndex) || $this->routeUsesAuthMiddleware($request)) {
            $resolvedUser = null;

            if (isset($accounts[$accountIndex])) {
                $resolvedUser = User::find($accounts[$accountIndex]['user_id']);

                if (! $resolvedUser instanceof User) {
                    // Stale entry — remove and fall back to index 0
                    AccountSessionService::removeAccount($request, $accountIndex);
                    $accounts = AccountSessionService::getAccounts($request);
                    $accountIndex = 0;
                    $resolvedUser = isset($accounts[0])
                        ? User::find($accounts[0]['user_id'])
                        : null;
                }
            } elseif (! empty($accounts)) {
                $accountIndex = 0;
                $resolvedUser = User::find($accounts[0]['user_id']);
            }

            if ($resolvedUser instanceof User) {
                // Set on the auth guard so `auth()->user()` works in controllers.
                Auth::setUser($resolvedUser);

                // Also override the request's own user resolver so that
                // `$request->user()` unambiguously returns the right account user
                // regardless of which guard the standard session tries to restore.
                $request->setUserResolver(fn () => $resolvedUser);
            }
        }

        // Persist the resolved index (flat key — no dot-notation collision)
        $request->session()->put('account_active_index', $accountIndex);
        $request->attributes->set('account.index', $accountIndex);

        URL::defaults(['accountIndex' => $accountIndex]);

        return $next($request);
    }

    private function routeUsesAuthMiddleware(Request $request): bool
    {
        $route = $request->route();

        if ($route === null) {
            return false;
        }

        foreach ($route->gatherMiddleware() as $middleware) {
            $middleware = (string) $middleware;

            if ($middleware === 'auth' || str_starts_with($middleware, 'auth:')) {
                return true;
            }
        }

        return false;
    }
}
