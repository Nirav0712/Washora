# Washora Phase 12 — Production Deployment Guide

This document specifies the exact production deployment architecture, build commands, environment configurations, and pre-flight validation steps.

---

## 1. Production Architecture Topology

```
                  ┌────────────────────────┐
                  │    Users & Customers   │
                  └───────────┬────────────┘
                              │
                              ▼
            ┌────────────────────────────────────┐
            │           Vercel (Edge)            │
            │   - apps/web   (Next.js App)       │
            │   - apps/admin (Next.js App)       │
            └─────────────────┬──────────────────┘
                              │ HTTPS / REST
                              ▼
            ┌────────────────────────────────────┐
            │      Hostinger Node.js Hosting     │
            │      - apps/api (NestJS API)       │
            └───────────┬──────────────┬─────────┘
                        │              │
                        ▼              ▼
            ┌─────────────────┐  ┌──────────────┐
            │  MongoDB Atlas  │  │  Cloudinary  │
            │ (Multi-tenant)  │  │(Media Assets)│
            └─────────────────┘  └──────────────┘
```

---

## 2. Build Pipeline Commands

From the monorepo root:

```bash
# 1. Install workspace dependencies
npm ci

# 2. Build shared TypeScript package
npm run build --workspace=@washora/shared

# 3. Build Backend API (NestJS)
npm run build --workspace=@washora/api

# 4. Build Frontend Web Application (Next.js)
npm run build --workspace=@washora/web

# 5. Build Platform Admin Web Application (Next.js)
npm run build --workspace=@washora/admin
```

---

## 3. Environment Configuration Matrix

### Backend API (`apps/api`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` |
| `PORT` | Yes | `3001` (or assigned by Hostinger process manager) |
| `MONGODB_URI` | Yes | `mongodb+srv://...` (MongoDB Atlas connection string) |
| `JWT_ACCESS_SECRET` | Yes | Minimum 32-character high-entropy secret |
| `JWT_REFRESH_SECRET` | Yes | Minimum 32-character high-entropy secret (must differ from access secret) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` (default) |
| `JWT_REFRESH_EXPIRES_IN`| No | `7d` (default) |
| `CORS_ORIGIN` | Yes | Comma-separated list: `https://app.washora.com,https://admin.washora.com` |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary public key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary secret key |
| `WHATSAPP_API_KEY` | Optional | WhatsApp Business API token |
| `PAYMENT_GATEWAY_KEY` | Optional | SaaS Billing provider secret |

### Frontend Web (`apps/web`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.washora.com/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | No | `Washora Laundry SaaS` |

### Platform Admin (`apps/admin`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.washora.com/api/v1` |
| `NEXT_PUBLIC_ADMIN_TITLE`| No | `Washora Platform Control Center` |

---

## 4. Hostinger Node.js Configuration

1. **Application Root**: Set to `apps/api/dist` or root directory with entry file `dist/main.js`.
2. **Node Version**: Node.js 18.x or 20.x LTS.
3. **Environment Variables**: Add all mandatory API variables in the Hostinger Cloud/cPanel Node.js selector.
4. **Startup Script**: `node dist/main.js` (compiled from NestJS).
5. **Reverse Proxy / Nginx**: Ensure `X-Forwarded-For` and `X-Forwarded-Proto` are passed to the Node.js process.

---

## 5. Pre-Flight & Post-Deployment Checklist

- [ ] **Step 1: Check Database Connectivity**: Execute `GET /health/ready` (Returns HTTP 200 with DB state `connected`).
- [ ] **Step 2: Check Process Liveness**: Execute `GET /health/live` (Returns HTTP 200 with uptime and memory metrics).
- [ ] **Step 3: Verify CORS**: Inspect `OPTIONS` pre-flight requests from Vercel domain; ensure `Access-Control-Allow-Origin` matches exactly.
- [ ] **Step 4: Execute Smoke Tests**: Verify tenant login, admin login, order listing, and tenant isolation.
