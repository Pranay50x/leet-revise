# LeetRevise

LeetRevise is a full-stack Next.js application for tracking solved LeetCode problems with a spaced-repetition workflow. It combines authenticated user accounts, searchable question discovery, and a revision calendar that schedules and tracks review sessions.

## Features

- Secure authentication with credentials-based sign in and registration.
- Protected application routes for dashboard and calendar pages.
- LeetCode problem search powered by LeetCode GraphQL APIs.
- Latest-question feed when no search term is provided.
- One-click "Solved Today" action to add a problem to revision schedule.
- Difficulty-based default review intervals:
	- Easy: day 3, day 6, day 9
	- Medium: day 2, day 4, day 6
	- Hard: day 1, day 2, day 3
- Calendar view for month-wise revision planning.
- Per-date completion tracking (Done +1) for each scheduled problem.
- Edit and delete support for scheduled entries.
- Duplicate protection for schedule entries at database level.

## Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript
- UI: React 19 + Tailwind CSS 4 + Radix UI primitives
- Authentication: NextAuth (Credentials Provider)
- Database: MongoDB (official Node.js driver)
- Password hashing: bcryptjs

## Application Structure

- app: App Router pages and API routes
- app/dashboard: Search and schedule workflows
- app/calendar: Revision calendar experience
- app/api/auth: Registration and NextAuth handlers
- app/api/leetcode/questions: LeetCode question retrieval endpoint
- app/api/revision/schedule: Schedule CRUD and progress updates
- lib: Domain and infrastructure modules (MongoDB, auth options, scheduling logic)
- components/ui: Reusable UI primitives

## Core Workflow

1. User registers or signs in.
2. User searches LeetCode questions from dashboard.
3. User marks a solved problem with "Solved Today".
4. Service generates review dates based on difficulty.
5. User tracks and updates review completion in calendar.

## Data and Scheduling Model

Each revision entry stores:

- Question metadata (title, slug, difficulty, acceptance rate, tags)
- Solved date
- Planned review date keys (YYYY-MM-DD)
- Per-date completion counts
- Created and updated timestamps

Database indexing enforces uniqueness per user and problem slug to prevent duplicate schedule rows.

## Environment Variables

Create a .env.local file in the project root with:

```env
MONGODB_URI=<your-mongodb-connection-string>
MONGODB_DB=leet_revise
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<long-random-secret>
```

Production notes:

- Set NEXTAUTH_URL to your production domain.
- Rotate any exposed database credentials immediately.
- Do not commit .env.local.

## Local Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start production server locally:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## API Endpoints

- POST /api/auth/register
	- Registers a new user with name, email, and password.
- GET, POST /api/auth/[...nextauth]
	- NextAuth handlers for credentials auth flows.
- GET /api/leetcode/questions
	- Fetches latest or query-filtered LeetCode questions.
- GET /api/revision/schedule
	- Returns current user revision schedule.
- POST /api/revision/schedule
	- Adds solved question to schedule.
- PATCH /api/revision/schedule
	- Supports increment-done, update-entry, and delete-entry actions.

## Deployment to Vercel

1. Import the repository into Vercel.
2. Add required environment variables in project settings:
	 - MONGODB_URI
	 - MONGODB_DB
	 - NEXTAUTH_URL
	 - NEXTAUTH_SECRET
3. Deploy using the default Next.js build command.
4. Verify authentication callbacks and protected routes after deployment.

## Validation Checklist

- User registration succeeds.
- User sign in redirects to dashboard.
- Question search returns results.
- "Solved Today" creates schedule entry.
- Calendar shows planned review dates.
- Done +1 updates completion counts.
- Edit and delete actions persist correctly.

## License

This project is currently unlicensed. Add a LICENSE file if distribution terms are required.
