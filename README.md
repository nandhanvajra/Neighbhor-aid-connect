# Neighbor Aid Connect - Comprehensive AI Assistant Guide
*This README is explicitly designed to help other AI assistants (and developers) fully understand the architecture, data flow, and inner workings of the Neighbor Aid Connect platform.*

## 1. Project Overview
"Neighbor Aid Connect" is a community-driven web application built to connect local residents with service workers, volunteers, and staff. The platform facilitates the creation of "Help Requests," enables real-time communication via WebSockets, and incorporates a reputation/rating system to build trust.

**Tech Stack**:
- **Frontend**: React 19, Vite, React Router, TailwindCSS v3.4+, Material UI, Socket.io-client.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io.
- **AI Integration**: Google Generative AI (`@google/generative-ai`) for the Resident Assistant.
- **Authentication**: JWT (JSON Web Tokens) with standard bcrypt password hashing.

---

## 2. User Roles and Permissions
Users in the system (`userSchema`) have a distinct `userType` and `role`:
- **Resident** (`userType: 'resident'`): Can post help requests, join community events, rate completed tasks, and use the Resident AI Assistant.
- **Worker / Staff** (`userType: 'worker'`): Can browse requests related strictly to their profession (`job` field such as electrician, plumber, maid), offer help, and complete tasks. They cannot *create* help requests themselves.
- **Admin** (`isAdmin: true`, `role: 'admin'`): Can create community events, manage groups, and block/unblock users. Admins have overarching visibility.
- **Volunteer**: Similar to workers but typically providing uncompensated help.

---

## 3. Core Workflows & Data Models

### A. Help Requests Workflow (`/api/requests`)
1. **Creation**: Residents create tasks (`category`, `description`, `urgency`, `preferredTime`). If a `staffMemberId` is provided, a direct socket notification is dispatched via `directServiceRequest`.
2. **Filtering**: Workers pull requests from `GET /api/requests/all`. The backend cross-references the worker's `job` against the map `mapWorkerProfessionToCategory` to filter visible requests (e.g., plumbers only see plumbing requests). It also completely excludes requests if either party has blocked the other.
3. **Acceptance (In-Progress)**: A worker/volunteer offers help (`PUT /api/requests/:id` with `status: 'in-progress'` and `completedBy: workerId`).
4. **Completion**: The worker marks the task as `completed`.
5. **Rating**: Once completed, the resident who posted the request receives a prompt to rate the worker (`PATCH /api/requests/:id/rate` or `POST /api/ratings`). **Important Logic Detail:** The frontend uses `updatedRequest.userId === getUserId()` to conditionally show the rating modal.

### B. Chat & Real-Time Messaging (`/api/chats`, `/api/messages`, Socket.io)
- **Direct Messaging**: Users can chat 1-on-1. The dashboard conditionally generates *synthetic* chat rows out of active/accepted requests if a chat doesn't exist yet in the database.
- **Group Chats**: Primarily used for Admins communicating with residents or for Community Events.
- **WebSockets**:
  - `joinRoom`: Uses the user's ID as the room name for personal notifications.
  - Chat rooms use the `chatId` for message broadcasting (`room: chatId`).
  - Active events: `newMessage`, `requestHelp`, `newHelpRequest`, `directServiceRequest`.

### C. Rating System (`/api/ratings`)
- Ratings belong strictly to a `Request` and target a `User` (`ratedUserId`).
- When a new rating is processed, the backend updates the `Request` document to include standard rating metrics AND updates the `User` document (`rating` object: `average` and `totalRatings`).
- A dedicated socket event `newRating` is dispatched to the rated worker.

### D. Community Events (`/api/events`)
- Created by Admins. When a Resident joins an event (`POST /events/:id/join`), the system automatically creates or adds them to a corresponding Group Chat linked to the event.

### E. AI Resident Assistant (`/api/assistant`)
- Uses Google Gemini to answer resident queries dynamically. It acts as a concierge, providing guidance about the community platform.

---

## 4. Frontend Component Architecture (`client/src/components/`)
- **`dashboard.jsx`**: The monolithic dashboard handling multiple tabs (`overview`, `requests`, `staff`, `chats`, `community`, `directory`, `admin`). It manages socket connections, lists filtered UI tables based on `activeTab`, generates synthetic chat contacts for new tasks, and parses local storage for JWT auth.
- **`RatingModal.jsx`**: Auto-triggers upon task completion. Handles granular (communication, quality) and overall star ratings.
- **`ServiceRequestModal.jsx`**: Used when a Resident requests a specific worker directly from the Staff tab.
- **`ChatApplication.jsx`**: Unified interface for direct and group messages.
- **`config/config.js`**: Contains static configurations, dynamic label mappings, text prompts, icon mappings, and API Base URL resolutions.

---

## 5. Potential Pitfalls / AI Developer Tips
1. **ESLint Strictness**: The Vite build aggressively fails on unused variables (`react-hooks/exhaustive-deps`, `no-unused-vars`). When injecting logic, always meticulously remove unused imports or variables.
2. **Entity Comparisons**: MongoDB ObjectIds vs. Strings. When writing frontend equality checks against populated objects from API responses, strictly use `String(request.userId._id || request.userId)` to avoid false negatives.
3. **Local Storage Types**: `localStorage.getItem('user')` stores a serialized object. It sometimes contains the ID as `id` instead of `_id`. Prefer utility functions like `const getUserId = () => user?._id || user?.id;` across components.
4. **State Caching**: The Dashboard heavily relies on `allRequests` array state mapping. Any API mutate request (PUT/POST/DELETE) *must* update this local state array immediately to reflect in UI without requiring a hard refresh.

## 6. Development Scripts
**Client**
- `npm run dev`: Start Vite dev server.
- `npm run lint`: Run ESLint.
- `npm run build`: Build for production.

**Server**
- `npm start`: Runs `nodemon index.js`.
- Defaults to port relying on `.env`, typically 5000 or dynamically mapped.

*By adhering to these architectural guidelines, any AI agent can seamlessly assist in extending the codebase or debugging issues within Neighbor Aid Connect.*
