# RANKED

RANKED is a mobile-first gym progression app with a dark game HUD look. You log lifts, the app scores them, and you climb through competitive tiers from Bronze to Emerald, just like a ranked ladder in a game.

## Stack

- Next.js 15 (App Router) with React 19 and TypeScript
- Tailwind CSS v4 (CSS-first config)
- SQLite via better-sqlite3 and Drizzle ORM
- Vitest for tests, sharp for icon generation

## Setup

```bash
npm install
npm run setup
npm run dev
```

Then open http://localhost:3000.

## Useful scripts

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm test`: run the test suite
- `npm run db:reset`: wipe and reseed the local database
- `npm run icons`: regenerate PWA icons from public/icons/icon.svg
