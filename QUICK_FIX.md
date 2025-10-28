# 🚨 Quick Fix for "DIRECT_URL not found" Error

## The Problem
You're seeing this error:
```
Error: Environment variable not found: DIRECT_URL.
  -->  prisma\schema.prisma:23
```

## The Solution (5 minutes)

### Step 1: Create `.env` File

You need to create a `.env` file in your project root. Here's the fastest way:

**Option A: Using the template file**
```bash
# Copy the template
cp ENV_TEMPLATE.txt .env
```

**Option B: Create manually**
Create a new file called `.env` (not `.env.local`) in `C:\Users\User\BugTrack\`

### Step 2: Add Your Supabase Credentials

Open the `.env` file and add:

```env
# Supabase API Keys (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection (from Supabase Dashboard → Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres

# Application Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_64_character_hex_key_here
```

### Step 3: Get Your Supabase Credentials

If you don't have a Supabase project yet:

1. **Go to**: https://supabase.com
2. **Sign in** with GitHub
3. **Create new project**:
   - Name: `bugtrack-mvp`
   - Password: Generate and save it
   - Region: Choose closest to you
4. **Wait 2-3 minutes** for initialization

Then get your credentials:

#### Get API Keys:
- Go to: **Settings** → **API**
- Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

#### Get Database URL:
- Go to: **Settings** → **Database**
- Scroll to **Connection string**
- Select **URI** format
- Copy the string (it looks like: `postgresql://postgres:...`)
- Replace `[YOUR-PASSWORD]` with your database password
- Use the same value for both `DATABASE_URL` and `DIRECT_URL`

#### Generate Encryption Key:
```bash
openssl rand -hex 32
```

### Step 4: Test It

Once your `.env` file is configured:

```bash
# Push the database schema
npx prisma db push

# Start the dev server
npm run dev
```

## ✅ Success!

If it works, you should see:
```
🚀 Your database is now in sync with your Prisma schema.
```

Then you can access:
- http://localhost:3000 - Home page
- http://localhost:3000/register - Create account
- http://localhost:3000/login - Sign in

---

## 🔍 Why This Happened

- Prisma requires a `.env` file (not `.env.local`) to read `DATABASE_URL` and `DIRECT_URL`
- `DIRECT_URL` is needed for Supabase's connection pooling
- The `.env.example` file was accidentally deleted in a previous commit

---

## 📚 More Help

- **Complete Setup Guide**: `SETUP_INSTRUCTIONS.md`
- **Supabase Configuration**: `docs/SUPABASE_SETUP.md`
- **Sprint 1 Features**: `docs/SPRINT1_COMPLETE.md`

---

**Need help?** Check the troubleshooting section in `SETUP_INSTRUCTIONS.md`

