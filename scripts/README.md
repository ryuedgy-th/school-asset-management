# Utility Scripts

This directory contains utility scripts for database maintenance and verification.

## Available Scripts

### `check-rbac.ts`
Verifies RBAC system integrity - checks modules, permissions, roles, and users.

**Usage:**
```bash
npx tsx scripts/check-rbac.ts
```

### `check-stock.ts`
Finds and fixes assets with incorrect stock counts.

**Usage:**
```bash
npx tsx scripts/check-stock.ts
```

### `fix-stuck-assets.ts`
Finds and fixes assets with inconsistent borrow status.

**Usage:**
```bash
npx tsx scripts/fix-stuck-assets.ts
```

## Notes
- All scripts use Prisma Client to interact with the database
- Safe to run in development environment
- Review output before running in production
