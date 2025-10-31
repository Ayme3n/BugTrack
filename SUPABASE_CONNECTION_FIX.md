# 🔧 Fix Supabase Connection Error

## ❌ Current Error
```
Can't reach database server at `db.cgyeakdpdapxjiwrxbmf.supabase.co:5432`
```

## ✅ Solution

Your `.env` or `.env.local` file needs **BOTH** connection strings.

---

## 📝 Update Your Environment File

Add these two lines to your `.env` or `.env.local` file:

```env
# Connection Pooler (port 6543) - for most operations
DATABASE_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct Connection (port 5432) - required for Prisma operations
DIRECT_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

**Replace `[YOUR-PASSWORD]` with your actual database password!**

---

## 🔑 Where to Find Your Password

1. Go to: https://supabase.com/dashboard/project/cgyeakdpdapxjiwrxbmf
2. Click **Settings** (gear icon)
3. Click **Database**
4. Scroll to **Connection String** section
5. Click **Show** to reveal your password
6. Copy the password

---

## 📋 Step-by-Step

### 1. Find your `.env` or `.env.local` file
It's in the root of your BugTrack project (same folder as `package.json`)

### 2. Add BOTH connection strings
```env
DATABASE_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:YOUR_ACTUAL_PASSWORD_HERE@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:YOUR_ACTUAL_PASSWORD_HERE@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

### 3. Save the file

### 4. Restart your dev server
```bash
# Press Ctrl+C to stop current server
npm run dev
```

### 5. Try again
Go to: `http://localhost:3000/dashboard/tools`

---

## 🔍 Key Differences

| Variable | Port | Purpose |
|----------|------|---------|
| `DATABASE_URL` | **6543** | Connection pooler (faster for serverless) |
| `DIRECT_URL` | **5432** | Direct connection (required for migrations) |

Both point to the same database, just different connection methods!

---

## 🚨 Still Having Issues?

If you get a different error, it might be:

1. **Wrong password** - Double-check you copied it correctly
2. **Quotes missing** - Make sure the URLs are in quotes
3. **Extra spaces** - No spaces around the `=` sign
4. **Wrong file** - Must be `.env` or `.env.local` in the project root

---

## ✅ What Your .env Should Look Like

```env
# Supabase
DATABASE_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:YOUR_PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:YOUR_PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://cgyeakdpdapxjiwrxbmf.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
```

---

## 📚 Project Info (from Supabase MCP)

- **Project ID**: `cgyeakdpdapxjiwrxbmf`
- **Region**: `us-east-2`
- **Database Host**: `db.cgyeakdpdapxjiwrxbmf.supabase.co`
- **Status**: ✅ ACTIVE_HEALTHY
- **Postgres Version**: 17.6.1.021

---

**Once you update the .env file and restart, the tools page will work!** 🚀

