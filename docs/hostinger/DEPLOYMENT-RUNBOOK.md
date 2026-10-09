# Washora Hostinger Backend Deployment Runbook

Follow these step-by-step instructions to deploy the Washora NestJS backend API to Hostinger Node.js hosting.

---

## Pre-Deployment Preparation

1. **MongoDB Atlas**:
   - Create user with read/write access to `washora_db`.
   - Add Hostinger server IP to Atlas Network Access IP whitelist.
2. **Generate Secrets**:
   - Generate two distinct 32+ character secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

---

## Step 1: Hostinger Node.js Application Setup

In Hostinger hPanel -> **Websites** -> Select Domain -> **Node.js**:

| Field | Value |
| :--- | :--- |
| **Node.js Version** | `20.x` |
| **Application Mode** | `production` |
| **Application Root** | `.` (Repository root) |
| **Application Startup File** | `apps/api/dist/main.js` |
| **Application URL / Domain** | `api.yourdomain.com` |

---

## Step 2: Configure Environment Variables in Hostinger

Add the following environment variables in the Hostinger Node.js manager:

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://<db_user>:<db_pass>@<cluster>.mongodb.net/washora_db?retryWrites=true&w=majority
JWT_ACCESS_SECRET=washora_prod_access_token_secret_key_2026_x89q_secure
JWT_REFRESH_SECRET=washora_prod_refresh_token_secret_key_2026_z72k_secure
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://washora.vercel.app,https://washora-admin.vercel.app,https://yourdomain.com,https://admin.yourdomain.com
```

---

## Step 3: Build & Start Application

Via SSH on Hostinger (or Git Deployment script):

```bash
# 1. Navigate to the repository root
cd /home/username/public_html

# 2. Install dependencies
npm ci

# 3. Build shared library and API
npm run build --workspace=packages/shared
npm run build --workspace=apps/api

# 4. Restart Node.js Application via Hostinger Panel or touch tmp/restart.txt
mkdir -p tmp && touch tmp/restart.txt
```

---

## Step 4: Post-Deployment Verification

Execute curl tests against the deployed API:

```bash
# 1. Liveness check (process running)
curl -i https://api.yourdomain.com/health/live

# Expected: HTTP 200 OK
# {"status":"alive","service":"washora-api",...}

# 2. Readiness check (database connected)
curl -i https://api.yourdomain.com/health/ready

# Expected: HTTP 200 OK
# {"status":"ready","database":{"status":"connected",...}}

# 3. Swagger Docs
curl -I https://api.yourdomain.com/api/docs
# Expected: HTTP 200 / 301

# 4. Platform Login test
curl -X POST https://api.yourdomain.com/api/platform/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@washora.com","password":"YourAdminPassword"}'
```
