# AGENTS.md

This file gives coding agents working in this repository the project context and
operating rules they need. It applies to the entire repository unless a more
specific `AGENTS.md` exists in a subdirectory.

Use `CLAUDE.md` as the historical source/reference for this guidance. Keep this
file updated when project architecture, commands, or conventions change.

## Product Context

Zeno is an all-in-one project workspace. It aims to combine the core workflows
usually split across tools like ClickUp, Jira, Slack, Notion, and a standalone
LLM chat client.

Per-project modules are exposed through the sidebar navigation in
`resources/js/components/layouts/Sidebar.tsx`:

- Board / Kanban
- Chat
- LLM chat
- Notes
- Calendar
- Reminders
- Pomodoro
- Dashboard / Timeline

Board, Chat, LLM chat, and Notes are implemented. Other modules may exist as
planned features, placeholders, or partially built surfaces.

## Stack

- Laravel 13
- PHP 8.3+ with Composer
- Inertia.js with React 19 and TypeScript
- Tailwind CSS v4
- MySQL as the primary database
- MongoDB through `mongodb/laravel-mongodb` for LLM chat
- Laravel Reverb for realtime chat/websockets
- Google Gemini through `google-gemini-php/laravel` for LLM chat
- Laravel Wayfinder for generated route/action helpers
- Vite, no runtime SSR by default

## Local Development Commands

Run these in separate terminals for the full local stack, especially when
working on Chat or LLM chat:

```bash
php artisan serve
npm run dev
php artisan reverb:start
php artisan queue:listen --tries=1
```

`composer run dev` starts the Laravel server, queue listener, and Vite together.
Reverb still needs its own terminal.

Frontend checks:

```bash
npm run lint:check
npm run format:check
npm run types:check
npm run build
```

Frontend fixers:

```bash
npm run lint
npm run format
```

Backend checks:

```bash
composer lint:check
php artisan test
php artisan test --filter=TestName
composer test
composer ci:check
```

Backend fixer:

```bash
composer lint
```

`composer ci:check` is the full gate: frontend lint, formatting, types, and
backend tests/lint. Run it before treating a broad change as done. For focused
frontend-only or backend-only work, run the relevant narrower checks and say
what was run.

## Generated Files

Wayfinder-generated files live under:

- `resources/js/actions/`
- `resources/js/routes/`
- `resources/js/wayfinder/`

Do not hand-edit these files. The Vite plugin regenerates them during dev/build.
Import generated route/action helpers instead of hardcoding URLs when possible.

## Multi-Account Routing

Authenticated routes are nested under:

```text
/u/{accountIndex}/...
```

This is not cosmetic. It lets one browser session contain multiple signed-in
accounts and switch between them without logging out.

Important pieces:

- `routes/web.php` defines the account-indexed route groups.
- `app/Http/Middleware/SetAccountRouteDefaults.php` resolves the current account
  from `{accountIndex}` or session state, sets the authenticated user for the
  request, stores `account.index` on the request, and calls `URL::defaults()`.
- `AccountSessionService` owns the session-backed account list.
- `app/Http/Middleware/HandleInertiaRequests.php` shares `account` and
  `accountsList` with every Inertia page.

Frontend rule: every route helper call, Wayfinder-generated or hand-written,
must receive the current `account.index`. Read it from `usePage().props.account`
or from `useProject()` / `useOptionalProject()`, which expose `accountIndex`.

For plain string paths that do not go through Wayfinder, use
`resources/js/lib/accountRoutes.ts`.

Old un-indexed routes such as `/projects` and `/p/{slug}/...` redirect to the
account-indexed equivalent for backward compatibility.

## Project-Scoped Routes

Project routes are under:

```text
/u/{accountIndex}/p/{project:project_slug}/...
```

They are guarded by project middleware:

- `project.member`
- `project.role:OWNER,ADMIN`
- `project.role:OWNER`

Relevant middleware:

- `app/Http/Middleware/EnsureProjectMember.php`
- `app/Http/Middleware/EnsureProjectRole.php`

When a route binds `{project:project_slug}`, `HandleInertiaRequests` shares:

- `project`
- `projectRole`
- `projectNavigation`
- `projectShare`

Pages under a project should consume these shared props through
`resources/js/hooks/useProject.ts`. Use `useProject()` when the component must be
inside a project route, and `useOptionalProject()` for shared layout/header UI
that can render outside a project.

## Frontend Structure

Everything frontend lives under `resources/js/`.

- `pages/`: Inertia page targets, mirroring URL/page structure.
- `layouts/`: shared page chrome such as `AppLayout` and `AuthLayout`.
- `components/`: reusable UI grouped by feature/domain.
- `components/shared/`: generic cross-feature UI.
- `hooks/`: one hook or small related hook pair per file, named `use*.ts`.
- `types/`: one file per domain plus `global.d.ts` for Inertia shared props.
- `lib/`: cross-cutting plain helpers with no React dependency.
- `utils/`: feature/domain-specific plain helpers.

