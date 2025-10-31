# Phase 2: Free & Open Source Implementation Guide

**Goal**: Build Phase 2 with $0 API costs and 100% open-source tools

---

## 🆓 Free Tier Resources

### ✅ What's Already Free

| Resource | Provider | Free Tier | Notes |
|----------|----------|-----------|-------|
| **Frontend Hosting** | Vercel | Unlimited | Already using ✅ |
| **Database** | Supabase | 500MB, 2GB bandwidth | Already using ✅ |
| **Docker Images** | Docker Hub | Unlimited public images | Free forever |
| **Git/CI** | GitHub | Unlimited repos + Actions | Already using ✅ |
| **Domain** | (Optional) | N/A | Can use vercel.app subdomain |

### 🆓 What We Need (Free Options)

| Need | Solution | Cost | Limits |
|------|----------|------|--------|
| **Runner VPS** | Oracle Cloud Free Tier | **$0** | 4 ARM CPUs, 24GB RAM (forever free!) |
| **Job Queue** | PostgreSQL (Supabase) | **$0** | Database-backed queue |
| **Real-time Updates** | Supabase Realtime | **$0** | 2GB bandwidth |
| **Monitoring** | UptimeRobot | **$0** | 50 monitors |
| **Logs** | Better Stack (Logtail) | **$0** | 1GB/month |
| **Error Tracking** | Sentry | **$0** | 5k events/month |

**Total Monthly Cost**: **$0** 🎉

---

## 🎯 Recommended Free Stack

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Vercel Free)                                      │
│  - Next.js app                                              │
│  - API routes for job CRUD                                  │
│  - Supabase Realtime for live updates                       │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│  Database (Supabase Free)                                    │
│  - PostgreSQL for job queue                                 │
│  - Realtime subscriptions                                   │
│  - RLS for security                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓ Polling
┌─────────────────────────────────────────────────────────────┐
│  Runner Service (Oracle Cloud Free)                         │
│  - Node.js process (PM2)                                    │
│  - Polls DB for jobs                                        │
│  - Runs Docker containers                                   │
│  - Updates job status                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓ Docker API
┌─────────────────────────────────────────────────────────────┐
│  Docker Engine (Oracle Cloud VM)                            │
│  - Free ProjectDiscovery tools                             │
│  - No API keys needed                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tools Selection (100% Free & Open Source)

### Tier 1: No API Keys Required ✅

These tools work completely offline with no external APIs:

