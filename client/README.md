# Neighbor Aid Connect

Neighbor Aid Connect is a full-stack community help platform where residents can post local service requests and workers/volunteers can respond, collaborate, and communicate in real time.

This project includes:
- A React + Vite frontend (`client`)
- A Node.js + Express + MongoDB backend (`server`)
- Real-time communication with Socket.IO
- Role-based behavior for residents, workers, and admins

## Core Features

- User authentication (signup, login, JWT-based protected APIs)
- User profile management with extended fields (skills, bio, emergency contact, preferences)
- Help request lifecycle:
  - Create request
  - Browse/filter requests
  - Offer help / mark in-progress
  - Complete and rate service
- Chat system between users with request-aware restrictions
- Rating system for helpers/workers
- Admin capabilities (admin creation/listing and admin routes)
- Activity tracking and role-oriented dashboards

## Tech Stack

### Frontend (`client`)
- React 19
- React Router
- Vite
- Axios
- Socket.IO Client
- Tailwind CSS + MUI

### Backend (`server`)
- Node.js
- Express 5
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing
- Socket.IO

## Project Structure

```text
Neighbhor-aid-connect/
  client/                    # React frontend
    src/
      components/            # UI and feature components
      config/config.js       # Frontend dynamic app configuration
  server/                    # Express backend
    config/config.js         # Backend dynamic configuration + env fallbacks
    middleware/auth.js       # JWT auth middleware
    models/                  # Mongoose schemas/models
    routes/                  # API route modules
    index.js                 # Server entry + Socket.IO setup
```

## Backend API Modules

The server mounts these route groups:

- `/api/auth` -> authentication, current user, profile updates, admin creation/listing
- `/api/chats` -> create/get chats, fetch/send messages for chat threads
- `/api/messages` -> message-related endpoints
- `/api/users` -> user directory/profile-related operations
- `/api/volunteers` -> volunteer-specific operations
- `/api/requests` -> request CRUD, status transitions, and request rating
- `/api/ratings` -> dedicated rating functionality and statistics
- `/api/admin` -> admin dashboard/management endpoints
- `/api/assistant` -> resident AI assistant (Gemini intent + Mongo-backed answers; requires auth)

## Configuration

Both frontend and backend use dynamic config files with environment variable support.

### Frontend env (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=Neighbor Aid Connect
VITE_APP_VERSION=1.0.0
```

### Backend env (`server/.env`)

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI assistant (resident dashboard → AI Assistant tab)
GEMINI_API_KEY=your_google_ai_studio_key
# Optional; default in code is gemini-2.0-flash
AI_MODEL=gemini-2.0-flash
```

## Getting Started

### 1) Install dependencies

From repository root:

```bash
cd client && npm install
cd ../server && npm install
```

### 2) Start backend

```bash
cd server
npm start
```

### 3) Start frontend

In another terminal:

```bash
cd client
npm run dev
```

Frontend default URL: `http://localhost:5173`  
Backend default URL: `http://localhost:3000`

## Scripts

### Client
- `npm run dev` - Start Vite dev server
- `npm run build` - Create production build
- `npm run preview` - Preview build
- `npm run lint` - Run ESLint

### Server
- `npm start` - Start backend with nodemon

## Data Model Overview

Main entities in `server/models`:
- `userSchema` - users, roles, profile fields, rating stats
- `requestSchema` - help/service requests and status flow
- `chatSchema` / `messageSchema` - conversations and messages
- `ratingSchema` - rating records/statistics
- `activitySchema` - user/admin activity logging

## Typical User Flow

1. User signs up and logs in.
2. Resident posts a help request.
3. Worker/volunteer discovers and accepts request.
4. Users communicate in chat while request is active.
5. Request is marked completed.
6. Resident rates helper; helper rating stats are updated.

## Security and Production Notes

- Move all secrets to environment variables (do not keep hardcoded secrets).
- Restrict CORS to trusted frontend origins in production.
- Add request validation/rate limiting across sensitive routes.
- Replace development logging with structured production logging.

## Documentation Files

Additional project docs available in repository root:
- `ADMIN_API_DOCUMENTATION.md`
- `ADMIN_SYSTEM_DOCUMENTATION.md`
- `DYNAMIC_CONFIGURATION.md`
- `RATING_SYSTEM.md`

## Status

This repository is a functional full-stack implementation and can be used as a strong base for:
- gated community support portals
- apartment/residential service coordination
- neighborhood volunteer assistance platforms
