# Phase 2: Free VPS Alternatives (No Credit Card Required)

**Goal**: Find free hosting for the runner service without needing a credit card

---

## 🆓 Free VPS Options (No Credit Card)

### Option 1: Railway.app (Recommended ✅)

**What is it?**: Modern platform-as-a-service (PaaS) with generous free tier

**Free Tier**:
- ✅ **$5 credit/month** (enough for small runner)
- ✅ **No credit card required** for trial
- ✅ 512MB RAM
- ✅ 1GB disk
- ✅ Unlimited bandwidth
- ✅ Supports Docker deployments

**How to Deploy**:
```bash
# 1. Create account at railway.app (GitHub login)
# 2. Install Railway CLI
npm install -g @railway/cli

# 3. Login
railway login

# 4. Initialize project
railway init

# 5. Deploy runner
railway up

# 6. Set environment variables
railway variables set DATABASE_URL=your_supabase_url
```

**Pros**:
- ✅ No credit card needed
- ✅ Very easy deployment (one command)
- ✅ Docker support
- ✅ Free $5/month credits
- ✅ GitHub integration

**Cons**:
- ⚠️ Limited resources (512MB RAM)
- ⚠️ $5 credit = ~100-150 hours/month
- ⚠️ Need to manage resource usage

**Verdict**: ✅ **BEST OPTION** for no credit card

---

### Option 2: Render.com (Good Alternative)

**Free Tier**:
- ✅ **Free tier with no credit card**
- ✅ 512MB RAM
- ✅ Free web services (with limitations)
- ✅ Docker support
- ✅ Auto-deploy from GitHub

**Limitations**:
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Need 1-2 minutes to wake up
- ⚠️ 750 hours/month (shared across services)

**How to Deploy**:
```yaml
# render.yaml
services:
  - type: worker
    name: bugtrack-runner
    env: docker
    dockerfilePath: ./runner/Dockerfile
    envVars:
      - key: DATABASE_URL
        sync: false
```

**Pros**:
- ✅ No credit card
- ✅ Easy GitHub integration
- ✅ Docker support
- ✅ Free SSL

**Cons**:
- ❌ Spins down (15 min inactivity) - BAD for runner
- ❌ Limited to 750 hours/month

**Verdict**: ⚠️ **Not ideal** for always-on runner (but usable)

---

### Option 3: Fly.io (Generous Free Tier)

**Free Tier**:
- ✅ **No credit card for trial**
- ✅ 3 shared-cpu VMs
- ✅ 256MB RAM per VM
- ✅ 3GB persistent storage
- ✅ 160GB bandwidth/month

**How to Deploy**:
```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Sign up (no credit card)
fly auth signup

# 3. Launch app
fly launch

# 4. Deploy
fly deploy
```

