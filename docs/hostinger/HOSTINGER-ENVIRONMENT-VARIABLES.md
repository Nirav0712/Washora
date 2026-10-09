# Hostinger Environment Variables Specification

This document lists every environment variable validated and consumed by the Washora backend API.

---

## 1. Master Environment Variables Matrix

| Variable Name | Required? | Purpose | Example Format / Value | Where to Obtain / Notes |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Required** | Defines runtime mode (`production` enables strict validation and rate limiting). | `production` | Set in Hostinger Node.js panel. |
| `PORT` | **Required** | TCP port for HTTP listener. | `4000` (or injected by Hostinger) | Provided automatically by Hostinger or specify `4000`. |
| `MONGODB_URI` | **Required** | MongoDB Atlas connection string with database name. | `mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/washora_db?retryWrites=true&w=majority` | MongoDB Atlas Dashboard -> Database -> Connect. Must include DB name. |
| `JWT_ACCESS_SECRET` | **Required** | Cryptographic secret for signing access tokens (min 32 chars in prod). | `<GENERATE_32_CHAR_RANDOM_SECRET>` (e.g. `washora_prod_jwt_access_secret_2026_x89q_ultra_secure`) | Generated randomly (e.g. `openssl rand -hex 32`). |
| `JWT_REFRESH_SECRET` | **Required** | Cryptographic secret for refresh tokens (must differ from access secret). | `<GENERATE_32_CHAR_RANDOM_SECRET>` (e.g. `washora_prod_jwt_refresh_secret_2026_z72k_ultra_secure`) | Generated randomly (e.g. `openssl rand -hex 32`). |
| `JWT_ACCESS_EXPIRES_IN` | Optional | Access token expiration duration. | `15m` | Default: `15m` if omitted. |
| `JWT_REFRESH_EXPIRES_IN` | Optional | Refresh token expiration duration. | `7d` | Default: `7d` if omitted. |
| `CORS_ORIGIN` | **Required** | Allowed origins for web and admin portals (comma-separated). | `https://washora.vercel.app,https://washora-admin.vercel.app,https://washora.com,https://admin.washora.com` | Vercel production frontend domains. |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud identifier for garment photo uploads. | `your_cloudinary_cloud_name` | Cloudinary Dashboard -> Account details. |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API Key. | `your_cloudinary_api_key` | Cloudinary Dashboard -> Account details. |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API Secret. | `your_cloudinary_api_secret` | Cloudinary Dashboard -> Account details. |
| `WHATSAPP_PHONE_NUMBER_ID`| Optional | WhatsApp Business Cloud API Phone Number ID. | `102938475610293` | Meta Developer Console -> WhatsApp -> Configuration. |
| `WHATSAPP_ACCESS_TOKEN` | Optional | WhatsApp Business Cloud API System User Permanent Token. | `EAABwz...` | Meta Business Manager -> System Users. |

---

## 2. Production Security Requirements

1. **Strict Startup Validation**: When `NODE_ENV=production`, `apps/api/src/config/env.validation.ts` will abort startup (`process.exit(1)`) if:
   - `MONGODB_URI` is missing or does not start with `mongodb://` or `mongodb+srv://`.
   - `JWT_ACCESS_SECRET` is missing or less than 32 characters long.
   - `JWT_REFRESH_SECRET` is missing or less than 32 characters long.
   - `JWT_ACCESS_SECRET` equals `JWT_REFRESH_SECRET`.
2. **Never expose secrets**: Do not prefix private backend secrets with `NEXT_PUBLIC_`.
