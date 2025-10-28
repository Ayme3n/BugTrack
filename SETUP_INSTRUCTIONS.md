# 🚀 Quick Setup Instructions

You're seeing this error because you need to configure Supabase. Here's what to do:

---

## Step 1: Create `.env` File

Create a new file called `.env` in the project root (NOT `.env.local` - Prisma requires `.env`):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE

# Database URLs (REQUIRED for Prisma)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your_64_character_hex_string_here
```

**Quick Create Command:**
```bash
# Copy the template to .env
cp ENV_TEMPLATE.txt .env

# Then edit .env with your actual credentials
```

---

## Step 2: Get Your Supabase Credentials

### Option A: Create New Supabase Project (15 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign in
3. Click "New Project"
4. Fill in:
   - **Name**: `bugtrack-mvp`
   - **Database Password**: Generate and **SAVE IT**
   - **Region**: Choose closest to you
   - **Plan**: Free
5. Wait 2-3 minutes for project to initialize

### Option B: Use Existing Supabase Project

If you already have a Supabase project, just get the credentials below.

---

## Step 3: Copy Your Credentials

Once your Supabase project is ready:

### Get API Keys:
1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy these values to your `.env`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Get Database URL:
1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** format
4. Copy the string and replace `[YOUR-PASSWORD]` with your database password
5. Use this same string for both `DATABASE_URL` and `DIRECT_URL`

**Example:**
```env
DATABASE_URL=postgresql://postgres:MySecurePass123!@db.abcdefghijk.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:MySecurePass123!@db.abcdefghijk.supabase.co:5432/postgres
```

---

## Step 4: Push Database Schema

Once `.env` is configured with your actual Supabase credentials:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Verify (optional)
npx prisma studio
```

---

## Step 5: Configure Supabase (10 minutes)

### Enable Row Level Security (RLS):

1. Go to **SQL Editor** in Supabase
2. Run this SQL:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can manage own data"
ON users FOR ALL TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can manage own targets"
ON targets FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own findings"
ON findings FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own attachments"
ON attachments FOR ALL TO authenticated
USING (finding_id IN (SELECT id FROM findings WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own payloads"
ON payloads FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notes"
ON notes FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own tool_jobs"
ON tool_jobs FOR ALL TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can manage own quotas"
ON user_quotas FOR ALL TO authenticated
USING (user_id = auth.uid());
```

### Create Storage Buckets:

1. Go to **Storage** in Supabase
2. Click "Create a new bucket"
3. Create bucket named `avatars`:
   - Public: ✅ Yes
   - File size limit: 2MB
4. Create bucket named `attachments`:
   - Public: ❌ No (private)
   - File size limit: 50MB

---

## Step 6: Test It!

```bash
# Start the dev server
npm run dev
```

Then visit:
1. **http://localhost:3000** - Home page
2. **http://localhost:3000/register** - Create account
3. **http://localhost:3000/login** - Login
4. **http://localhost:3000/dashboard** - Dashboard (after login)

---

## 🎉 You're Done!

If everything works:
- ✅ You can register a new account
- ✅ You can login
- ✅ Dashboard loads with your name
- ✅ You can edit your profile

---

## 🐛 Troubleshooting

### Error: "Environment variable not found: DIRECT_URL"
**Solution**: You haven't created `.env` yet. Follow these steps:
1. Copy `ENV_TEMPLATE.txt` to `.env`
2. Edit `.env` and replace all placeholder values with your Supabase credentials
3. Make sure `DIRECT_URL` is set to the same value as `DATABASE_URL`

### Error: "Invalid API key"
**Solution**: Double-check you copied the keys correctly (no extra spaces).

### Error: "Connection refused"
**Solution**: Check your DATABASE_URL has the correct password and project ID.

### Registration succeeds but no user in database
**Solution**: Enable RLS and create policies (Step 5).

### Can't upload files
**Solution**: Create storage buckets (Step 5).

---

## 📚 Need More Help?

- **Complete Guide**: `docs/SUPABASE_SETUP.md`
- **Sprint 1 Summary**: `docs/SPRINT1_COMPLETE.md`
- **Quick Reference**: `SPRINT1_READY.md`

---

**Estimated Setup Time**: 20-30 minutes total

Once setup is complete, you'll have a fully functional authentication system with:
- User registration & login
- Protected dashboard
- Profile management
- Beautiful UI with dark mode
- Ready for Sprint 2 (Targets Management)!

