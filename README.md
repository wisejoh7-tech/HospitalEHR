<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Studio Hospital Management System

This repository contains the complete frontend and backend code for the Hospital Management System.

## Database Setup (SQLite)

The application uses **SQLite** as its database engine via Prisma ORM.

- SQLite database schema: `prisma/schema.prisma`
- Default SQLite database file: `prisma/dev.db`

To initialize and sync the SQLite database:
```bash
npx prisma generate
npx prisma db push
```

---

## Environment Variables

### 1. Backend Web Service (`.env`)
For deploying the backend service (e.g. Node.js Express server on Render, Railway, AWS EC2, or Docker):

```env
# Connection string for SQLite database
DATABASE_URL="file:./dev.db"

# Server port
PORT=3000

# Node environment
NODE_ENV="production"

# Required for Gemini AI API integrations
GEMINI_API_KEY="your_gemini_api_key_here"

# The publicly accessible URL where the backend web service is running
APP_URL="https://your-backend-service.onrender.com"
```

### 2. Frontend Static Host (`.env.production` / Environment Settings)
When building and hosting the static frontend (e.g. Vercel, Netlify, Cloudflare Pages, AWS S3 / CloudFront):

```env
# Backend API URL that the frontend communicates with
VITE_API_BASE_URL="https://your-backend-service.onrender.com"
```

---

## Local Development

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize SQLite database:
   ```bash
   npx prisma db push
   ```
3. Set your environment variables in `.env` (or `.env.local`):
   ```env
   DATABASE_URL="file:./dev.db"
   GEMINI_API_KEY="your_gemini_api_key"
   ```
4. Start the local server:
   ```bash
   npm run dev
   ```

---

## Production Deployment

### Option A: Monolithic Web Service (Backend serving Static Frontend)
1. Build static assets:
   ```bash
   npm run build
   ```
2. Set environment variables on your web host:
   - `NODE_ENV=production`
   - `DATABASE_URL=file:./dev.db`
   - `PORT=3000`
   - `GEMINI_API_KEY=...`
3. Start the production server:
   ```bash
   npx tsx server.ts
   ```

### Option B: Decoupled Deployments (Static Frontend + Backend Web Service)

1. **Deploy Backend Web Service:**
   - Host as Node.js web service.
   - Configure env: `DATABASE_URL="file:./dev.db"`, `NODE_ENV="production"`, `PORT=3000`, `GEMINI_API_KEY=...`
   - Start script: `npx tsx server.ts`

2. **Deploy Frontend Static Site:**
   - Host dist output on static hosts (Vercel, Netlify, Cloudflare Pages).
   - Configure env during build: `VITE_API_BASE_URL="https://your-backend-service.onrender.com"`
   - Build command: `npm run build`
   - Publish directory: `dist`
