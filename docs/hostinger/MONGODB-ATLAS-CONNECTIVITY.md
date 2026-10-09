# MongoDB Atlas Connectivity & Network Configuration

This document specifies the MongoDB Atlas connectivity requirements, timeouts, and network whitelisting necessary for Hostinger backend deployment.

---

## 1. Connection Parameters in `apps/api/src/database/database.module.ts`

The application initializes Mongoose with bounded connection settings:

```typescript
{
  uri: process.env.MONGODB_URI,
  maxPoolSize: 50,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000, // 10-second timeout on initial connection
  connectTimeoutMS: 10000,         // 10-second TCP connect timeout
  socketTimeoutMS: 45000,          // 45-second socket read/write timeout
  retryWrites: true,
}
```

---

## 2. MongoDB Atlas Network Access (IP Whitelist)

1. **Hostinger Outbound IP**:
   - Locate the dedicated/shared outbound server IP of your Hostinger hosting account (found in Hostinger hPanel -> Server Details / SSH Details).
   - Add this specific IP address to **MongoDB Atlas -> Network Access -> IP Access List**.
2. **If Hostinger Uses Dynamic Outbound Pool**:
   - If Hostinger does not provide a single static outbound IP, add `0.0.0.0/0` temporarily or set up a secure Atlas database user with strict password and TLS requirements.
3. **Database User Authentication**:
   - Create a dedicated database user (e.g. `washora_api_user`) with `readWrite` permissions on `washora_db`.
   - Ensure the password does not contain unencoded special URI characters (use percent-encoding for symbols like `@`, `:`, `/`, `?`, `#`).

---

## 3. Verifying Connection from Application Logs

When the connection succeeds, the application logger outputs:
```text
[Nest] INFO [DatabaseModule] MongoDB connection established successfully
```

If the connection is rejected or times out, the logger outputs:
```text
[Nest] ERROR [DatabaseModule] MongoDB connection error: MongooseServerSelectionError: connection timed out
```

---

## 4. Readiness Probe Validation

To verify database readiness via HTTP:
```bash
curl -i https://api.yourdomain.com/health/ready
```

Expected response when MongoDB is connected:
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ready",
  "database": {
    "status": "connected",
    "latencyMs": 14
  },
  "service": "washora-api",
  "timestamp": "2026-10-09T11:45:00.000Z"
}
```
