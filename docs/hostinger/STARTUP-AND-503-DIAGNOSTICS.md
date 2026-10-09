# Hostinger 503 Service Unavailable & Startup Failure Diagnostics

This document details root causes, error signatures, and solutions for 503 and startup failures on Hostinger Node.js hosting.

---

## 1. 503 Error Causes & Diagnostics Matrix

| Symptom / Error | Root Cause | Diagnosis Log / Evidence | Verified Solution |
| :--- | :--- | :--- | :--- |
| **HTTP 503 Service Unavailable** | Phusion Passenger / LiteSpeed timeout before NestJS finishes bootstrap. | Passenger log: `App did not listen on socket within timeout`. | 1. Ensure `MONGODB_URI` connects within 10s.<br>2. Whitelist Hostinger IP in MongoDB Atlas.<br>3. Check for missing required env vars causing process crash. |
| **Application Exits Immediately on Startup** | Strict environment validation failed in production. | Application log: `[Config Error] JWT_ACCESS_SECRET must be at least 32 characters long in production.` | Set all required environment variables with >=32 character length and valid MongoDB URI. |
| **Cannot find module '@washora/shared'** | Build did not compile workspace dependencies or wrong working directory. | `Error: Cannot find module '@washora/shared'` | Run build from monorepo root: `npm run build --workspace=packages/shared && npm run build --workspace=apps/api`. |
| **Cannot find module 'dist/main.js'** | Wrong startup file path in Hostinger settings. | Passenger log: `Cannot find entry point file`. | Set Application Startup File to `apps/api/dist/main.js` (if app root is `.`) or `dist/main.js` (if app root is `apps/api`). |
| **CORS Policy Blocking Frontend** | Backend `CORS_ORIGIN` does not include frontend domain. | Browser Console: `No 'Access-Control-Allow-Origin' header is present`. | Add exact frontend Vercel domain to `CORS_ORIGIN` env var on Hostinger. |
| **EADDRINUSE: address already in use** | Hardcoded port conflict. | Node error: `listen EADDRINUSE: address already in use :::4000`. | Ensure `apps/api/src/main.ts` listens to `process.env.PORT` so Hostinger assigns its managed socket. |

---

## 2. Health Endpoint Architecture for Reverse Proxies

The backend provides three dedicated endpoints:

1. `GET /health/live` (Liveness Probe):
   - Returns HTTP 200 immediately with memory and uptime statistics.
   - **Does NOT query the database.**
   - Ideal for Hostinger uptime monitors to prevent false-alarm 503s.
2. `GET /health/ready` (Readiness Probe):
   - Executes an active ping on MongoDB Atlas with a bounded 3000ms timeout.
   - Returns HTTP 200 `{ status: "ready" }` if database is connected.
   - Returns HTTP 503 `{ status: "unhealthy" }` if database is disconnected.
3. `GET /health` (Overview):
   - Fast status report reflecting Mongoose connection `readyState`.
