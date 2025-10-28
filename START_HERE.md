# 🚀 BugTrack - Start Here

## You Got the "DIRECT_URL not found" Error?

**Don't worry!** This is expected on first setup. Here's the 3-step fix:

### Quick Fix (5 minutes)

#### Option 1: Automated Setup (Easiest)
```bash
# Windows:
create-env.bat

# Linux/Mac:
chmod +x create-env.sh
./create-env.sh
```

#### Option 2: Manual Setup
```bash
# 1. Copy the template
cp ENV_TEMPLATE.txt .env

# 2. Edit .env with your Supabase credentials
# (See instructions below)

# 3. Push database schema
npx prisma db push

# 4. Start the app
npm run dev
```

---

## What You've Built So Far

### ✅ Phase 0: Foundation (COMPLETE)
- 📚 9 documentation files (4,848+ lines)
- 🏗️ Architecture & security design
- 📖 6 feature specifications

### ✅ Sprint 1: Authentication (COMPLETE)
- 🔐 Full auth system with Supabase
- 🎨 Beautiful UI with Tailwind
- 📱 13 new files created
- 🗄️ Complete Prisma schema (8 tables)

---

## Getting Your Supabase Credentials

### Don't Have Supabase Yet?

1. **Go to**: https://supabase.com
2. **Sign in** with GitHub
3. **New Project**:
   - Name: `bugtrack-mvp`
   - Password: Generate and save it
   - Region: Choose closest
   - Plan: Free
4. **Wait 2-3 minutes** for initialization

### Get Your Credentials

Once your project is ready:

#### API Keys (Settings → API):
```
Project URL          → NEXT_PUBLIC_SUPABASE_URL
anon/public key      → NEXT_PUBLIC_SUPABASE_ANON_KEY
service_role key     → SUPABASE_SERVICE_ROLE_KEY
```

#### Database URL (Settings → Database → Connection string → URI):
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```
Use this for both `DATABASE_URL` and `DIRECT_URL`

#### Encryption Key:
```bash
openssl rand -hex 32
```

---

## Your `.env` File Should Look Like This

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URLs (use same value for both)
DATABASE_URL=postgresql://postgres:MyPassword123@db.abcdefghijk.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:MyPassword123@db.abcdefghijk.supabase.co:5432/postgres

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption Key (64 character hex string)
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## After Setup Works

### Test Your Installation

```bash
# 1. Push database schema
npx prisma db push

# 2. Start dev server
npm run dev
```

### Try It Out
1. **Register**: http://localhost:3000/register
2. **Login**: http://localhost:3000/login
3. **Dashboard**: http://localhost:3000/dashboard
4. **Database**: `npx prisma studio`

### You Should See:
- ✅ Beautiful auth pages
- ✅ User registration works
- ✅ Login redirects to dashboard
- ✅ Protected routes work
- ✅ Profile page loads

---

## Project Structure

```
BugTrack/
├── app/
│   ├── (auth)/          # Login, Register, Callback
│   ├── (dashboard)/     # Protected dashboard pages
│   └── api/             # API routes
├── components/
│   └── features/        # Feature components
├── lib/
│   ├── supabase/        # Supabase clients
│   ├── crypto/          # Encryption utilities
│   └── db/              # Prisma client
├── prisma/
│   └── schema.prisma    # Database schema (8 tables)
└── docs/                # Complete documentation
```

---

## What's Built

### Authentication System ✅
- User registration with email
- Secure login
- Session management
- Protected routes
- Profile management

### Database Schema ✅
8 tables ready:
- `users` - User accounts
- `targets` - Programs/targets
- `findings` - Vulnerabilities
- `attachments` - File uploads
- `payloads` - Attack payloads
- `notes` - Encrypted notes
- `tool_jobs` - Tool execution (Phase 2)
- `user_quotas` - Rate limiting

### UI Components ✅
- Auth pages (login/register)
- Dashboard layout
- Navigation sidebar
- Header with user menu
- Responsive design
- Dark mode support

---

## Next Steps (Sprint 2)

Once Sprint 1 is working, you'll build:
1. **Targets Management** - Add/edit programs
2. **Scope Definition** - Define in/out of scope
3. **Target Dashboard** - View all targets
4. **Filtering & Search** - Find targets quickly

---

## Documentation Reference

### Setup & Configuration
- 📖 **START_HERE.md** (this file) - Quick start
- 🚨 **QUICK_FIX.md** - 5-minute fix for DIRECT_URL error
- ⚙️ **SETUP_INSTRUCTIONS.md** - Complete setup guide
- ✅ **ERROR_RESOLVED.md** - Error explanation & solution
- 📄 **ENV_TEMPLATE.txt** - Environment variable template

### Project Documentation
- 🏗️ **docs/architecture.md** - System design
- 🔒 **docs/security.md** - Security measures
- 🗄️ **docs/SUPABASE_SETUP.md** - Supabase configuration
- 📊 **docs/SPRINT1_COMPLETE.md** - Sprint 1 summary

### Feature Specifications
- 🔐 **docs/features/01-authentication.md** - Auth spec
- 🎯 **docs/features/02-targets.md** - Targets spec
- 🐛 **docs/features/03-findings.md** - Findings spec
- 💉 **docs/features/04-payload-library.md** - Payload spec
- 📝 **docs/features/05-encrypted-notes.md** - Notes spec
- 🔧 **docs/features/06-tools-integration.md** - Tools spec

---

## Troubleshooting

### Error: "Environment variable not found: DIRECT_URL"
👉 See: **QUICK_FIX.md**

### Error: "Invalid API key"
- Check for extra spaces in your `.env` file
- Copy keys again from Supabase dashboard

### Error: "Connection refused"
- Verify database password in `DATABASE_URL`
- Check project ID matches Supabase project

### Can't register/login
- Make sure `npx prisma db push` completed successfully
- Check Supabase project is active
- Look at browser console for errors

---

## Helper Scripts

### Windows
```bash
create-env.bat          # Interactive .env creation
```

### Linux/Mac
```bash
./create-env.sh         # Interactive .env creation
```

### Manual Commands
```bash
cp ENV_TEMPLATE.txt .env        # Copy template
npx prisma db push              # Push schema
npx prisma studio               # View database
npm run dev                     # Start app
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Encryption**: AES-256-GCM

---

## Current Status

✅ **Ready to Configure**

Once you create your `.env` file with Supabase credentials, you'll have:
- Complete authentication system
- Beautiful UI
- 8-table database schema
- Protected dashboard
- Profile management

**Total Setup Time**: 20-30 minutes

---

## Need Help?

1. **Quick Fix**: See `QUICK_FIX.md`
2. **Detailed Setup**: See `SETUP_INSTRUCTIONS.md`
3. **Supabase Guide**: See `docs/SUPABASE_SETUP.md`
4. **Error Help**: See `ERROR_RESOLVED.md`

---

## What Makes This Special

✨ **Zero-knowledge encryption** for sensitive notes  
🔐 **Secure by default** with RLS policies  
🚀 **Fast development** with Supabase  
📦 **Easy migration** to self-hosted (Phase 4)  
🎨 **Beautiful UI** with dark mode  
📚 **Complete documentation** (4,848+ lines)

---

**Ready?** Create your `.env` file and let's go! 🚀