**Pros**:
- ✅ No credit card needed initially
- ✅ Always-on (doesn't spin down)
- ✅ Multiple regions
- ✅ Docker support

**Cons**:
- ⚠️ Only 256MB RAM per VM
- ⚠️ Requires credit card after trial for extended use

**Verdict**: ⚠️ **Good** but small RAM

---

### Option 4: Heroku (Classic, But Limited)

**Free Tier** (Deprecated, but Eco plan exists):
- ❌ **Heroku removed free tier in 2022**
- ⚠️ Cheapest: $5/month (Eco Dynos)
- ⚠️ Requires credit card

**Verdict**: ❌ **Not free anymore**

---

### Option 5: Vercel (With Workarounds)

**Idea**: Run the runner as a Vercel serverless function

**Free Tier**:
- ✅ No credit card
- ✅ Unlimited deployments
- ✅ 100GB bandwidth

**PROBLEM**:
- ❌ 10-second timeout (Edge)
- ❌ 60-second timeout (Serverless)
- ❌ Not suitable for long-running jobs

**Workaround**:
```typescript
// Use Vercel Cron Jobs (beta)
// app/api/cron/process-jobs/route.ts
export async function GET() {
  // Process ONE job at a time
  // Called every 5 minutes by Vercel Cron
  const job = await getNextJob();
  if (job) {
    await processJob(job); // Must finish in 60s
  }
  return Response.json({ ok: true });
}
```

**Pros**:
- ✅ No credit card
- ✅ Already using Vercel
- ✅ Zero setup

**Cons**:
- ❌ 60-second limit (only fast tools work)
- ❌ No Docker support
- ❌ Not true background processing

**Verdict**: ⚠️ **Hack only** - works for quick tools

---

## 🎯 BEST SOLUTION: Hybrid Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vercel Free) - No credit card ✅                 │
│  - Next.js app                                              │
│  - API routes for job CRUD                                  │
│  - Supabase Realtime                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Database Queue (Supabase Free) - No credit card ✅         │
│  - Job queue                                                │
│  - Results storage                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Runner (Railway.app Free) - No credit card ✅              │
│  - Node.js process                                          │
│  - Polls database                                           │
│  - Runs Docker containers                                   │
└─────────────────────────────────────────────────────────────┘
```

**Total Cost**: **$0**
**Credit Card**: **Not needed**
**Setup Time**: **1-2 hours**

---

## 📋 Step-by-Step: Railway Setup

### Step 1: Create Railway Account (5 minutes)

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign in with **GitHub** (no credit card!)
4. Verify email

### Step 2: Install Railway CLI (2 minutes)

```bash
# Install globally
npm install -g @railway/cli

# Login
railway login

# It will open browser - authorize with GitHub
```

### Step 3: Prepare Runner Code (10 minutes)

Create `runner/` directory:
```bash
mkdir runner
cd runner
npm init -y
npm install @prisma/client dockerode dotenv
```

Create `runner/index.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const Docker = require('dockerode');

const prisma = new PrismaClient();
const docker = new Docker();

async function processQueue() {
  console.log('🚀 Runner started');
  
  while (true) {
    try {
      // Get next job from database
      const job = await prisma.$transaction(async (tx) => {
        const nextJob = await tx.toolJob.findFirst({
          where: { status: 'QUEUED' },
          orderBy: { created_at: 'asc' },
        });

        if (!nextJob) return null;

        return tx.toolJob.update({
          where: { id: nextJob.id },
          data: { status: 'RUNNING', started_at: new Date() },
        });
      });

      if (job) {
        console.log(`Processing job ${job.id}`);
        await runTool(job);
      } else {
        // No jobs, wait 10 seconds
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function runTool(job) {
  try {
    let result;
    
    switch (job.tool_name) {
      case 'SUBFINDER':
        result = await runSubfinder(job.target_input);
        break;
      case 'HTTPX':
        result = await runHttpx(job.target_input);
        break;
      default:
        throw new Error(`Unknown tool: ${job.tool_name}`);
    }

    await prisma.toolJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        result_json: result,
        result_count: result.length,
      },
    });

    console.log(`✅ Job ${job.id} completed`);
  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error);
    
    await prisma.toolJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        completed_at: new Date(),
        error_output: error.message,
      },
    });
  }
}

async function runSubfinder(domain) {
  console.log(`Running Subfinder for ${domain}`);
  
  return new Promise((resolve, reject) => {
    docker.run(
      'projectdiscovery/subfinder:latest',
      ['-d', domain, '-silent'],
      process.stdout,
      { Tty: false },
      (err, data, container) => {
        if (err) return reject(err);
        
        // Parse output
        const output = data.toString();
        const subdomains = output.split('\n').filter(line => line.trim());
        
        container.remove();
        resolve(subdomains);
      }
    );
  });
}

async function runHttpx(input) {
  console.log(`Running Httpx for ${input}`);
  // Similar implementation
  return [];
}

// Start the runner
processQueue();
```

Create `runner/Dockerfile`:
```dockerfile
FROM node:18-alpine

# Install Docker CLI (to communicate with host Docker)
RUN apk add --no-cache docker-cli

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

