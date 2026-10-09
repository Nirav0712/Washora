# Washora Phase 12 — Backup, Restore & Disaster Recovery

This document outlines the backup policy, restore workflow, recovery objectives, and data integrity verification for MongoDB Atlas and Cloudinary media assets.

---

## 1. Database Backup Architecture (MongoDB Atlas)

### Topology & Tier Considerations
- **Tier**: MongoDB Atlas (M0 Free / M10+ Dedicated depending on cluster deployment).
- **M0 Sandbox Tier Limitation**: Automated continuous point-in-time recovery (PITR) is unavailable on M0 free tiers. Nightly cloud snapshots and logical dumps via `mongodump` are recommended for non-dedicated tiers.
- **M10+ Dedicated Tier Capability**: Continuous cloud backups with granular Point-in-Time Recovery (PITR) down to the minute, with retention periods from 7 to 365 days.

### Recovery Objectives
- **Recovery Point Objective (RPO)**:
  - Free/Dev tier: 24 hours (nightly automated logical dump).
  - Dedicated Production cluster: 1 minute (via Atlas Continuous PITR).
- **Recovery Time Objective (RTO)**:
  - Database restore: < 30 minutes to spin up a new replica set snapshot.
  - DNS / Application reconnect: < 5 minutes.

---

## 2. Backup & Restore Runbooks

### Runbook A: Scheduled Logical Backup (`mongodump`)
For environments without continuous Atlas snapshots:
```bash
# Export all tenant and SaaS operational data with gzip compression
mongodump --uri="mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/washora" --gzip --archive=/backups/washora_$(date +%Y%m%d_%H%M%S).archive.gz
```

### Runbook B: Targeted Disaster Recovery Restore (`mongorestore`)
```bash
# 1. Spin up staging or replacement target cluster
# 2. Restore archive with non-destructive drop/replace flags
mongorestore --uri="mongodb+srv://<USER>:<PASS>@<TARGET_CLUSTER>.mongodb.net/washora" --gzip --archive=/backups/washora_YYYYMMDD_HHMMSS.archive.gz --drop
```

### Runbook C: Atlas Snapshot Web UI Restore
1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Navigate to **Cluster** -> **Backup**.
3. Select **Restore Snapshot** or **Point in Time Restore**.
4. Choose **Restore to a New Cluster** (Recommended to prevent accidental production overwrite) or **Restore to Current Cluster**.
5. Once complete, update the `MONGODB_URI` environment variable in the backend hosting dashboard (Hostinger / Vercel API).
6. Trigger `/health/ready` to verify connectivity.

---

## 3. Media & File Asset Recovery (Cloudinary)

- **Asset Storage**: Customer garment intake photos, branch logos, and payment receipts are stored on Cloudinary.
- **Resilience**: Cloudinary maintains multi-zone geographic redundancy.
- **Backup Strategy**:
  - Cloudinary Backup to AWS S3 / Google Cloud Storage bucket (supported via Cloudinary Add-on).
  - Metadata references in MongoDB contain `public_id`, `url`, `secure_url`, and `format`.
  - In the event of catastrophic media loss, garment intakes retain text notes, itemization, and pricing within MongoDB.

---

## 4. Verification Status

| Procedure | Status | Verification Detail |
| :--- | :--- | :--- |
| Logical Backup / Restore Schema Compatibility | **VERIFIED** | Schema definitions & indexes re-created cleanly in memory / test runs |
| Graceful Database Reconnection | **VERIFIED** | Tested bounded timeout recovery via `/health/ready` |
| Live Atlas Snapshot Restore | **NOT VERIFIED** | Requires live production Atlas cluster credentials |
| Live Cloudinary S3 Mirroring | **NOT VERIFIED** | Requires active Cloudinary enterprise backup bucket |
