# Happy Calendar

Happy Calendar is a lightweight productivity app that turns task planning into a small game. You can create tasks, assign point values, schedule them on a calendar, and earn progress toward a weekly goal as you complete them.

It combines the clarity of a calendar with simple gamification features like streaks, levels, badges, and point tracking to make everyday productivity feel more rewarding.

## Features

- Create tasks with a title, date, point value, and completion state
- View tasks in a calendar layout
- Track daily tasks in a focused side panel
- Earn weekly points toward a custom weekly goal
- Mark tasks complete and watch progress update instantly
- Edit and delete tasks
- Create recurring tasks
- Filter tasks by selected day, overdue, completed, or high-point
- Build streaks, levels, and badges over time
- Run in the browser as a shareable web app
- Keep each browser's calendar private by default
- Optionally package it as a standalone desktop app on macOS

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express

### Data
- Local SQLite-style storage using `sql.js`

## Project Structure

```text
gamified-calendar/
├── assets/
├── build/
├── client/
├── electron/
├── server/
├── scripts/
├── README.md
└── package.json
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd gamified-calendar
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Run the web app locally

In one terminal:

```bash
npm run dev:server
```

In a second terminal:

```bash
npm run dev:client
```

The browser app will be available at:

```text
http://127.0.0.1:5173
```

### 4. Run the production web app locally

```bash
npm run start:web
```

This builds the frontend and serves the full app from Express on:

```text
http://127.0.0.1:4000
```

### 5. Optional: run the desktop app

```bash
npm run desktop
```

## Deploying So You Can Share a Link

Happy Calendar now works as a standard web app:

- the React frontend builds into `client/dist`
- the Express server serves both the API and the frontend
- the server reads `PORT` from your hosting platform
- the database can live on a mounted persistent volume
- each browser gets its own anonymous calendar id, so different people do not overwrite each other by default

Note: this is privacy-by-browser, not full account sync. A person's calendar stays separate on their device/browser, but it will not automatically follow them to a second device unless sign-in is added later.

### Recommended host: Railway

I recommend Railway for this project because it supports persistent volumes for services, which matters for an app storing its data in a local database file. Railway also documents monorepo deployment by setting a root directory for the service.

This repo includes a [`railway.json`](./railway.json) file that sets:

- build command: `npm run install:all && npm run build`
- start command: `npm start`
- health check: `/health`
- required mount path: `/data`

### Railway setup steps

1. Push this project to GitHub.
2. In Railway, create a new project from that GitHub repo.
3. Set the service root directory to `gamified-calendar`.
4. If Railway does not automatically pick it up, set the config file path to `/gamified-calendar/railway.json`.
5. Add a volume and mount it to `/data`.
6. Deploy.
7. Open the generated Railway domain and share that URL.

### Optional environment variables

- `PORT`: supplied by the host
- `HOST`: defaults to `0.0.0.0` for deployment
- `HAPPY_CAL_DB_PATH`: overrides the database file path if you want something other than `/data/happy-calendar.db`
- `VITE_API_URL`: only needed if the frontend and API live on different domains

### Generic deployment commands

Build:

```bash
npm run install:all
npm run build
```

Start:

```bash
npm start
```

## Building the Standalone macOS App

To generate a packaged macOS app:

```bash
npm run package:mac
```

This produces output in:

```text
desktop-dist/
```

## Testing

### Run frontend tests

```bash
npm run test:client
```

### Run backend tests

```bash
npm run test:server
```

## Distribution

For the easiest sharing experience, deploy the web app and send people the URL.

If you still want a downloadable Mac app, you can also upload the packaged zip from `desktop-dist/` to a GitHub Release. If the app is not code-signed and notarized, macOS may require users to right-click and choose **Open** the first time.

## Future Plans

- Universal macOS build for Apple Silicon and Intel
- DMG installer
- Code signing and notarization
- Drag-and-drop task scheduling
- Series editing for recurring tasks
- Better stats and productivity insights
- Optional cloud sync or account support
