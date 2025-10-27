# Migration Guide: Supabase → Self-Hosted PostgreSQL

## Overview

This guide helps you migrate BugTrack from Supabase (MVP) to self-hosted PostgreSQL (Production/Enterprise).

**When to Migrate:**
- Cost: Supabase bill > $50/month
- Users: > 1,000 active users
- Compliance: Need SOC2, HIPAA, or enterprise contracts
- Control: Need on-premise deployment
- Features: Need custom auth (SSO, LDAP, advanced RBAC)
- Revenue: Making $2k+/month (validates business)

---

## Pre-Migration Checklist

- [ ] Back up all Supabase data (database + storage)
- [ ] Set up self-hosted PostgreSQL server
- [ ] Set up object storage (Cloudflare R2 or S3)
- [ ] Implement custom authentication system
- [ ] Test migration in staging environment
- [ ] Prepare user communication (password reset emails)
- [ ] Schedule maintenance window (2-4 hours)

---

## Phase 1: Export Data from Supabase

### 1.1 Export Database

```bash
# Install PostgreSQL client tools
sudo apt install postgresql-client

# Export Supabase database
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > bugtrack_backup_$(date +%Y%m%d).sql

# Verify backup
ls -lh bugtrack_backup_*.sql
```

### 1.2 Export Storage Files

**Option A: Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref xxxxx

# Download all files
supabase storage download --recursive avatars ./backup/avatars
supabase storage download --recursive attachments ./backup/attachments
```

**Option B: Manual Script**
```typescript
// scripts/export-storage.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function downloadBucket(bucketName: string) {
  const { data: files, error } = await supabase.storage
    .from(bucketName)
    .list('', { limit: 10000 });

  if (error) throw error;

  for (const file of files) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(file.name);

    if (error) {
      console.error(`Failed to download ${file.name}:`, error);
      continue;
    }

    const buffer = await data.arrayBuffer();
    fs.writeFileSync(
      path.join('backup', bucketName, file.name),
      Buffer.from(buffer)
    );
    console.log(`Downloaded ${file.name}`);
  }
}

downloadBucket('avatars');
downloadBucket('attachments');
```

---

## Phase 2: Set Up Self-Hosted Infrastructure

### 2.1 PostgreSQL Server

**On Ubuntu/Debian VPS:**
```bash
# Install PostgreSQL 15
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql
```

**In PostgreSQL console:**
```sql
-- Create database
CREATE DATABASE bugtrack_prod;

-- Create user
CREATE USER bugtrack_admin WITH ENCRYPTED PASSWORD 'your-secure-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bugtrack_prod TO bugtrack_admin;

-- Exit
\q
```

**Configure remote access** (if needed):
```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Set: listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2.2 Object Storage (Cloudflare R2)

**Why R2:**
- Free 10GB storage
- No egress fees
- S3-compatible API
- $0.015/GB after free tier

**Setup:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **R2** → **Create bucket**
3. Name: `bugtrack-attachments`
4. Create API token:
   - Go to **R2** → **Manage R2 API Tokens**
   - Create token with read/write permissions
   - Save: Account ID, Access Key ID, Secret Access Key

---

## Phase 3: Update Prisma Schema

### 3.1 Add Password Hash Back

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  password_hash   String    // Add back for custom auth
  name            String?
  avatar_url      String?
  
  // Two-Factor Authentication
  two_fa_secret   String?   // For custom TOTP
  two_fa_enabled  Boolean   @default(false)
  
  // ... rest of fields
}
```

### 3.2 Remove Supabase-Specific Config

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Remove: directUrl (not needed for direct PostgreSQL)
}
```

---

## Phase 4: Import Data

### 4.1 Import Database

```bash
# Connect to self-hosted PostgreSQL
psql -h your-server.com -U bugtrack_admin -d bugtrack_prod < bugtrack_backup_20250127.sql

# Verify import
psql -h your-server.com -U bugtrack_admin -d bugtrack_prod -c "SELECT COUNT(*) FROM users;"
```

### 4.2 Run Prisma Migrations

```bash
# Update DATABASE_URL in .env
DATABASE_URL=postgresql://bugtrack_admin:password@your-server.com:5432/bugtrack_prod

# Generate Prisma client
npx prisma generate

# Create initial migration
npx prisma migrate dev --name add_password_hash

# Apply migrations
npx prisma migrate deploy
```

### 4.3 Upload Files to R2

