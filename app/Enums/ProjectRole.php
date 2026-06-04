<?php

namespace App\Enums;

enum ProjectRole: string
{
    case Owner = 'OWNER';
    case Admin = 'ADMIN';
    case Member = 'MEMBER';
    case Viewer = 'VIEWER';

    /**
     * Roles that can manage invitations and member roles.
     *
     * @return list<string>
     */
    public static function managerValues(): array
    {
        return [
            self::Owner->value,
            self::Admin->value,
        ];
    }

    /**
     * Roles assignable through invites or member management.
     * Owner is intentionally excluded so a project keeps a single owner.
     *
     * @return list<string>
     */
    public static function assignableValues(): array
    {
        return [
            self::Admin->value,
            self::Member->value,
            self::Viewer->value,
        ];
    }

    public function canManageMembers(): bool
    {
        return in_array($this, [self::Owner, self::Admin], true);
    }

    public function chatParticipantRole(): string
    {
        return $this === self::Admin || $this === self::Owner ? 'admin' : 'member';
    }
}
