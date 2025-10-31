# 🔧 Fix Prisma Connection - Step by Step

## Current Error: "Tenant or user not found"

This means the connection format is slightly wrong. Let's fix it!

---

## ✅ Solution

### Step 1: Stop Your Dev Server
Press `Ctrl + C` in the terminal running `npm run dev`

### Step 2: Clear Next.js Cache
```bash
rm -rf .next
# Or on Windows PowerShell:
Remove-Item -Recurse -Force .next
```

### Step 3: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 4: Check Your .env Format

Your connection strings should look **exactly** like this (with YOUR password):

```env
DATABASE_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:[YOUR-PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

**Critical points:**
- No spaces around `=`
- Entire URL in quotes
- Replace `[YOUR-PASSWORD]` with actual password
- NO extra quotes or spaces

### Step 5: Restart Dev Server
```bash
npm run dev
```

---

## 🔍 Common Issues

### Issue 1: Wrong Password
Go to Supabase Dashboard → Settings → Database → Connection String  
Click "Show" to reveal your password

### Issue 2: Extra Quotes
**BAD:**
```env
DATABASE_URL=""postgresql://...""
```

**GOOD:**
```env
DATABASE_URL="postgresql://..."
```

### Issue 3: Special Characters in Password
If your password has special characters like `@`, `#`, `%`, they need to be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`

---

## 🧪 Test the Connection

After restarting, try this SQL query in Supabase:

```sql
SELECT * FROM tool_jobs LIMIT 1;
```

Should return empty result (no rows), not an error.

---

## 💡 Alternative: Use Supabase Client Instead

If Prisma still doesn't work, we can temporarily use Supabase client for tool_jobs:

1. I'll update the API to use Supabase client
2. This will bypass Prisma connection issues
3. We can fix Prisma later

**Want me to do this?** Let me know and I'll update the code.

---

## 📞 If Still Not Working

Share your `.env` file format (with password hidden):
```env
DATABASE_URL="postgresql://postgres.cgyeakdpdapxjiwrxbmf:***@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

I'll help debug the exact format!

