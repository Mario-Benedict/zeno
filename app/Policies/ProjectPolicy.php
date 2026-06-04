<?php

namespace App\Policies;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Determine if the user can view the project.
     */
    public function view(User $user, Project $project): bool
    {
        return $project->isMember($user);
    }

    /**
     * Determine if the user can update the project.
     */
    public function update(User $user, Project $project): bool
    {
        return $project->roleFor($user) === ProjectRole::Owner;
    }

    /**
     * Determine if the user can delete the project.
     */
    public function delete(User $user, Project $project): bool
    {
        return $project->roleFor($user) === ProjectRole::Owner;
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $project->roleFor($user)?->canManageMembers() ?? false;
    }
}
