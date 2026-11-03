# VIVI Medical Center - Deployment & Operations Guide

This guide outlines instructions for securing, backing up, and deploying the Hospital Management System in production, with comprehensive instructions for **AWS (Amazon Web Services)** and cloud infrastructure.

---

## Architecture Overview

```
                                +---------------------------+
                                |  AWS CloudFront (CDN/SSL) |
                                +-------------+-------------+
                                              |
                     +------------------------+------------------------+
                     | (Static Web Assets)                             | (HTTPS API Requests: /api/*)
                     v                                                 v
         +-----------------------+                         +-----------------------+
         |      Amazon S3        |                         |  AWS App Runner / ECS |
         | (React + Vite Build)  |                         |  (Node.js / Express)  |
         +-----------------------+                         +-----------+-----------+
                                                                       |
                                                                       v
                                                           +-----------------------+
                                                           |   Amazon RDS (Postgres)|
                                                           +-----------------------+
```

| Component | Service | Technology Stack |
|-----------|---------|------------------|
| **Frontend** | AWS S3 + Amazon CloudFront | React 19, Vite, TypeScript, Tailwind CSS |
| **Backend** | AWS App Runner / Amazon ECS (Fargate) | Node.js / Express, Prisma ORM, Docker |
| **Database** | Amazon RDS | Managed PostgreSQL 15+ |

---

## 1. Database Setup: Amazon RDS (PostgreSQL)

1. **Create PostgreSQL Instance on RDS:**
   - Go to **Amazon RDS > Databases > Create database**.
   - Choose **Standard create** > **PostgreSQL** (version 15 or 16).
   - Select template (**Production** or **Free tier / Dev**).
   - Set DB instance identifier (e.g., `hospital-postgres-db`).
   - Configure Master username (e.g., `dbadmin`) and generate a secure password.
   - Storage: 20 GB+ General Purpose SSD (gp3).

2. **Network & Security Group Configuration:**
   - Place RDS in your VPC with appropriate subnets.
   - Set up an RDS Security Group allowing inbound traffic on TCP port **5432** exclusively from:
     * AWS App Runner VPC connector security group, OR
     * Amazon ECS task security group, OR
     * Your administrative bastion/IP if direct access is needed.

3. **Construct DATABASE_URL Connection String:**
   ```
   postgresql://dbadmin:<PASSWORD>@<RDS_ENDPOINT>:5432/hospital_db?sslmode=require
   ```

4. **Initialize and Push Database Schema:**
   From your deployment pipeline or admin machine:
   ```bash
   DATABASE_URL="postgresql://dbadmin:<PASSWORD>@<RDS_ENDPOINT>:5432/hospital_db?sslmode=require" npx prisma db push
   ```

---

## 2. Backend Deployment: AWS App Runner or Amazon ECS

### Option A: AWS App Runner (Recommended for Simplicity)

AWS App Runner provides fully managed container and code execution with automatic TLS and scaling.

#### Method 1: Using Source Code Repository
1. In the **AWS App Runner Console**, choose **Create service**.
2. Select **Source code repository** and link your GitHub repository.
3. Configuration repository: Select **Use a configuration file** (`apprunner.yaml` in repository root).
4. In **Service settings**:
   - Service name: `hospital-backend`
   - Port: `3000`
   - Environment variables:
     * `NODE_ENV`: `production`
     * `DATABASE_URL`: `postgresql://dbadmin:<PASSWORD>@<RDS_ENDPOINT>:5432/hospital_db?sslmode=require`
     * `ALLOWED_ORIGINS`: `https://<YOUR_CLOUDFRONT_DOMAIN>.cloudfront.net,https://<YOUR_CUSTOM_DOMAIN>`
     * `PORT`: `3000`
     * `ADMIN_PASSWORD`: `<SECURE_ADMIN_PASSWORD>`
     * `GEMINI_API_KEY`: `<YOUR_GEMINI_KEY>`
5. In **Security & Networking**:
   - Attach a **VPC Connector** configured with the private subnets and security group that can route to your Amazon RDS instance.
6. Deploy the service. Once ready, note the App Runner default URL (e.g., `https://xxxxxx.us-east-1.awsapprunner.com`).

#### Method 2: Using Prebuilt Docker Container
1. Build and push your image to Amazon Elastic Container Registry (ECR):
   ```bash
   aws ecr get-login-password --region <AWS_REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com
   docker build -t hospital-backend .
   docker tag hospital-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/hospital-backend:latest
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/hospital-backend:latest
   ```
2. Create App Runner service with Container Image provider pointing to the ECR URI.

---

### Option B: Amazon ECS (Fargate)

For advanced enterprise VPC topologies and fine-grained IAM task role policies:

1. **ECR Repository**: Push container image to Amazon ECR.
2. **Task Definition**: Register `aws-task-definition.json` (adjusting your AWS Account ID, Region, and Secrets Manager ARNs).
3. **Application Load Balancer (ALB)**:
   - Configure target group on port 3000 with health check path `/api/health`.
   - Configure HTTPS listener (port 443) with AWS Certificate Manager (ACM) SSL certificate.