When adding frontend code, fit it into the existing feature/domain grouping.
Do not create a new top-level folder unless the feature truly does not fit an
existing one.

Path aliases:

- `@/*` points to `resources/js/*`
- `@public/*` points to `public/*`

## Internationalization

The frontend has first-class i18n under `resources/js/i18n/`.

- Use `useTranslation()` from `resources/js/hooks/useTranslation.ts` for
  user-facing UI copy in pages and components.
- Translation files live under `resources/js/i18n/locales/{en,id}/`.
- Locale namespaces are grouped by feature/page area, matching the surrounding
  `pages/` and `components/<feature>/` structure where possible.
- English locale files define the source shape. Indonesian locale files should
  import `typeof en` from the matching English file so missing or extra keys are
  caught by TypeScript.
- When adding a new feature page or a new user-facing feature area, add or
  update both `en` and `id` locale files and wire any new namespace into
  `resources/js/i18n/dictionary.ts`.
- Avoid hardcoded user-facing strings in React markup, buttons, form labels,
  empty states, alerts, modal copy, page titles, aria labels, and validation
  messages. Put them in the appropriate locale namespace instead.

## Icons

There is no icon component library. Icons are raw SVG files under `public/icons`
and are imported as React components through `vite-plugin-svgr`:

```ts
import AddIcon from '@public/icons/small/plus.svg';
```

Prefer existing icons before adding new assets.

## Styling

Tailwind uses the classic `tailwind.config.js`, loaded into the Tailwind v4 CSS
pipeline through `@config` in `resources/css/app.css`.

Rules:

- Use semantic text-size tokens. Do not use arbitrary text sizes like
  `text-[13px]`.
- If a new size is genuinely needed, add a token to `tailwind.config.js`.
- Use palette tokens such as `bg-dark-surface-1`, `text-dark-primary`, and
  `status.*` / `accent.*`.
- Dark mode is the base palette. Light mode overrides `--color-dark-*` CSS
  variables under `html.light-mode`.
- Use `cn()` from `resources/js/lib/utils.ts` for class merging.
- Prettier sorts Tailwind classes in `clsx`, `cn`, and `cva`.

Dynamic user/project colors are stored as strings such as `accent-blue`.
Tailwind cannot discover runtime-generated class names like ``bg-${color}``.
Use the hex lookup in `resources/js/lib/projectAvatar.ts` and apply dynamic
colors through inline `style`.

Formatting conventions:

- 2-space indentation for TypeScript, TSX, CSS, JSON, YAML, and Markdown.
- Single quotes and semicolons in TypeScript/TSX.
- Keep Prettier and ESLint as the source of truth for style.

## React / TypeScript Conventions

- Components and hooks are arrow-function expressions:

```ts
const Example = () => {
  return null;
};
```

- Do not write new components as `function Example() {}`.
- Use `import type { X }` for type-only imports.
- Keep import groups alphabetized by the ESLint rules.
- Keep page-level state in pages and reusable state/markup in components or
  hooks once it grows beyond the page's responsibility.

## Backend Structure

Keep backend files grouped by feature/domain.

Examples:

- `app/Http/Controllers/Auth/`
- `app/Http/Controllers/Chat/`
- `app/Http/Controllers/Kanban/`
- `app/Http/Requests/Chat/`
- `app/Models/LlmChat/`

If a new backend feature has more than one class, give it a feature subfolder
instead of adding many flat files directly under shared directories.

PHP formatting is handled by Pint, configured in `pint.json`.

## Data Model Notes

`Project` uses a non-incrementing custom primary key:

```text
project_id
```

Do not assume `$project->id` exists.

Project slugs are generated and uniqued by `Project::generateUniqueSlug()`.
Do not assume slugs are user-supplied verbatim.

Project membership roles use the `ProjectRole` enum:

- `OWNER`
- `ADMIN`
- `MEMBER`
- `VIEWER`

Roles are stored as string values on the `project_user` pivot. `OWNER` is
intentionally excluded from `assignableValues()`. A project should keep exactly
one owner, so generic role-management UI/endpoints must not offer owner
reassignment.

LLM chat data lives in MongoDB through:

- `app/Models/LlmChat/*`
- `app/Services/MongoDB/MongoConnection.php`

Do not treat LLM chat persistence as normal MySQL/Eloquent migration work unless
the code explicitly does so.

## Validation, Authorization, and Security

Validate all input on the backend before it touches a model or service.

Acceptable patterns:

- Inline `$request->validate([...])` for simple one-off rules.
- A `FormRequest` under `app/Http/Requests/<Feature>/` when rules are longer,
  reused, or need custom messages.

