# Zeno

Zeno is an all-in-one project workspace. The idea behind it is simple: most teams end up juggling Jira (or some other tracker) for tasks, Slack for chat, Notion for docs, and a separate tab for ChatGPT or Gemini, just to get one project done. Zeno puts all of that inside a single project instead, so switching between five different apps to move one task forward isn't necessary anymore.

Each project in Zeno gets its own board, its own chat, its own notes, its own calendar, and its own AI assistant, all living together rather than scattered across separate tools.

## What's inside

- **Board** — a Kanban-style task board for the project.
- **Chat** — team chat scoped to the project, with real-time messaging.
- **LLM Chat** — an AI assistant (powered by Google Gemini) you can ask questions without leaving the project.
- **Notes** — shared or private notes that live next to the work they describe.
- **Calendar** — a project calendar, including conflict detection when someone's double-booked across projects.
- **Reminders & Pomodoro** — lightweight personal productivity tools scoped to the project.
- **Dashboard / Timeline** — a customizable overview of how a project is tracking.

Board, Chat, LLM Chat, and Notes are fully built out today. The rest are in various stages, from actively evolving to early/planned.

Zeno also supports multiple accounts in the same browser session, so switching between different logins doesn't mean logging out and back in.

## Built with

- **Backend**: Laravel 13, MySQL (primary database), MongoDB (for chat/LLM chat message storage)
- **Frontend**: Inertia.js with React 19 and TypeScript, styled with Tailwind CSS v4
- **Real-time**: Laravel Reverb (WebSockets) for chat and live updates
- **AI**: Google Gemini for the LLM Chat feature

## Running it locally

You'll need PHP, Composer, Node, MySQL, and MongoDB set up locally. Once dependencies are installed and `.env` is configured, the app needs a few processes running side by side — the web server, the frontend build, the WebSocket server, and a queue worker (for things like chat notifications and background jobs):

```
php artisan serve
npm run dev
php artisan reverb:start
php artisan queue:listen --tries=1
```

Or, more conveniently, `composer run dev` starts the server, queue listener, and Vite together in one go (Reverb still needs to run in its own terminal).

From there it's just visiting the app in your browser and creating an account.

## Running it in production

Zeno ships as a Docker image, built and pushed automatically by GitHub Actions whenever changes land on `main`, then deployed to the production server. In short: merge to `main`, and a fresh build rolls out on its own — no manual server steps required for a routine deploy.
