# LeetRevise

LeetRevise helps you retain solved LeetCode problems using a spaced-repetition workflow.
It combines problem discovery, revision scheduling, and progress tracking in one place.

## Why This Project

Most interview prep workflows optimize for volume solved, not recall quality over time.
LeetRevise focuses on long-term retention by turning each solved problem into a review plan that can be tracked and adjusted.

## Highlights

- Email/password authentication with protected app routes
- LeetCode search integration via GraphQL
- One-click add to revision schedule from dashboard
- Difficulty-aware default review intervals
- Monthly revision calendar with completion counters
- Edit and delete flows for scheduled entries
- Duplicate schedule protection with database-level constraints

## Review Interval Strategy

Default intervals are generated from problem difficulty:

- Easy: day 3, day 6, day 9
- Medium: day 2, day 4, day 6
- Hard: day 1, day 2, day 3

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, Radix UI |
| Auth | NextAuth (Credentials Provider) |
| Data Store | MongoDB |
| Security | bcryptjs for password hashing |

## Repository Layout

| Path | Purpose |
| --- | --- |
| app | App Router pages and API handlers |
| app/dashboard | Search + add solved question workflow |
| app/calendar | Calendar-based revision management |
| app/api/auth | Registration and NextAuth routes |
| app/api/leetcode/questions | LeetCode query endpoint |
| app/api/revision/schedule | Schedule list/create/update/delete |
| lib | Business logic and infrastructure modules |
| components/ui | Reusable UI components |

## Product Flow

1. Create an account or sign in.
2. Search for solved LeetCode questions.
3. Add a solved question to the revision plan.
4. Let the app generate review dates.
5. Track and update completion from the calendar.

## Environment Variables

Create .env.local in the project root:

```env
MONGODB_URI=<your-mongodb-connection-string>
MONGODB_DB=leet_revise
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<long-random-secret>
```

Notes:

- Use your deployed domain for NEXTAUTH_URL in production.
- Never commit secrets.
- If credentials were exposed, rotate them immediately.

## Local Setup

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run production build locally:

```bash
npm run start
```

Run lint checks:

```bash
npm run lint
```

## API Overview

| Method | Route | Description |
| --- | --- | --- |
| POST | /api/auth/register | Register a new user |
| GET, POST | /api/auth/[...nextauth] | NextAuth handlers |
| GET | /api/leetcode/questions | Fetch latest or searched questions |
| GET | /api/revision/schedule | List current user schedule |
| POST | /api/revision/schedule | Add solved question to schedule |
| PATCH | /api/revision/schedule | increment-done, update-entry, delete-entry |

## Deployment

### Vercel

1. Import this repository into Vercel.
2. Configure environment variables:
   - MONGODB_URI
   - MONGODB_DB
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
3. Deploy with default Next.js settings.
4. Validate login, protected routes, and revision APIs after release.

## Validation Checklist

- Registration and login work end-to-end.
- Authenticated users reach dashboard and calendar.
- Search results load from LeetCode API.
- Solved questions create schedule entries.
- Calendar renders correct monthly due items.
- Completion increments persist.
- Edit/delete schedule operations persist.

## Contributing

Contributions are welcome. For significant changes, please open an issue first to discuss scope and approach.

Recommended contribution workflow:

1. Fork the repository.
2. Create a feature branch.
3. Keep pull requests focused and small.
4. Include clear reproduction or validation steps.

## Security

If you discover a security issue, avoid opening a public issue with sensitive details.
Share a private report with maintainers so the issue can be triaged and patched responsibly.

## License

This repository is currently unlicensed.
If you plan to accept external contributions, add a LICENSE file before broad distribution.
