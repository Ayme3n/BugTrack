# BugTrack Runner Service

The runner service polls the database for queued tool jobs and executes them using Docker.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Copy Prisma schema:**
   ```bash
   cp ../prisma/schema.prisma ./prisma/schema.prisma
   ```

3. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Supabase `DATABASE_URL`.

5. **Start the runner:**
   ```bash
   npm start
   ```

## How It Works

1. Runner polls database every 5 seconds for `QUEUED` jobs
2. Picks up next job (by priority, then FIFO)
3. Marks job as `RUNNING`
4. Executes Docker container with tool (Subfinder, Httpx, Nuclei)
5. Parses output and stores results
6. Marks job as `COMPLETED` or `FAILED`
7. Creates notification for user
8. Repeats

## Supported Tools

- **Subfinder**: Subdomain enumeration
- **Httpx**: HTTP probing and analysis
- **Nuclei**: Vulnerability scanning

## Resource Usage

- ~100MB RAM
- ~50-200MB per container
- Auto-cleans containers after execution

## Deployment

### Local (Development)
```bash
npm start
```

### Keep Running (Production)
Use PM2 or similar:
```bash
npm install -g pm2
pm2 start index.js --name bugtrack-runner
pm2 save
```

### Railway.app (Free Hosting)
```bash
railway login
railway init
railway up
```

## Monitoring

The runner logs all activity to console:
- 🚀 Startup
- 🔧 Job execution
- ✅ Success
- ❌ Failures
- 📊 Result counts

## Configuration

Edit `POLL_INTERVAL` and `JOB_TIMEOUT` in `index.js` to adjust:
- Poll frequency (default: 5s)
- Job timeout (default: 5min)

