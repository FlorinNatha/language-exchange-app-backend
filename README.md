# Chatterly — Backend

This repository contains the backend for Chatterly (language exchange app). It is an Express + MongoDB API with Socket.IO real-time features.

## Quick Start

Prerequisites:
- Node.js (16+ recommended)
- MongoDB (local or Atlas)

Install and run:

```bash
npm install
npm run dev   # starts with nodemon
# or
npm start
```

Server runs on `PORT` env var or `5000` by default.

## Required environment variables
Create a `.env` file in project root. Example:

```
MONGO_URI=mongodb://localhost:27017/chatterly
JWT_SECRET=your_jwt_secret_here
EMAIL_USER=you@example.com    # optional, for password reset emails
EMAIL_PASS=app_password_here  # optional, use app passwords for Gmail
PORT=5000
```

## Important endpoints

- Auth: `/api/auth`
  - `POST /register` — register a user
  - `POST /login` — login and receive JWT
  - `POST /forgot-password` — request reset (sends email if configured)
  - `POST /reset-password/:token` — reset password

- Users: `/api/users` (protected)
  - `GET /` — list users
  - `GET /online` — online users
  - `GET /:id` — get profile
  - `PUT /:id` — update profile
  - `POST /:id/follow` and `/unfollow` — follow/unfollow
  - `GET /following` — list following
  - `POST /:id/avatar` — upload avatar (form field `avatar`)

- Rooms: `/api/rooms` (protected)
  - `POST /create` — create room
  - `GET /` — list rooms
  - `GET /filter` — filter rooms

- Messages: `/api/messages` (protected)
  - `GET /dm/:userId` — DM history
  - `GET /room/:roomId` — room history
  - `DELETE /:id` — delete a message (sender only)
  - `POST /:id/read` — mark message as read

- Notifications: `/api/notifications` (protected)
  - `GET /` — list notifications (paginated)
  - `PUT /:id/read` — mark one as read
  - `DELETE /clear` — clear notifications

## Socket events (overview)
- Connect with query: `?userId=<userId>`
- `user-online`, `user-offline` — presence
- `join-room` / `leave-room` — room membership
- `private-message` — send DM (server persists and notifies)
- `room-message` — send room message (server persists and broadcasts)
- `signal` — WebRTC signaling
- `new-notification` — real-time notification for online users

## Uploads
- Avatars are stored locally under `uploads/avatars/` (for dev). For production, use S3/Cloudinary and presigned uploads.

## Tests
- Test scaffolding is planned. To add tests, we recommend `jest`, `supertest`, and `mongodb-memory-server`.

## Next steps / TODOs
- Implement room-based call lifecycle and call records.
- Add communities/posts API to match UI.
- Add typing indicators and socket-level read receipts.
- Harden security: input validation, rate limiting, helmet, refresh tokens.
- Replace local uploads with cloud storage for production.

## Notes
- `.env` is ignored by `.gitignore` — do NOT commit secrets.

If you want, I can add tests next, or scaffold call-management or community APIs — tell me which to pick.
