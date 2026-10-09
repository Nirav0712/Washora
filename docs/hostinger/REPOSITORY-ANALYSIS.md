# Washora Monorepo & Backend Architecture Analysis

This document provides a verified architectural inspection of the Washora repository for Hostinger Node.js backend deployment.

---

## 1. Monorepo & Directory Structure

- **Repository Root**: `d:\Washora` (Monorepo root containing `package.json` with npm workspaces).
- **Backend Application Root**: `apps/api`
- **Frontend Applications**:
  - `apps/web`: Public SaaS Marketing & Shop Management Web App (Next.js)
  - `apps/admin`: Platform Super Admin & Partner Governance Portal (Next.js)
- **Shared Libraries**:
  - `packages/shared`: Shared TypeScript types, enums, permission constants, DTOs, and RBAC matrix.

---

## 2. Dependency Management & Workspace Hoisting

- **Package Manager**: `npm` (Lockfile: `package-lock.json`, lockfileVersion 3).
- **Workspace Resolution**: `apps/api` depends on `@washora/shared: "*"` via npm workspace symlinks.
- **Hoisting Behavior**: Dependencies such as `@nestjs/*`, `mongoose`, `class-validator`, and `passport` are hoisted to the root `node_modules/`.
- **Deployment Implication**: Hostinger Node.js deployment **must maintain the workspace structure** or install dependencies from the repository root so that `@washora/shared` and hoisted packages resolve properly.

---

## 3. Node.js & Runtime Compatibility

- **Engine Compatibility**: Node.js **18.x LTS** or **20.x LTS** (Recommended: **Node.js 20.x LTS**).
- **TypeScript Compiler**: Version `^5.4.0` targeting `ES2021` with `CommonJS` module output.
- **Entry Point After Compilation**:
  - TypeScript source: `apps/api/src/main.ts`
  - Compiled output: `apps/api/dist/main.js` (relative to repository root: `apps/api/dist/main.js`).

---

## 4. Port Binding & Bootstrap Behavior

- **Port Resolution**: `parseInt(process.env.PORT || '4000', 10)`
- **Listener Invocation**: `await app.listen(port);`
- **Route Prefix Architecture**:
  - Global prefix: `api` (e.g. `/api/auth/login`, `/api/orders`, `/api/platform/tenants`)
  - Excluded from prefix: `/health`, `/health/live`, `/health/ready`
  - Swagger Documentation: `/api/docs`

---

## 5. Summary of Verified Technical Parameters

| Parameter | Verified Value | Source / File Reference |
| :--- | :--- | :--- |
| **Repository Root** | `.` | Root `package.json` |
| **API Application Path** | `apps/api` | `apps/api/package.json` |
| **Shared Package Path** | `packages/shared` | `packages/shared/package.json` |
| **Build Tool** | NestJS CLI (`nest build`) | `apps/api/package.json` |
| **Compiled Entry File** | `apps/api/dist/main.js` | `apps/api/tsconfig.json` (`outDir: "./dist"`) |
| **Default Port** | `4000` (or `process.env.PORT`) | `apps/api/src/main.ts` (Line 100) |
| **Health Liveness URL** | `/health/live` | `apps/api/src/modules/health/health.controller.ts` |
| **Health Readiness URL** | `/health/ready` | `apps/api/src/modules/health/health.controller.ts` |
| **Swagger API Docs** | `/api/docs` | `apps/api/src/main.ts` (Line 98) |
