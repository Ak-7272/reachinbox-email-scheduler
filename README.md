# ReachInbox Email Scheduler

A full-stack web application for scheduling and sending emails with rate limiting and queue management.

## Overview

This application allows users to:
- Sign in with Google OAuth
- Compose emails and schedule them for multiple recipients
- Spread email sending with configurable delays between each recipient
- Enforce global hourly send limits to prevent spam
- Track scheduled and sent emails in a dashboard

The backend handles email queuing, scheduling, and rate limiting using BullMQ and Redis. The frontend provides a clean dashboard built with Next.js and Tailwind CSS.

> **Note:** Emails are sent via Ethereal SMTP for testing purposes. They appear in the Ethereal web inbox, not in real email clients.

## Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Queue System:** BullMQ with Redis
- **Email Service:** Nodemailer with Ethereal SMTP
- **Authentication:** Client-side Google OAuth (JWT decoding)

### Frontend
- **Framework:** Next.js 16 (App Router) with TypeScript
- **UI Library:** React 19 with Tailwind CSS
- **Authentication:** `@react-oauth/google` with `jwt-decode`
- **HTTP Client:** Axios

## Features

### 🔐 Google Authentication
- Secure sign-in with Google OAuth
- Client-side authentication with JWT token handling
- Protected dashboard routes

### 📧 Email Scheduling
- Compose emails with subject and body
- Add multiple recipients (comma or newline separated)
- Set start time for email batch
- Configure delay between individual emails
- Set hourly rate limits

### 📊 Dashboard
- **Scheduled Emails Tab:** View pending emails sorted by send time
- **Sent Emails Tab:** View completed/failed emails with status indicators
- Real-time status updates (Scheduled, Sent, Failed)

### ⚡ Rate Limiting
- Global hourly email limits
- Automatic rescheduling when limits are exceeded
- Redis-based counter for accurate tracking

## Project Structure

```
reachinbox-email-scheduler/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/
│   │   │   ├── bullmq.ts
│   │   │   ├── db.ts
│   │   │   ├── email.ts
│   │   │   └── redis.ts
│   │   ├── middlewares/
│   │   │   └── errorHandler.ts
│   │   └── modules/
│   │       └── email/
│   │           ├── email.routes.ts
│   │           └── email.worker.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   └── frontend/
│       ├── app/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── dashboard/
│       │   │   └── page.tsx
│       │   └── login/
│       │       └── page.tsx
│       ├── context/
│       │   └── AuthContext.tsx
│       ├── hooks/
│       │   └── useRequireAuth.ts
│       ├── lib/
│       │   ├── api.ts
│       │   └── type.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.ts
│       ├── postcss.config.mjs
│       ├── tailwind.config.ts
│       └── .env.local.example
└── .gitignore
```

## Data Model

### EmailBatch
- Tracks email campaigns with scheduling parameters
- Contains multiple individual emails
- Status: PENDING, RUNNING, COMPLETED

### Email
- Individual email records linked to batches
- Fields: recipient, subject, body, scheduled time, status
- Status: SCHEDULED, SENT, FAILED

## API Endpoints

### Health Check
```
GET /health
```

### Email Scheduling
```
POST /api/emails/schedule
```
Request body:
```json
{
  "subject": "Email Subject",
  "body": "Email content...",
  "emails": ["recipient1@example.com", "recipient2@example.com"],
  "startTime": "2026-01-22T16:30:00.000Z",
  "delayMs": 2000,
  "hourlyLimit": 200
}
```

### Get Scheduled Emails
```
GET /api/emails/scheduled
```

### Get Sent Emails
```
GET /api/emails/sent
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (local or Upstash)
- Google OAuth credentials
- Ethereal email account

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Configure the following in `.env`:
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection URL
   - `ETHEREAL_HOST`, `ETHEREAL_PORT`, `ETHEREAL_USER`, `ETHEREAL_PASS`: Ethereal SMTP credentials
   - `FROM_EMAIL`: Sender email address
   - `MAX_EMAILS_PER_HOUR`: Global hourly limit

4. Run database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:4000`

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Configure:
   - `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Your Google OAuth client ID

4. Start the frontend server:
   ```bash
   npm run dev
   ```
   App runs on `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Click "Sign in with Google" on the login page
3. After authentication, you'll be redirected to the dashboard
4. Compose your email:
   - Enter subject and body
   - Add recipient emails
   - Set start time and delay
   - Configure hourly limit
5. Click "Schedule Emails"
6. Monitor progress in the Scheduled and Sent tabs

## Development

### Backend Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Run production build
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:generate`: Generate Prisma client

### Frontend Scripts
- `npm run dev`: Start Next.js development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run lint`: Run ESLint

## Assumptions & Limitations

- Authentication is handled client-side only
- Emails are sent through Ethereal for testing (not production-ready)
- Rate limiting is global, not per-user
- No pagination on email lists
- Basic error handling without advanced retry mechanisms

## Future Improvements

- User session management with backend JWT
- Per-user rate limits and analytics
- Email template system
- Advanced filtering and pagination
- Admin panel for monitoring
- Production email service integration
- Docker containerization
- CI/CD pipeline setup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
