<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Studio Hospital Management System

This repository contains the complete frontend and backend code for the Hospital Management System.

## Database Setup (PostgreSQL)

The application uses **PostgreSQL** as its database engine via Prisma ORM.

- Database schema: `prisma/schema.prisma`

To initialize and sync the PostgreSQL database:
```bash
npx prisma generate
npx prisma db push
```

---

## Environment Variables

### 1. Backend Web Service (`.env`)
For deploying the backend service (e.g. Node.js Express server on Render, Railway, AWS EC2, or Docker):

```env
# Connection string for PostgreSQL database
DATABASE_URL="postgresql://postgres:password@localhost:5432/hospital_db?schema=public"

# Allowed frontend origin for CORS
ALLOWED_ORIGINS="https://cbt-vivi.onrender.com"

# Server port
PORT=3000

# Node environment
NODE_ENV="production"

# Required for Gemini AI API integrations
GEMINI_API_KEY="your_gemini_api_key_here"

# The publicly accessible URL where the backend web service is running
APP_URL="https://your-backend-service.onrender.com"

# Admin credentials configured directly on Render backend service
ADMIN_NAME="System Admin"
ADMIN_EMAIL="admin@hospital.com"
ADMIN_PHONE="08000000000"
ADMIN_PASSWORD="your_secure_admin_password"
```

### 2. Frontend Static Host (`.env.production` / Environment Settings)
When building and hosting the static frontend (e.g. Vercel, Netlify, Cloudflare Pages, AWS S3 / CloudFront):

```env
# Backend API URL that the frontend communicates with (both VITE_API_URL and VITE_API_BASE_URL are supported)
VITE_API_URL="https://cbt-9v2x.onrender.com"
VITE_API_BASE_URL="https://cbt-9v2x.onrender.com"
```

---

## Local Development

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize PostgreSQL database:
   ```bash
   npx prisma db push
   ```
3. Set your environment variables in `.env` (or `.env.local`):
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/hospital_db?schema=public"
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
   - `DATABASE_URL=postgresql://postgres:password@localhost:5432/hospital_db?schema=public`
   - `PORT=3000`
   - `GEMINI_API_KEY=...`
3. Start the production server:
   ```bash
   npx tsx server.ts
   ```

### Option B: Decoupled Deployments (Static Frontend + Backend Web Service)

1. **Deploy Backend Web Service:**
   - Host as Node.js web service.
   - Configure env: `DATABASE_URL="postgresql://postgres:password@localhost:5432/hospital_db?schema=public"`, `NODE_ENV="production"`, `PORT=3000`, `GEMINI_API_KEY=...`
   - Start script: `npx tsx server.ts`

2. **Deploy Frontend Static Site:**
   - Host dist output on static hosts (Vercel, Netlify, Cloudflare Pages).
   - Configure env during build: `VITE_API_BASE_URL="https://your-backend-service.onrender.com"`
   - Build command: `npm run build`
   - Publish directory: `dist`