| Tool | Source | Docker Image | API Key? | Notes |
|------|--------|--------------|----------|-------|
| **Subfinder** | [GitHub](https://github.com/projectdiscovery/subfinder) | `projectdiscovery/subfinder` | ❌ Optional | Works with passive sources (crt.sh, etc.) |
| **Httpx** | [GitHub](https://github.com/projectdiscovery/httpx) | `projectdiscovery/httpx` | ❌ No | Pure HTTP probing |
| **Nuclei** | [GitHub](https://github.com/projectdiscovery/nuclei) | `projectdiscovery/nuclei` | ❌ No | Free templates |
| **Gau** | [GitHub](https://github.com/lc/gau) | Custom build | ⚠️ Optional | Wayback, AlienVault (free APIs) |
| **Katana** | [GitHub](https://github.com/projectdiscovery/katana) | `projectdiscovery/katana` | ❌ No | Web crawler |
| **Naabu** | [GitHub](https://github.com/projectdiscovery/naabu) | `projectdiscovery/naabu` | ❌ No | Port scanner |

**All ProjectDiscovery tools are:**
- ✅ MIT/GPL licensed (free)
- ✅ Actively maintained
- ✅ Production-ready
- ✅ No paid plans required

---

## 🚀 Oracle Cloud Free Tier Setup

### Why Oracle Cloud?

Oracle's "Always Free" tier is **insanely generous**:
- **4 ARM CPUs** (Ampere Altra)
- **24GB RAM**
- **200GB storage**
- **10TB bandwidth/month**
- **Forever free** (not a trial!)

This is **10x better** than AWS/GCP/Azure free tiers.

### Setup Steps

1. **Create Oracle Cloud Account**
   - Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
   - Sign up (credit card required but won't be charged)
   - Choose "Always Free" resources only

2. **Launch ARM Instance**
   ```bash
   # Instance specs:
   - Image: Ubuntu 22.04 ARM
   - Shape: VM.Standard.A1.Flex
   - CPUs: 4 (max for free tier)
   - RAM: 24GB (max for free tier)
   - Storage: 200GB boot volume
   ```

3. **Install Docker**
   ```bash
   ssh ubuntu@<your-oracle-ip>
   
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu
   
   # Install Docker Compose
   sudo apt install docker-compose -y
   
   # Verify
   docker --version
   docker-compose --version
   ```

4. **Install Node.js**
   ```bash
   # Install NVM
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   
   # Install Node 18
   nvm install 18
   nvm use 18
   node --version
   ```

5. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 startup  # Auto-start on reboot
   ```

6. **Configure Firewall**
   ```bash
   # Oracle's default firewall is restrictive
   # We don't need to expose runner to internet
   # Only outbound traffic (to Supabase)
   ```

**Cost**: **$0/month forever** 🎉

---

## 💾 Database-Backed Job Queue

### Why Database Queue?

- ✅ No Redis needed (saves $15-30/month)
- ✅ Already have PostgreSQL (Supabase)
- ✅ Leverages existing RLS policies
- ✅ Simpler architecture
- ✅ Supabase Realtime for instant updates

### Implementation

**Schema** (already in `prisma/schema.prisma`):
```prisma
model ToolJob {
  id              String    @id @default(uuid())
  user_id         String
  tool_name       ToolName
  target_input    String
  status          JobStatus @default(QUEUED)
  result_json     Json?
  // ... rest of fields
}

enum JobStatus {
  QUEUED
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}
```

**Queue Logic** (runner side):
```javascript
// runner/queue.js
async function pollQueue() {
  while (true) {
    // Get next job (with locking to prevent concurrent processing)
    const job = await prisma.$transaction(async (tx) => {
      const nextJob = await tx.toolJob.findFirst({
        where: { status: 'QUEUED' },
        orderBy: [
          { priority: 'asc' },
          { created_at: 'asc' },
        ],
      });

      if (!nextJob) return null;

      // Lock it by setting to RUNNING
      return tx.toolJob.update({
        where: { id: nextJob.id },
        data: {
          status: 'RUNNING',
          started_at: new Date(),
        },
      });
    });

    if (job) {
      await processJob(job);
    } else {
      // No jobs, wait 5 seconds
      await sleep(5000);
    }
  }
}
```

**Frontend Real-time Updates**:
```typescript
// Subscribe to job updates
const channel = supabase
  .channel('job-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'tool_jobs',
      filter: `id=eq.${jobId}`,
    },
    (payload) => {
      setJobStatus(payload.new.status);
      setResults(payload.new.result_json);
    }
  )
  .subscribe();
```

**Cost**: **$0** (included in Supabase free tier)

---

## 🐳 Docker Images (Free)

### Pre-built Images

Most tools have official Docker images:

```yaml
# docker-compose.yml (for local testing)
version: '3.8'

services:
  subfinder:
    image: projectdiscovery/subfinder:latest
    command: -d example.com -o /output/subdomains.txt
    volumes:
      - ./output:/output

  httpx:
    image: projectdiscovery/httpx:latest
    command: -l /input/domains.txt -o /output/live.json -json
    volumes:
      - ./input:/input
      - ./output:/output

  nuclei:
    image: projectdiscovery/nuclei:latest
    command: -u https://example.com -jsonl -o /output/results.json
    volumes:
      - ./output:/output
```

### Custom Images (if needed)

```dockerfile
# Dockerfile for Gau (no official image)
FROM golang:1.21-alpine AS builder
RUN go install github.com/lc/gau/v2/cmd/gau@latest

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /go/bin/gau /usr/local/bin/gau
ENTRYPOINT ["gau"]
```

**Build & Push**:
```bash
docker build -t yourusername/gau:latest .
docker push yourusername/gau:latest  # Free on Docker Hub
```

**Cost**: **$0** (Docker Hub allows unlimited public images)

---

## 📊 Free Monitoring & Logging

### 1. UptimeRobot (Free)
- Monitor runner service uptime
- 50 monitors free
- 5-minute checks

**Setup**:
```bash
# Add health check endpoint in runner
# GET /health
# Returns: { status: 'ok', jobs_processed: 123 }

# Add to UptimeRobot:
# Monitor Type: HTTP(s)
# URL: http://<oracle-ip>:3000/health
# Interval: 5 minutes
```

### 2. Better Stack / Logtail (Free)
- 1GB logs/month free
- 3-day retention
- Real-time log streaming

**Setup**:
```javascript
// runner/logger.js
const { Logtail } = require('@logtail/node');
const logger = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);

logger.info('Job started', { jobId: job.id, tool: job.tool_name });
logger.error('Job failed', { jobId: job.id, error: err.message });
```

### 3. Sentry (Free)
- 5,000 events/month free
- Error tracking
- Performance monitoring

**Setup**:
```javascript
// runner/index.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
});

try {
  await processJob(job);
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

**Total Cost**: **$0**

---

## 🔐 Security (Free Solutions)

### 1. Rate Limiting (Built-in)
```typescript
// Already in database schema
model UserQuota {
  jobs_this_hour  Int
  jobs_hour_reset DateTime
  jobs_today      Int
  jobs_day_reset  DateTime
}

// Check before creating job
if (quota.jobs_this_hour >= 10) {
  throw new Error('Hourly limit exceeded');
}
```

### 2. Input Validation (Free Library)
```bash
npm install validator
```

```javascript
const validator = require('validator');

// Validate domain
if (!validator.isFQDN(input)) {
  throw new Error('Invalid domain');
}

// Validate IP
if (!validator.isIP(input)) {
  throw new Error('Invalid IP');
}
```

### 3. Container Security (Docker Built-in)
```javascript
// Dockerode container config (free)
{
  Memory: 512 * 1024 * 1024, // 512MB
  MemorySwap: 512 * 1024 * 1024,
  NanoCpus: 1000000000, // 1 CPU
  NetworkMode: 'none', // No internet
  SecurityOpt: ['no-new-privileges'],
  ReadonlyRootfs: true,
  User: 'nobody', // Non-root
}
```

**Cost**: **$0**

---

## 🎯 Best Case Scenario Implementation

### Phase 2 Sprint 7-9 (Free Stack)

#### Week 1-2: Foundation
1. ✅ Set up Oracle Cloud VM (free)
2. ✅ Install Docker + Node.js (free)
3. ✅ Deploy runner service (free)
4. ✅ Set up database queue (free - Supabase)
5. ✅ Add health check endpoint (free)
6. ✅ Set up UptimeRobot monitoring (free)

#### Week 3-4: First Tool (Subfinder)
1. ✅ Use official `projectdiscovery/subfinder` image (free)
2. ✅ Implement job processor (no API key needed)
3. ✅ Add Supabase Realtime for live updates (free)
4. ✅ Test end-to-end (free)

#### Week 5-6: Add More Tools
1. ✅ Add Httpx (official image, free, no API key)
2. ✅ Add Nuclei (official image, free, no API key)
3. ✅ Add Gau (build custom image, free, uses free APIs)
4. ✅ Polish UI (free)

**Total Cost**: **$0/month** 🎉

---

## 📈 Scaling (Still Free!)

### Free Tier Limits

**Oracle Cloud Always Free**:
- ✅ 4 ARM CPUs = ~10-15 concurrent jobs
- ✅ 24GB RAM = ~20-30 concurrent containers (512MB each)
- ✅ 10TB bandwidth = ~100k jobs/month
- ✅ Forever free (not a trial)

**Supabase Free**:
- ✅ 500MB database = ~100k jobs stored
- ✅ 2GB bandwidth = ~50k API calls/month
- ✅ Realtime = 2GB/month

**When you'll hit limits**:
- ~1,000 jobs/day
- ~30,000 jobs/month
- ~100-200 active users

**What happens then?**:
- Upgrade Supabase to Pro ($25/month)
- Add more Oracle VMs (still free! can create 2 VMs)
- Or migrate to paid VPS ($24/month for comparable specs)

---

## 🆚 Comparison: Paid vs Free

| Aspect | Paid Stack | Free Stack | Winner |
|--------|------------|------------|--------|
| **Runner VPS** | DigitalOcean $24/mo | Oracle Free | Free 🏆 |
| **Job Queue** | Redis/BullMQ $15/mo | PostgreSQL queue | Free 🏆 |
| **Monitoring** | Datadog $50/mo | UptimeRobot + Sentry | Free 🏆 |
| **Docker Images** | Private registry $5/mo | Docker Hub public | Free 🏆 |
| **Performance** | Faster (Redis) | 95% as fast | Paid (minor) |
| **Complexity** | More components | Simpler | Free 🏆 |
| **Scalability** | Better (to 10k users) | Good (to 1k users) | Depends |
| **Total Cost** | $94/month | $0/month | Free 🏆 |

**Verdict**: Free stack is perfect for MVP and early growth (0-1,000 users)

---

## 🎓 Learning Resources (All Free)

### Docker
- [Docker Tutorial](https://docker-curriculum.com/) - Free
- [Docker Documentation](https://docs.docker.com/) - Free
- [Play with Docker](https://labs.play-with-docker.com/) - Free sandbox

### Dockerode (Node.js Docker API)
- [Dockerode GitHub](https://github.com/apocas/dockerode) - Free
- [Dockerode Examples](https://github.com/apocas/dockerode/tree/master/examples) - Free

### Job Queues
- [Building a Job Queue](https://blog.logrocket.com/build-job-queue-node-js-postgresql/) - Free article

### ProjectDiscovery Tools
- [Subfinder Docs](https://github.com/projectdiscovery/subfinder) - Free
- [Httpx Docs](https://github.com/projectdiscovery/httpx) - Free
- [Nuclei Docs](https://github.com/projectdiscovery/nuclei) - Free

---

## ✅ Action Plan (100% Free)

### Step 1: Set Up Oracle Cloud (30 minutes)
```bash
1. Create account at oracle.com/cloud/free
2. Launch ARM VM (4 CPUs, 24GB RAM)
3. SSH into VM
4. Install Docker + Node.js
```

### Step 2: Deploy Runner (1 hour)
```bash
1. Clone BugTrack repo
2. cd runner/
3. npm install
4. Add .env (Supabase connection)
5. pm2 start index.js --name bugtrack-runner
6. pm2 save
7. pm2 startup
```

### Step 3: Test Subfinder (1 hour)
```bash
1. docker pull projectdiscovery/subfinder
2. Create test job in database
3. Watch runner process it
4. Verify results in database
```

### Step 4: Add Frontend UI (2 hours)
```bash
1. Build /dashboard/tools page
2. Add job submission form
3. Add Supabase Realtime subscription
4. Test end-to-end
```

**Total Time**: ~4-5 hours for MVP
**Total Cost**: **$0** 🎉

---

## 🚀 Recommended Path Forward

### Option 1: Start Small (Recommended)
**Week 1**: Set up Oracle Cloud + deploy runner (no tools yet)
**Week 2**: Get Subfinder working end-to-end
**Week 3**: Add Httpx
**Week 4**: Add Nuclei and polish UI

**Total**: 4 weeks, $0 cost, working tool integration

### Option 2: All at Once
**Week 1-2**: Set up infrastructure + implement all 3 tools
**Week 3**: Polish and test
**Week 4**: Buffer for bugs

**Total**: 4 weeks, $0 cost, faster but riskier

---

## 🎯 My Recommendation

**GO WITH FREE STACK** for these reasons:

1. **$0 cost** - Perfect for portfolio/learning
2. **Same quality** - 95% as good as paid stack
3. **Forever free** - Oracle's Always Free is permanent
4. **Scales well** - Handles 1,000+ users before needing upgrades
5. **Resume-worthy** - "Built serverless security platform with $0 infrastructure cost"
6. **Less risk** - Can always upgrade later if needed

**Start with**:
- Oracle Cloud (free forever)
- PostgreSQL queue (already have Supabase)
- Subfinder (no API key, official Docker image)

**Decision Points**:
- ✅ Queue: Database-backed (free)
- ✅ Deployment: Oracle Cloud (free)
- ✅ Updates: Supabase Realtime (free)
- ✅ Runner: Single VM (free)

---

## 🎊 Summary

**Total Monthly Cost**: **$0**
**Tools**: Subfinder, Httpx, Nuclei (all free, no API keys)
**Infrastructure**: Oracle Cloud (free forever)
**Timeline**: 4-6 weeks
**Resume Impact**: Maximum (shows resourcefulness + technical skills)

Ready to start? Let's set up Oracle Cloud first! 🚀



