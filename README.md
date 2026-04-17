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
- MongoDB using `mongoose`

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

### 3. Start MongoDB locally

Happy Calendar now expects a Mongo connection string.

Create a `.env` file in `gamified-calendar/` from `.env.example`, or export one directly:

```bash
export MONGO_SRV=mongodb://127.0.0.1:27017/happy-calendar
```

Then make sure MongoDB is running on your machine or update `MONGO_SRV` to your Atlas/local URI.

### 4. Run the web app locally

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

## Deploying So You Can Share a Link

Happy Calendar now works as a standard web app:

- the React frontend builds into `client/dist`
- the Express server serves both the API and the frontend
- the server reads `PORT` from your hosting platform
- the database lives in MongoDB instead of local app storage
- each browser gets its own anonymous calendar id, so different people do not overwrite each other by default

Note: this is privacy-by-browser, not full account sync. A person's calendar stays separate on their device/browser, but it will not automatically follow them to a second device unless sign-in is added later.

### Deploying on Vercel

Vercel can host the app cleanly with MongoDB because the app no longer depends on local filesystem storage. The Express app is exposed from the project root for Vercel, static assets build into `public/`, and the API opens a cached Mongo connection per serverless instance.

This repo includes Vercel-specific setup:

- `app.js` at the project root for Vercel's Express runtime
- `vercel.json` with a Vercel build command and SPA rewrites
- `.vercelignore` to exclude Electron and desktop artifacts
- `npm run build:vercel` to build the frontend into `public/`
- automatic Mongo connection reuse through the shared server bootstrap

#### Vercel setup steps

1. Import the GitHub repo into Vercel.
2. Set the Root Directory to `gamified-calendar`.
3. Add `MONGO_SRV` in Vercel Environment Variables. This should be your MongoDB Atlas connection string or another externally hosted Mongo URI.
4. Redeploy.

#### Vercel environment variables

- `MONGO_SRV`: required on Vercel for durable app data
- `MONGODB_URI`: optional alternate variable name if you prefer that convention

For Vercel, MongoDB Atlas is the easiest fit because it is already remote and works well with serverless functions.

### Recommended host: Railway

Railway is still a good option, but with MongoDB it no longer needs a persistent volume for app data. You can point the app at Atlas or another Mongo deployment and keep the same app behavior across Railway and Vercel.

This repo includes a [`railway.json`](./railway.json) file that sets:

- build command: `npm run install:all && npm run build`
- start command: `npm start`
- health check: `/health`

### Railway setup steps

1. Push this project to GitHub.
2. In Railway, create a new project from that GitHub repo.
3. Set the service root directory to `gamified-calendar`.
4. If Railway does not automatically pick it up, set the config file path to `/gamified-calendar/railway.json`.
5. Add `MONGO_SRV` to the Railway service variables.
6. Deploy.
7. Open the generated Railway domain and share that URL.

### Optional environment variables

- `PORT`: supplied by the host
- `HOST`: defaults to `0.0.0.0` for deployment
- `MONGO_SRV`: MongoDB connection string used by the server
- `MONGODB_URI`: alternate MongoDB connection string name
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

## Future Plans

- Drag-and-drop task scheduling
- Series editing for recurring tasks
- Better stats and productivity insights
- Optional cloud sync or account support
