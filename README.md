<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Studio Hospital Management System

This repository contains the complete frontend and backend code for the Hospital Management System.

## Architecture & Tech Stack

```
Frontend: AWS S3 + CloudFront (React, Vite, TypeScript)
    │
    ▼ (HTTPS API requests)
Backend: AWS App Runner / ECS (Node.js/Express with Prisma ORM)
    │
    ▼
Database: Amazon RDS (PostgreSQL)
```

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, Prisma ORM, Server-Sent Events (SSE)
- **Database:** PostgreSQL (Amazon RDS / Render / Docker) with Prisma ORM
- **Deployment Platform:** AWS S3, CloudFront, AWS App Runner, Amazon ECS, and Docker

---

## Database Setup (PostgreSQL)

The application uses **PostgreSQL** as its production database engine via Prisma ORM (with local SQLite option for offline development).

- Database schema: `prisma/schema.prisma`

To initialize and sync the PostgreSQL database:
```bash
npx prisma generate
npx prisma db push
```

---

## Environment Variables

### 1. Backend Web Service (`.env`)
For deploying the backend service (e.g. AWS App Runner, Amazon ECS, Docker, or Render):

```env
# Connection string for Amazon RDS PostgreSQL database
DATABASE_URL="postgresql://dbadmin:your_password@hospital-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/hospital_db?sslmode=require"

# Allowed frontend origin(s) for CORS (CloudFront domain and custom domains)
ALLOWED_ORIGINS="https://d111111abcdef8.cloudfront.net,https://app.yourhospital.com"

# Server port
PORT=3000

# Node environment
NODE_ENV="production"

# Required for Gemini AI API integrations
GEMINI_API_KEY="your_gemini_api_key_here"

# The publicly accessible URL where the backend web service is running
APP_URL="https://your-backend-service.us-east-1.awsapprunner.com"

# Admin credentials
ADMIN_NAME="System Admin"
ADMIN_EMAIL="admin@hospital.com"
ADMIN_PHONE="08000000000"
ADMIN_PASSWORD="your_secure_admin_password"
```

### 2. Frontend Static Host (`.env.production` / Environment Settings)
When building and hosting the static frontend on **AWS S3 + CloudFront**:

```env
# Backend API URL that the frontend communicates with (both VITE_API_URL and VITE_API_BASE_URL are supported)
VITE_API_URL="https://your-backend-service.us-east-1.awsapprunner.com"
VITE_API_BASE_URL="https://your-backend-service.us-east-1.awsapprunner.com"
```

---

## Local Development

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize PostgreSQL database (or use local SQLite via `npm run db:push:sqlite`):
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

## Docker & Container Deployment

Build and run the containerized backend locally or for AWS App Runner / Amazon ECS:

```bash
# Build Docker image
docker build -t hospital-backend .

# Run container locally with PostgreSQL connection
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e ALLOWED_ORIGINS="http://localhost:3000" \
  hospital-backend
```

---

## AWS Production Deployment

For detailed, step-by-step instructions on deploying the full AWS stack, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md):

1. **Frontend (AWS S3 + CloudFront):**
   - Build static assets with `npm run build`.
   - Upload `dist/` to an Amazon S3 bucket.
   - Configure Amazon CloudFront CDN with SSL, custom error page routing (`403/404` -> `/index.html`), and caching rules.
2. **Backend (AWS App Runner / ECS):**
   - Deploy using `apprunner.yaml` or Amazon ECS task definition (`aws-task-definition.json`).
   - Configure VPC connector to communicate with private RDS instances.
3. **Database (Amazon RDS):**
   - Managed PostgreSQL instance with automated backups and security groups restricted to the backend service.

---

## Desktop Application (Electron)

The application can be run and packaged as a desktop application using **Electron**.

- **Desktop Entry Point:** `electron/main.cjs`

### Run Desktop App in Development Mode:
```bash
npm run electron:dev
```

### Build Desktop Binaries:
```bash
npm run electron:build
```

---

## Mobile Applications (Capacitor)

The application supports native mobile builds for **Android** and **iOS** powered by **Capacitor**.

- **Capacitor Configuration:** `capacitor.config.ts`

### Synchronize Web Build with Mobile Assets:
```bash
npm run cap:sync
```

### Open Native IDEs:
- **Android Studio:**
  ```bash
  npm run cap:open:android
  ```
- **Xcode (macOS only):**
  ```bash
  npm run cap:add:ios
  npm run cap:open:ios
  ```
