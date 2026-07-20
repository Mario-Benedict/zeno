<?php

namespace App\Http\Controllers;

use App\Services\StorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private readonly StorageService $storage) {}

    public function update(int $accountIndex, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $request->user()->update(['name' => trim($validated['name'])]);

        return back()->with('status', 'profile-updated');
    }

    public function storeAvatar(int $accountIndex, Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:2048'],
        ]);

        $user = $request->user();

        if ($user->avatar_url) {
            $this->storage->delete($user->avatar_url);
        }

        $path = $this->storage->put($request->file('avatar'), 'user-avatars');

        $user->update(['avatar_url' => $path]);

        return back();
    }

    public function destroyAvatar(int $accountIndex, Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar_url) {
            $this->storage->delete($user->avatar_url);
            $user->update(['avatar_url' => null]);
        }

        return back();
    }
}
