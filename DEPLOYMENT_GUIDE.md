# VIVI Medical Center - Deployment & Operations Guide

This guide outlines the instructions for securing, backing up, and deploying the VIVI Medical Center application in production.

---

## 1. HTTPS / SSL Setup (Custom Domain)

Render automatically manages TLS/SSL certificates via Let's Encrypt:

1. **Log in to Render Dashboard**: Go to [dashboard.render.com](https://dashboard.render.com).
2. **Select Web Service**: Select your deployed application.
3. **Add Custom Domain**:
   - Navigate to **Settings** in the left navigation menu.
   - Scroll down to **Custom Domains** and click **Add Custom Domain**.
   - Enter your domain name (e.g., `app.vivimedicalcenter.com`).
4. **Configure DNS Records**:
   - In your domain provider account (e.g., Namecheap, Cloudflare, GoDaddy), add the CNAME record provided by Render pointing to `your-app.onrender.com`.
5. **Automatic SSL**:
   - Render automatically provisions and renews TLS/SSL certificates once DNS propagation completes.

---

## 2. Automated PostgreSQL Database Backups

1. **Automated Daily Backups on Render**:
   - Render automatically performs daily backups for standard PostgreSQL instances.
   - Access the **Backups** tab in the database dashboard to view, download, or restore point-in-time snapshots.

2. **Manual On-Demand Backup (`pg_dump`)**:
   Run the following command to take an immediate local backup:
   ```bash
   pg_dump "$DATABASE_URL" > hospital_backup_$(date +%F).sql
   ```

3. **Restoring a Database Backup**:
   ```bash
   psql "$DATABASE_URL" < hospital_backup_YYYY-MM-DD.sql
   ```

---

## 3. Production Security Best Practices

1. **Update System Admin Credentials**:
   - Change default admin credentials (`08000000000` / `admin`) upon initial login or set environment variables (`ADMIN_EMAIL`, `ADMIN_PHONE`, `ADMIN_PASSWORD`) in your server environment.
2. **Staff Provisioning**:
   - Create staff accounts directly via the System Admin console (`/staff`). Self-registration is restricted.
3. **Environment Variables**:
   - Store sensitive keys and connection strings (`DATABASE_URL`, `ADMIN_PASSWORD`, etc.) securely using environment variables.
