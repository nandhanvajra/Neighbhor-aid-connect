# Neighbor Aid Connect - Comprehensive AI Developer Guide

*This README is explicitly designed to serve as a high-fidelity system prompt and technical guide for any AI assistant (like Gemini, Claude, or ChatGPT) or human developer interacting with the Neighbor Aid Connect codebase. Read this carefully to understand the exact architecture, data models, workflows, and strict conventions utilized in this project.*

## 1. Project Overview
**Neighbor Aid Connect** is a community-centric web application built to connect local residents with local service workers, volunteers, and administrative staff. The platform facilitates "Help Requests", features real-time WebSocket communication, incorporates a unified reputation/rating system, and offers specialized workflows for direct worker hiring and community events.

### Tech Stack
- **Frontend**: React 19, Vite, React Router DOM, Tailwind CSS v3.4+, Material UI v7, Socket.io-client, Axios, Emotion.
- **Backend**: Node.js, Express.js (v5), MongoDB (Mongoose), Socket.io, JWT, bcryptjs.
- **AI Integration**: Google Generative AI (`@google/generative-ai`) powers a localized Resident Assistant.

---

## 2. Directory Structure & Key Files

The project follows a standard client-server monorepo structure:

```
Neighbor-aid-connect/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── components/          # React components (Dashboard, Modals, Chat, Home, etc.)
│   │   │   ├── dashboard.jsx    # Core monolith component handling multiple tabs/views.
│   │   │   ├── ChatApplication.jsx # Unified interface for 1-1 and group chats.
│   │   │   ├── RatingModal.jsx  # Handles end-of-service reviews.
│   │   │   └── ...
│   │   ├── config/              # Dynamic configurable settings (API Base URL, Categories).
│   │   ├── App.jsx              # Main React App routing.
│   │   └── main.jsx             # React entry point.
│   └── package.json
│
├── server/                      # Node/Express Backend
│   ├── config/                  # Server configuration, ENV bindings.
│   ├── middleware/              # JWT auth and role-checking middleware.
│   ├── models/                  # Mongoose Schemas (userSchema, requestSchema, etc.)
│   ├── prompts/                 # System prompts for Gemini AI features.
│   ├── routes/                  # Express route handlers.
│   │   ├── authRoutes.js        # Registration, Login, Create Admin.
│   │   ├── requestRoutes.js     # CRUD for help requests.
│   │   ├── chatRoutes.js        # Chat APIs.
│   │   └── ...
│   ├── services/                # Specialized logic (e.g., AI integration).
│   ├── index.js                 # Server entry point + Socket.io listener initialization.
│   ├── seed.js                  # Database seeder.
│   └── package.json
│
└── *.md                         # Specific documentation files (see section 9).
```

---

## 3. Data Models (`server/models/`)

The application relies on carefully structured relational data in MongoDB.

- **User** (`userSchema.js`):
  - `userType`: Identifies the high-level actor (`'resident'`, `'worker'`, etc.).
  - `role`: System-level permission (`'user'`, `'admin'`).
  - Workers have specialized fields like `job` (profession), `availability`, and `rating`.
- **Request** (`requestSchema.js`):
  - Represents a task. Fields: `title`, `description`, `category`, `urgency`, `status` (e.g., `'open'`, `'in-progress'`, `'completed'`).
  - `userId`: Author (Resident).
  - `staffMemberId`: (Optional) ID for direct worker requests.
  - `completedBy`: Worker who accepted and finalized the task.
- **Rating** (`ratingSchema.js`):
  - Links a `requestId` with a `ratedUserId` (worker) and `reviewerId` (resident). Updates user's overall rating upon save.
- **Chat & Message** (`chatSchema.js`, `messageSchema.js`):
  - Chats can be `direct` or `group`. They track `participants`.
- **Community Events** (`communityEventSchema.js`): Admins create events; residents join, triggering automatic group chat addition.

---

## 4. Core Workflows (Important for AI Context)

### A. Help Request Lifecycle
1. **Creation**: A Resident submits a request (`POST /api/requests`). If a `staffMemberId` is provided, it's a direct request and bypasses the general open pool; a direct socket event is fired.
2. **Filtering**: Workers query open requests via `GET /api/requests/all`. The backend cross-references the worker's `job` against specific categories configured in the dynamic configuration.
3. **Acceptance**: A Worker hits `PUT /api/requests/:id` to change the status to `'in-progress'`, registering themselves as `completedBy` (despite the name, it just assigns them initially).
4. **Completion**: Worker marks task as `'completed'`.
5. **Review Trigger**: The frontend application conditionally detects the task's completion and triggers the `<RatingModal />` for the resident. 

### B. Real-Time Socket.io Implementation
- **Rooms**: Upon login, every user joins a Socket.io room matching their User ID (`socket.join(userId)`). This allows one-to-one push notifications.
- **Chat**: Users also join rooms matching `chatId` for active discussion tracking.
- **Events**: Look for events like `newHelpRequest`, `directServiceRequest`, `newMessage`, `ratingUpdate`.

### C. The Configuration System
- **Static files vs DB**: Configuration is abstracted away from static strings and managed inside `server/config/config.js` and `client/src/config/config.js`. 
- **Roles & Categories**: When updating roles, job types, or UI aesthetics (colors/icons), refer *only* to the `config.js` files. 

---

## 5. Development Setup & Scripts

**Running Locally:**
Ensure you have MongoDB running or a valid `MONGODB_URI`. You also need a Gemini API Key.

1. **Root Requirements**: Ensure root `package.json` installs dependencies for monorepo tasks if needed.
2. **Backend**:
   - `cd server`
   - Setup `.env`: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`.
   - `npm install`
   - `npm start` (runs `nodemon index.js`)
3. **Frontend**:
   - `cd client`
   - Setup `.env`: `VITE_API_BASE_URL` (usually `http://localhost:5000` or `3000`).
   - `npm install`
   - `npm run dev` (starts Vite)

---

## 6. Critical Rules for AI Modifying this Codebase

When requested to build features or fix bugs, strictly adhere to these rules:

1. **State Hydration vs Refresh**: The monolithic `<Dashboard />` relies heavily on mapping cached local state rather than refetching. If an API request mutates data (e.g. accepting a task, sending a message), **ensure the client's local React state array is manually updated** to reflect the change globally without forcing a hard browser refresh.
2. **Type Coercion on ObjectIds**: MongoDB returns ObjectIds. When comparing IDs in the frontend React code (e.g., verifying if the logged-in user owns a request), always cast to String: `String(item.userId._id || item.userId) === String(currentUser._id)`.
3. **Strict Linting Enforcement**: Vite is configured with strict ESLint plugins (`react-hooks/exhaustive-deps`, `no-unused-vars`). If you modify imports or refactor variables, meticulously remove unused code. Leaving unused imports will break the client build (`npm run build`).
4. **Direct Requests vs Open Requests**: Ensure `staffMemberId` logic is rigorously upheld. A request with a `staffMemberId` should NEVER show up on generic public boards for workers.

---

## 7. Deep-Dive Documentation

For specialized domains within this repository, refer to these standalone Markdown files:
- 📄 `ADMIN_API_DOCUMENTATION.md` - Rules and routes for creating/managing Admin level users.
- 📄 `ADMIN_SYSTEM_DOCUMENTATION.md` - High-level overview of admin dashboards and permissions.
- 📄 `DYNAMIC_CONFIGURATION.md` - Detailed explanation of the modular configuration pattern introduced.
- 📄 `RATING_SYSTEM.md` - Mechanics behind the review/rating mathematics and user metrics updating.
