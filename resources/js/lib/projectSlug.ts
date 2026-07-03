/**
 * Derives a URL slug from a project name, mirroring Laravel's Str::slug()
 * for the character set allowed by project name validation ([a-zA-Z0-9\- ]).
 */
export const toSlug = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, '-');