4. **ECS Service**:
   - Launch type: `FARGATE`.
   - Desired tasks: 2+ (for high availability across Availability Zones).
   - Assign VPC subnets and security group allowing inbound port 3000 from ALB.

---

## 3. Frontend Deployment: AWS S3 + Amazon CloudFront

Deploy the React + Vite static build assets to an Amazon S3 bucket fronted by an Amazon CloudFront CDN distribution with SSL/TLS and custom domain support.

### Step 1: Build the Static Frontend
Configure your production backend API URL in `.env.production` or pass environment variables:
```bash
VITE_API_BASE_URL="https://your-backend-apprunner.awsapprunner.com" npm run build
```
The compiled assets will be in the `dist/` directory.

### Step 2: Create Amazon S3 Bucket
1. Go to **Amazon S3 > Create bucket**.
2. Bucket name: e.g., `hospital-frontend-assets-<unique-suffix>`.
3. Region: Select your primary region (e.g., `us-east-1` or `eu-west-1`).
4. **Block Public Access**: Keep **Block *all* public access** ENABLED (CloudFront Origin Access Control / OAC will access the bucket securely).
5. Enable bucket encryption (SSE-S3).

### Step 3: Upload Built Files to S3
```bash
aws s3 sync dist/ s3://hospital-frontend-assets-<unique-suffix>/ --delete
```

### Step 4: Configure Amazon CloudFront Distribution
1. Go to **CloudFront > Create distribution**.
2. **Origin domain**: Select your S3 bucket.
3. **Origin access**: Select **Origin access control settings (recommended)** (OAC) and create a new OAC.
4. **Viewer protocol policy**: Select **Redirect HTTP to HTTPS**.
5. **Allowed HTTP methods**: Select `GET, HEAD, OPTIONS`.
6. **Custom Error Response (for Single Page App routing)**:
   - Go to **Error pages > Create custom error response**:
     * HTTP error code: `403: Forbidden`
     * Customize error response: `Yes`
     * Response page path: `/index.html`
     * HTTP Response code: `200: OK`
   - Add a second rule for `404: Not Found` with response page path `/index.html` and HTTP code `200: OK`.
7. **S3 Bucket Policy**: Update the S3 bucket policy with the statement generated by CloudFront allowing `s3:GetObject` to the CloudFront distribution principal.

### Optional: Single Domain / Unified CloudFront Routing
To serve both static frontend and backend API under the same domain name (eliminating CORS):
1. In the CloudFront distribution, add a **Second Origin**:
   - Origin domain: Your App Runner / ALB domain (e.g., `xxxxxx.us-east-1.awsapprunner.com`).
   - Protocol: HTTPS only.
2. Add a **Cache Behavior**:
   - Path pattern: `/api/*`
   - Target origin: App Runner / ALB backend origin.
   - Allowed methods: `GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE`.
   - Cache policy: `CachingDisabled`.
   - Origin request policy: `AllViewerExceptHostHeader`.

---

## 4. HTTPS / SSL Setup (Custom Domain with Route 53 & ACM)

1. **Request Certificate via AWS Certificate Manager (ACM)**:
   - For CloudFront: Request certificate in **us-east-1 (N. Virginia)** for your custom domain (e.g., `app.hospital.com`).
   - Validate via DNS validation (automatically added in AWS Route 53).
2. **Attach to CloudFront**:
   - Under CloudFront distribution settings, set **Alternate domain name (CNAME)**: `app.hospital.com`.
   - Select the ACM SSL certificate.
3. **DNS Record in Route 53 or DNS Provider**:
   - Create an `A` record (Alias) pointing to your CloudFront distribution (`xxxxxx.cloudfront.net`).

---

## 5. Automated Database Backups & Recovery

1. **Amazon RDS Automated Backups**:
   - Enable automated snapshots in RDS with a retention period of 7 to 35 days.
   - RDS performs continuous transaction log backups enabling Point-In-Time Restore (PITR).
2. **Manual On-Demand Backup (`pg_dump`)**:
   ```bash
   pg_dump "$DATABASE_URL" > hospital_backup_$(date +%F).sql
   ```
3. **Restoring a Database Backup**:
   ```bash
   psql "$DATABASE_URL" < hospital_backup_YYYY-MM-DD.sql
   ```

---

## 6. Production Security & Hardening Checklist

- [ ] **Strict CORS Whitelist**: Set `ALLOWED_ORIGINS` to only your CloudFront domain and custom domains.
- [ ] **Secure Admin Credentials**: Override default admin credentials with complex `ADMIN_PASSWORD` and `ADMIN_EMAIL`.
- [ ] **Secrets Management**: Store database credentials and API keys in **AWS Secrets Manager** or **AWS Systems Manager Parameter Store**.
- [ ] **Private RDS Subnets**: Do not make the Amazon RDS instance publicly accessible; use AWS VPC peering or private subnets with App Runner / ECS VPC connectors.
- [ ] **WAF Protection**: Optionally associate **AWS WAF** with your CloudFront distribution for DDoS and rate limiting defense.
