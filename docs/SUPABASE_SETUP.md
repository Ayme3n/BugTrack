# Supabase Setup Guide for BugTrack MVP

## Overview

This guide walks you through setting up Supabase for BugTrack's MVP (Phase 1). We're using Supabase for fast development, then migrating to self-hosted PostgreSQL in Phase 4+ for production/enterprise needs.

---

## Why Supabase for MVP?

✅ **Speed**: Auth + Database + Storage in one setup (saves 2-3 weeks)  
✅ **Free Tier**: 500MB database, 1GB storage, 50k MAU  
✅ **Standard PostgreSQL**: Easy migration path to self-hosted later  
✅ **Built-in Features**: 2FA, magic links, real-time subscriptions  
✅ **Security**: Row Level Security (RLS), automatic SSL

---

## Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (recommended for easy deployment)

### 1.2 Create New Project

1. Click "New Project"
2. Fill in details:
   - **Name**: `bugtrack-mvp`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (sufficient for MVP)

3. Click "Create new project"
4. Wait 2-3 minutes for project initialization

---

## Step 2: Get Your API Keys

### 2.1 Project Settings

1. In Supabase dashboard, click **Settings** → **API**
2. Copy the following (you'll need them):

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2 Database Connection String

1. Click **Settings** → **Database**
2. Scroll to **Connection string**
3. Copy the **URI** format:

```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

---

## Step 3: Install Supabase Dependencies

```bash
# Install Supabase client libraries
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Install Auth UI components (optional, for rapid development)
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

---

## Step 4: Configure Environment Variables

### 4.1 Update `.env` File

Create/update your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL (for Prisma)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: `DIRECT_URL` is needed for Prisma migrations with Supabase's connection pooler.

---

## Step 5: Set Up Supabase Client

### 5.1 Create Supabase Client Utilities

Create `lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// For Client Components
export const createClient = () => {
  return createClientComponentClient();
};

// For Server Components
export const createServerClient = () => {
  return createServerComponentClient({ cookies });
};

// For Server Actions / Route Handlers
export { createServerClient as createRouteHandlerClient };
```

### 5.2 Create Supabase Singleton (Alternative)

Create `lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client (use sparingly, has full access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

---

## Step 6: Configure Prisma for Supabase

### 6.1 Update `prisma/schema.prisma`

```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL") // Required for Supabase
}
```

### 6.2 Push Schema to Supabase

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase database
npx prisma db push

# Open Prisma Studio to verify
npx prisma studio
```

---

## Step 7: Configure Supabase Auth

### 7.1 Enable Auth Providers

In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** (already enabled by default)
3. Configure settings:
   - ✅ Enable email confirmations (optional for MVP)
   - ✅ Enable password requirements (min 8 chars)
   - ✅ Enable 2FA/MFA

### 7.2 Configure Auth URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (dev) or your production URL
3. Set **Redirect URLs**:
   ```
   http://localhost:3000
   http://localhost:3000/auth/callback
   https://yourdomain.com
   https://yourdomain.com/auth/callback
   ```

### 7.3 Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirmation email
   - Password reset email
   - Magic link email

---

## Step 8: Set Up Storage Buckets

### 8.1 Create Storage Buckets

In Supabase Dashboard:

1. Go to **Storage**
2. Click **Create a new bucket**
3. Create buckets:

**Bucket 1: `avatars`**
- Name: `avatars`
- Public: ✅ Yes (avatars are public)
- File size limit: 2MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

**Bucket 2: `attachments`**
- Name: `attachments`
- Public: ❌ No (private, user-specific)
- File size limit: 50MB
- Allowed MIME types: `image/*, application/pdf, text/*, video/mp4`

### 8.2 Set Up Storage Policies (RLS)

For **attachments** bucket, create policy:

1. Click on `attachments` bucket
2. Go to **Policies** tab
3. Click **New Policy** → **Custom**

**Policy 1: Users can upload their own files**
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Users can read their own files**
```sql
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Step 9: Set Up Row Level Security (RLS)

### 9.1 Enable RLS on Tables

In Supabase Dashboard:

1. Go to **Authentication** → **Policies**
2. Or use SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
```