Every form should also have client-side validation for obvious UX cases such as
required fields, length, and format. Frontend validation is only a convenience;
backend validation remains the security boundary.

Authorization must be enforced server-side through middleware, policies, or
equivalent checks. Never rely on hidden frontend buttons as the permission
boundary.

Security rules:

- Use `#[Fillable([...])]` attributes on models for mass assignment. Do not add
  `protected $fillable = [...]` to new models.
- Never call `Model::unguard()` to bypass a fillable issue.
- Sanitize user-controlled HTML/Markdown before rendering. The LLM chat renderer
  in `resources/js/components/llm-chat/LlmChatMessageList.tsx` is the reference:
  `rehype-raw` followed by `rehype-sanitize`.
- Validate upload type, size, and count. `SendMessageRequest` is the reference
  for attachment limits.
- Legacy non-GET direct request call sites must include the CSRF token from
  `meta[name="csrf-token"]` as `X-CSRF-TOKEN` until they are migrated. Do not
  add new raw `fetch()` or `axios` request paths.
- Never log, echo, or return secrets such as `GEMINI_API_KEY`,
  `REVERB_APP_SECRET`, OAuth client secrets, session tokens, or credentials.
- Response security headers are centralized in
  `app/Http/Middleware/SecurityHeaders.php`; extend that middleware instead of
  setting ad hoc controller headers.
- Reuse the existing auth, verified, and two-factor middleware stack. Do not add
  weaker parallel auth paths.

## Requests From The Frontend

Talk to the backend through Inertia:

- `useForm()`
- `router.get/post/put/patch/delete()` from `@inertiajs/react`

These handle CSRF, processing state, errors, and Inertia page prop lifecycles.

New feature code must not use `axios` or raw `fetch()` for application requests.
If a UI interaction seems to need a JSON-style background request, first adapt
the backend contract so the interaction works through Inertia props, redirects,
partial reloads, or Wayfinder-generated route helpers with `router.*`.

Do not add new `axios` usage or new raw `fetch()` call sites. Existing legacy
direct-request call sites should be migrated to Inertia; once they are gone,
remove `axios` from `package.json`, `package-lock.json`, and `node_modules`.

## Query and Side-Effect Standards

Avoid N+1 queries. Eager-load relations with `with()` / `load()` before touching
them in loops, resources, or map callbacks. Prefer selecting only needed columns
when a query feeds a narrow response shape.

Push non-blocking side effects onto the queue. Local development expects
`QUEUE_CONNECTION=database`, and `queue:listen` is part of the standard dev
stack for this reason.

## Testing Expectations

Every feature should have:

- A Pest feature test for route/middleware/user-facing behavior.
- A unit test for non-trivial isolated logic such as services, enums, helpers,
  policies, or utility functions.

Feature tests live in `tests/Feature/` and should exercise the app like real
requests. `tests/Feature/MultiAccountSessionTest.php` is a good reference for
Pest style, `RefreshDatabase`, redirects, and session assertions.

Unit tests live in `tests/Unit/`.

When adding a controller action or Inertia page, add or extend relevant tests in
the same change.

## Realtime and Background Features

Chat uses Laravel Reverb with `laravel-echo` and `pusher-js`.

Relevant files:

- `resources/js/echo.ts`
- `routes/channels.php`
- `MessageSent` broadcast event

LLM chat uses Google Gemini and MongoDB. Keep provider/API keys and MongoDB
connection details out of logs and responses.

Gemini calls run from the PHP-FPM app container through Guzzle. The production
PHP image must include `ext-curl` and CA certificates; `docker/Dockerfile`
verifies that cURL loads while building the shared runtime image.

Chat attachments and note images go through `StorageService` and store relative
paths in MongoDB. Use `CHAT_STORAGE_DISK=public` for local development and
`CHAT_STORAGE_DISK=s3` in production. The `s3` disk is also used for Cloudflare
R2 through its standard S3-compatible endpoint; do not add an R2-specific
library or send public object ACLs. S3-backed previews and downloads use
short-lived signed URLs, so the bucket can remain private.

## Agent Workflow

Before editing:

- Read the relevant code, not just filenames.
- Check for existing patterns in nearby files.
- Be careful with generated Wayfinder files.
- Do not overwrite unrelated user changes.

While editing:

- Keep changes scoped to the requested behavior.
- Prefer existing helpers, hooks, components, middleware, and service patterns.
- Add new abstractions only when they remove real complexity or match an
  established pattern.
- Do not introduce root-level files or folders unless the repo convention calls
  for them.

Before finishing:

- Run the smallest useful verification for the change.
- Run broader checks when the blast radius is broad.
- Report exactly what was run and any checks that could not be run.