CMD ["node", "index.js"]
```

### Step 4: Deploy to Railway (5 minutes)

```bash
cd runner

# Initialize Railway project
railway init

# Link to your GitHub repo (optional)
railway link

# Set environment variables
railway variables set DATABASE_URL="your_supabase_url"

# Deploy
railway up
```

**Railway will**:
- ✅ Build your Docker image
- ✅ Deploy to their servers
- ✅ Start your runner
- ✅ Keep it running 24/7 (within free credits)

### Step 5: Monitor (1 minute)

```bash
# View logs
railway logs

# Check status
railway status
```

---

## 💰 Railway Free Tier Breakdown

**Free Credits**: $5/month

**Runner Cost**:
- Small instance: ~$0.0007/hour
- 24/7 for 30 days: $0.0007 × 24 × 30 = **$5.04/month**

**Optimization**:
- Use smallest instance
- Only run when jobs exist (save credits)
- Free tier is enough for ~5-10 jobs/day

**When you exceed free tier**:
- Add credit card and pay
- Or use another service
- Or run locally during development

---

## 🔄 Alternative: Run Locally During Development

### Simplest Solution (For Now)

**Idea**: Run runner on your local machine during development

```bash
# On your Windows machine (with Docker Desktop)
cd runner
npm install
node index.js

# Keep terminal open - runner stays running
```

**Pros**:
- ✅ 100% free
- ✅ No credit card
- ✅ Full Docker access
- ✅ Easy debugging

**Cons**:
- ❌ Only works when your PC is on
- ❌ Not suitable for production
- ❌ Need Docker Desktop on Windows

**Perfect for**:
- MVP development
- Testing
- Demo videos
- Portfolio screenshots

**Later**: Deploy to Railway/Fly.io when ready for "real" users

---

## 🎯 My Recommendation

### For Development (Now):
**Run runner locally** on your Windows machine
- ✅ Free
- ✅ No credit card
- ✅ Full control
- ✅ Easy testing

### For Production (Later):
**Use Railway.app** when you need 24/7 uptime
- ✅ No credit card for trial
- ✅ $5/month credits
- ✅ Easy deployment
- ✅ ~5-10 jobs/day within free tier

### For Scale (Future):
**Get Oracle Cloud** (or similar) when you have:
- Credit card available
- More than 100 users
- Need unlimited jobs

---

## 📋 Revised Action Plan (No Credit Card)

### Week 1: Local Development
1. ✅ Install Docker Desktop on Windows
2. ✅ Create runner service
3. ✅ Test Subfinder locally
4. ✅ Build frontend UI

### Week 2: Polish & Test
1. ✅ Add Httpx integration
2. ✅ Test end-to-end locally
3. ✅ Polish UI
4. ✅ Record demo video

### Week 3: Deploy to Railway (Optional)
1. ⚠️ Deploy runner to Railway.app (no credit card)
2. ⚠️ Test in "production"
3. ⚠️ Monitor free credits usage

### Week 4: Portfolio & Resume
1. ✅ Add to GitHub README
2. ✅ Create demo video
3. ✅ Add to resume
4. ✅ Share on LinkedIn

**Total Cost**: **$0**
**Credit Card**: **Not needed**
**Timeline**: 4 weeks

---

## 🚀 Updated Recommendation

**START with local development:**

1. **This Week**: Build runner + Subfinder locally (free)
2. **Next Week**: Add Httpx, polish UI (free)
3. **Week 3**: Deploy to Railway.app (no credit card, $5 free credits)
4. **Week 4**: Portfolio ready!

**When ready for "real" production:**
- Get a credit card (prepaid cards work)
- Deploy to Railway.app ($7/month)
- Or Oracle Cloud ($0 forever with credit card)

---

## ✅ Final Answer

**For now**: Run locally (Docker Desktop on Windows)
**For demo**: Railway.app (no credit card, $5 free)
**For production**: Railway.app ($7/mo) or Oracle Cloud ($0 with CC)

**Ready to start building the runner locally?** It's the fastest path and 100% free! 🚀