```typescript
// scripts/migrate-storage.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadDirectory(localPath: string, bucketName: string) {
  const files = fs.readdirSync(localPath);

  for (const file of files) {
    const filePath = path.join(localPath, file);
    const fileContent = fs.readFileSync(filePath);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: file,
        Body: fileContent,
      })
    );

    console.log(`Uploaded ${file}`);
  }
}

uploadDirectory('./backup/avatars', 'bugtrack-attachments');
uploadDirectory('./backup/attachments', 'bugtrack-attachments');
```

---

## Phase 5: Implement Custom Authentication

### 5.1 Install Auth Dependencies

```bash
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 5.2 Create Auth Utilities

**lib/auth/password.ts:**
```typescript
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**lib/auth/session.ts:**
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function createSession(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySession(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}
```

### 5.3 Create Auth API Routes

**app/api/auth/register/route.ts:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json();

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
  }

  // Create user
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      name,
    },
  });

  // Create session
  const token = createSession(user.id);

  const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
```

---

## Phase 6: Update Application Code

### 6.1 Replace Supabase Client Calls

**Before (Supabase):**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: user } = await supabase.auth.getUser();
```

**After (Custom Auth):**
```typescript
import { getCurrentUser } from '@/lib/auth/session';

const user = await getCurrentUser();
```

### 6.2 Update Middleware

**Before (Supabase):**
```typescript
import { updateSession } from '@/lib/supabase/middleware';
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

**After (Custom Auth):**
```typescript
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const session = token ? verifySession(token) : null;

  // Protect routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}
```

### 6.3 Update Storage Calls

**Before (Supabase Storage):**
```typescript
const { data, error } = await supabase.storage
  .from('attachments')
  .upload(path, file);
```

**After (R2 Storage):**
```typescript
import { uploadToR2 } from '@/lib/storage/r2';

const url = await uploadToR2(file, path);
```

---

## Phase 7: Deploy & Test

### 7.1 Update Environment Variables

```env
# Self-Hosted Configuration
DATABASE_URL=postgresql://bugtrack_admin:password@your-server.com:5432/bugtrack_prod

# Custom Auth
JWT_SECRET=your-jwt-secret-here
NEXTAUTH_URL=https://yourdomain.com

# Cloudflare R2 Storage
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET=bugtrack-attachments
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Remove Supabase vars
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 7.2 Deploy Application

```bash
# Build for production
npm run build

# Deploy to Vercel (or your hosting)
vercel --prod

# Or deploy to VPS
pm2 start npm --name "bugtrack" -- start
```

### 7.3 Test Migration

**Test Checklist:**
- [ ] Existing users can see their data
- [ ] Existing files load correctly
- [ ] New registrations work
- [ ] Login works with new auth
- [ ] Password reset works
- [ ] File uploads work
- [ ] All features functional

---

## Phase 8: User Communication

### 8.1 Send Migration Email

```
Subject: BugTrack Migration - Action Required

Hi [Name],

We've migrated BugTrack to our new self-hosted infrastructure for better performance and security.

ACTION REQUIRED:
Due to the migration, you'll need to reset your password:
1. Go to https://bugtrack.io/reset-password
2. Enter your email
3. Check your inbox for reset link
4. Create new password

Your data (targets, findings, payloads, notes) has been safely migrated and is accessible after password reset.

Questions? Reply to this email or contact support@bugtrack.io

Thank you,
The BugTrack Team
```

### 8.2 In-App Banner

Show banner on first login:
```
"Welcome back! We've migrated to a new infrastructure. Please reset your password to continue."
```

---

## Phase 9: Cleanup

### 9.1 Monitor for 2 Weeks

- Check error logs daily
- Monitor database performance
- Track user complaints
- Verify file access

### 9.2 Delete Supabase Project (After Verification)

```bash
# Final backup before deletion
pg_dump "postgresql://..." > final_backup.sql

# In Supabase Dashboard:
# Settings → General → Delete Project
```

---

## Rollback Plan (If Issues Occur)

### Emergency Rollback

1. **Revert DNS** (if changed)
2. **Re-enable Supabase** environment variables
3. **Redeploy previous version** from git
4. **Communicate** to users

```bash
# Quick rollback
git revert HEAD
git push
vercel --prod
```

---

## Cost Comparison After Migration

**Supabase (before):**
- Database: 8GB → $25/month
- Storage: 100GB → included
- Bandwidth: → included
- **Total: $25/month**

**Self-Hosted (after):**
- VPS (Hetzner CPX21): $10/month
- Cloudflare R2: $1.50/month (100GB)
- **Total: $11.50/month**

**Savings: $13.50/month ($162/year)**

---

## Support

- Migration issues: support@bugtrack.io
- Urgent: Same-day response
- Documentation: docs.bugtrack.io/migration

---

**Migration Complete!** 🎉

Your BugTrack instance is now self-hosted with full control, better performance, and lower costs.

