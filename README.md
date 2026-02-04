# My Dashboard

Personal dashboard for tracking expenses, workouts, and monthly projections.
Built with a React + Vite frontend and an Express + MongoDB backend.

## Features
- Expense tracking with category breakdowns and monthly totals
- Budget projection by tier (low/mid/high)
- Workout tracking with mix visualization
- Weekly spend view and calendar view
- Local to-do list stored in `localStorage`

## Tech Stack
- Frontend: React, Vite, MUI, Emotion, Sass
- Backend: Express, Mongoose, MongoDB

## Project Structure
- `src/` frontend app (Vite)
- `server/` backend API (Express)

## Getting Started

### 1) Install dependencies
```bash
npm install
npm --prefix server install
```

### 2) Configure environment
Create a `.env` file in `server/`:
```bash
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173
PORT=5050
SESSION_SECRET=change_me
```

### 3) Run in development
```bash
npm run dev
```

This starts:
- Vite client at `http://localhost:5173`
- Express API at `http://127.0.0.1:5050`

## API Endpoints
- `POST /api/auth/bootstrap` (create first admin)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/workouts`
- `POST /api/workouts`
- `PUT /api/workouts/:id`
- `DELETE /api/workouts/:id`

## Build and Preview
```bash
npm run build
npm run preview
```

## Notes
- Expenses and workouts are stored in MongoDB.
- The dashboard uses the current month by default, but supports selecting other months.
