# Phase 2 Local Setup Guide

## 🎯 Goal
Get Subfinder working locally with Docker in 2-3 hours

---

## ✅ Prerequisites

1. Docker Desktop installed and running
2. Node.js 18+ (already have ✅)
3. Supabase database (already have ✅)

---

## 📋 Setup Steps

### Step 1: Install Docker Desktop

1. Download from https://www.docker.com/products/docker-desktop/
2. Install (choose WSL 2 backend)
3. Restart computer
4. Open Docker Desktop
5. Verify: `docker --version` and `docker run hello-world`

### Step 2: Test Docker with Subfinder

```bash
# Pull the official Subfinder image
docker pull projectdiscovery/subfinder:latest

# Test it
docker run projectdiscovery/subfinder:latest -d example.com -silent

# You should see a list of subdomains!
```

### Step 3: Create Runner Service

```bash
cd BugTrack
mkdir runner
cd runner
npm init -y
npm install @prisma/client dockerode dotenv
```

### Step 4: Copy Prisma Client

```bash
# Copy from main project
cp ../prisma/schema.prisma ./prisma/
npx prisma generate
```

### Step 5: Create .env for Runner

Create `runner/.env`:
```env
DATABASE_URL="your_supabase_connection_string"
```

### Step 6: Run the Runner

```bash
cd runner
node index.js
```

Keep this terminal open - runner will stay running and process jobs!

### Step 7: Test End-to-End

1. Go to http://localhost:3001/dashboard/tools (once we build UI)
2. Submit a job (domain: example.com, tool: Subfinder)
3. Watch runner terminal - it should pick up the job
4. Results appear in database
5. Frontend shows results

---

## 🐛 Troubleshooting

### Docker not found
- Ensure Docker Desktop is running (whale icon in system tray)
- Restart terminal after installing Docker

### Permission denied
- On Windows with WSL2, ensure WSL integration is enabled in Docker Desktop settings

### Container fails to start
- Check Docker Desktop is running
- Check Docker has enough resources (Settings → Resources)
- Try: `docker system prune` to clean up

---

## 📚 Next Steps

Once Subfinder works:
1. Add Httpx integration
2. Add Nuclei integration  
3. Polish UI
4. Add result importing to findings

---

## 🚀 Migration Path (Future)

When ready to deploy 24/7:

### Option A: Railway.app
```bash
cd runner
railway login
railway init
railway up
```

### Option B: Fly.io
```bash
cd runner
fly launch
fly deploy
```

### Option C: Oracle Cloud (with credit card)
```bash
ssh ubuntu@oracle-ip
git clone your-repo
cd runner
npm install
pm2 start index.js
```

**Same code works everywhere!** 🎉

---

## 💡 Tips

- Keep Docker Desktop running while developing
- Runner uses ~100MB RAM (very light)
- Each container uses ~50-200MB RAM
- You can run 5-10 containers simultaneously on a typical PC

---

**Ready to continue once Docker is installed!** 🚀