### 9.2 Create RLS Policies

**Users Table** (users can only read/update their own profile):

```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

**Targets Table** (users can manage their own targets):

```sql
CREATE POLICY "Users can manage own targets"
ON targets FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Findings Table** (users can manage their own findings):

```sql
CREATE POLICY "Users can manage own findings"
ON findings FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Repeat for other tables** (payloads, notes, etc.)

---

## Step 10: Test the Setup

### 10.1 Test Database Connection

```bash
# Test Prisma connection
npx prisma db pull

# Should show your schema without errors
```

### 10.2 Test Auth

Create `app/test-auth/page.tsx`:

```tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function TestAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setMessage(error ? error.message : 'Sign up successful!');
  };

  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setMessage(error ? error.message : 'Sign in successful!');
  };

  return (
    <div className="p-8">
      <h1>Test Supabase Auth</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 m-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 m-2"
      />
      <button onClick={handleSignUp} className="bg-blue-500 text-white p-2 m-2">
        Sign Up
      </button>
      <button onClick={handleSignIn} className="bg-green-500 text-white p-2 m-2">
        Sign In
      </button>
      <p>{message}</p>
    </div>
  );
}
```

Visit `http://localhost:3000/test-auth` and test registration/login.

---

## Step 11: Middleware for Auth Protection

Create `middleware.ts` at project root:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (
    (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') &&
    session
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

---

## Common Issues & Troubleshooting

### Issue 1: "Invalid API Key"

**Solution**: Double-check your `.env` file has correct keys (no extra spaces)

### Issue 2: Prisma Connection Error

**Solution**: Make sure you have both `DATABASE_URL` and `DIRECT_URL` set

### Issue 3: RLS Policies Not Working

**Solution**: 
1. Make sure RLS is enabled on the table
2. Verify policies allow the operation you're trying
3. Check that `auth.uid()` matches the user's ID format (UUID)

### Issue 4: Storage Upload Fails

**Solution**:
1. Check bucket policies
2. Verify file MIME type is allowed
3. Check file size doesn't exceed limit

### Issue 5: User UUID vs CUID Mismatch

**Solution**: Supabase uses UUID for `auth.uid()`. Make sure your Prisma schema uses `@default(uuid())` not `@default(cuid())`

---

## Migration Path to Self-Hosted (Phase 4+)

When you're ready to migrate:

### Step 1: Export Data

```bash
# Export Supabase database
pg_dump "postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres" > backup.sql

# Export storage files
# Use Supabase CLI: supabase storage download
```

### Step 2: Set Up Self-Hosted PostgreSQL

```bash
# On your VPS/server
sudo apt install postgresql-14
createdb bugtrack_prod
```

### Step 3: Import Data

```bash
psql bugtrack_prod < backup.sql
```

### Step 4: Update Environment

```env
DATABASE_URL=postgresql://user:password@your-server.com:5432/bugtrack_prod
```

### Step 5: Migrate Auth

- Keep user records in `users` table
- Implement custom auth (bcrypt, JWT sessions)
- Email users about password reset (since you can't export hashed passwords)

### Step 6: Migrate Storage

- Move files to Cloudflare R2 or AWS S3
- Update file URLs in database

---

## Supabase CLI (Optional)

For advanced workflows:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref xxxxx

# Pull remote changes
supabase db pull

# Generate TypeScript types
supabase gen types typescript --project-id xxxxx > lib/supabase/types.ts
```

---

## Next Steps

1. ✅ Supabase project created
2. ✅ Environment variables configured
3. ✅ Prisma schema pushed to Supabase
4. ✅ Auth and storage configured
5. ✅ RLS policies set up
6. → **Start Sprint 1**: Build authentication UI
7. → **Sprint 3**: Implement targets management
8. → **Sprint 4**: Build findings tracker

---

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Buckets](https://supabase.com/docs/guides/storage)
- [Prisma with Supabase](https://supabase.com/docs/guides/integrations/prisma)

---

**Status**: Setup complete! Ready for Sprint 1 development 🚀

