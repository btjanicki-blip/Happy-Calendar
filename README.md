# Happy Calendar

Happy Calendar is a lightweight desktop productivity app that turns task planning into a small game. You can create tasks, assign point values, schedule them on a calendar, and earn progress toward a weekly goal as you complete them.

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
- Run as a standalone desktop app on macOS

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express

### Desktop
- Electron

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

### 3. Run the desktop app

```bash
npm run desktop
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

## Future Plans

- Universal macOS build for Apple Silicon and Intel
- DMG installer
- Code signing and notarization
- Drag-and-drop task scheduling
- Series editing for recurring tasks
- Better stats and productivity insights
- Optional cloud sync or account support
