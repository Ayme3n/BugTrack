# Phase 2 Testing Guide

## 🎯 Goal
Test the complete tool integration system end-to-end.

---

## ✅ Prerequisites

Before testing, make sure you have:

1. ✅ Docker Desktop installed and running
2. ✅ Next.js app running (`npm run dev`)
3. ✅ Runner service ready (in `runner/` directory)

---

## 📋 Step-by-Step Testing

### Step 1: Setup the Runner

1. **Navigate to runner directory:**
   ```bash
   cd runner
   ```

2. **Create `.env` file:**
   ```bash
   # Create runner/.env with your Supabase DATABASE_URL
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"
   ```

3. **Start the runner:**
   ```bash
   npm start
   ```

   You should see:
   ```
   🚀 BugTrack Runner started
   📊 Polling every 5s
   ⏱️  Job timeout: 300s
   ```

   **Keep this terminal open!** The runner needs to stay running.

---

### Step 2: Test in Browser

1. **Open your app:**
   ```
   http://localhost:3001/dashboard/tools
   ```
   
   **Note:** Check your `npm run dev` terminal for the actual port. It might be 3000, 3001, or another port if those are in use.

2. **You should see:**
   - Tool selection (Subfinder, Httpx, Nuclei)
   - Job submission form
   - Recent jobs table (empty initially)
   - Runner status info

---

### Step 3: Run Your First Tool

1. **Select "Subfinder"** (should be selected by default)

2. **Enter a target domain:**
   ```
   example.com
   ```

3. **Click "▶️ Run Subfinder"**

4. **What happens:**
   - Frontend creates a job in the database (status: QUEUED)
   - You see "✅ Job queued successfully!" alert
   - Job appears in "Recent Jobs" table with status "QUEUED"

5. **Watch the runner terminal:**
   - Within 5 seconds, runner picks up the job
   - You'll see:
     ```
     🔧 Starting job abc123...
        Tool: SUBFINDER
        Target: example.com
        Docker: projectdiscovery/subfinder:latest
        Args: -d example.com -silent -all
     ```
   - Docker pulls the image (first time only, ~50MB)
   - Subfinder runs and finds subdomains
   - You'll see:
     ```
        ✅ Completed in 15.2s
        📊 Results: 847
     ```

6. **Back in browser:**
   - Job status changes to "RUNNING" → "COMPLETED"
   - Result count appears (e.g., "847")
   - Duration shows (e.g., "15.2s")

7. **Click "View →" to see results:**
   - JSON output with all subdomains
   - Raw terminal output
   - Timeline with timestamps

---

### Step 4: Test Other Tools

#### Test Httpx (HTTP Probing):
1. Select "Httpx"
2. Enter: `https://example.com`
3. Run it
4. Results show HTTP response info (status codes, headers, etc.)

#### Test Nuclei (Vulnerability Scanner):
1. Select "Nuclei"
2. Enter: `https://testphp.vulnweb.com`
3. Run it
4. Results show any vulnerabilities found

---

## 🎉 Success Indicators

You know everything works when:

✅ Runner stays running without errors  
✅ Jobs go from QUEUED → RUNNING → COMPLETED  
✅ Results appear in the UI  
✅ Notifications are created  
✅ Job details page shows full output  
✅ No Docker errors in runner terminal  

---

## 🐛 Troubleshooting

### Runner doesn't pick up jobs
- Check runner terminal for errors
- Verify `.env` file has correct DATABASE_URL
- Make sure runner is actually running
- Check database for QUEUED jobs:
  ```sql
  SELECT * FROM tool_jobs WHERE status = 'QUEUED';
  ```

### Docker errors
- Ensure Docker Desktop is running (whale icon in system tray)
- Try: `docker ps` to verify Docker works
- Pull image manually: `docker pull projectdiscovery/subfinder`

### Jobs stay "QUEUED"
- Runner might not be running
- Check runner terminal for connection errors
- Verify Prisma client is working in runner

### "Unauthorized" errors
- Make sure you're logged in
- Check Supabase RLS policies for `tool_jobs` table

### Jobs timeout
- Default timeout is 5 minutes
- For slow scans (like Nuclei on large sites), increase `JOB_TIMEOUT` in `runner/index.js`

---

## 📊 Monitoring

### Runner Logs
The runner logs everything:
```
🚀 BugTrack Runner started
📊 Polling every 5s
⏱️  Job timeout: 300s

🔧 Starting job abc123...
   Tool: SUBFINDER
   Target: example.com
   Docker: projectdiscovery/subfinder:latest
   Args: -d example.com -silent -all
   ✅ Completed in 15.2s
   📊 Results: 847
```

### Database
Check jobs directly:
```sql
-- All jobs
SELECT id, tool_name, target_input, status, result_count, duration_ms 
FROM tool_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- Running jobs
SELECT * FROM tool_jobs WHERE status = 'RUNNING';

-- Failed jobs
SELECT * FROM tool_jobs WHERE status = 'FAILED';
```

---

## 🚀 Next Steps

Once basic testing works:

1. **Link tools to targets:**
   - When creating a job, select a target from dropdown
   - Results will be linked to that target

2. **Test with real targets:**
   - Use your actual bug bounty targets
   - See subdomain enumeration in action

3. **Import results to findings:**
   - Future feature: automatically create findings from Nuclei vulnerabilities

4. **Deploy runner:**
   - Keep it running 24/7 on Railway.app or your VPS
   - Process jobs even when your laptop is off

---

## 💡 Tips

- **Multiple jobs:** Queue several jobs and watch runner process them one by one
- **Priority:** Lower priority numbers run first (1 = high, 10 = low)
- **Auto-refresh:** Jobs list auto-refreshes every 5 seconds
- **Docker cleanup:** Runner auto-removes containers after execution
- **Resource usage:** Runner uses ~100MB RAM, containers use ~50-200MB each

---

## 🎓 What You Built

You now have:

1. **Job Queue System** - Database-backed job queue
2. **Docker Integration** - Containerized tool execution
3. **Real-time Updates** - Live job status updates
4. **Result Storage** - JSON results stored in database
5. **Notification System** - Users get notified when jobs complete
6. **Scalable Architecture** - Easy to add more tools/runners

**This is a production-ready system!** 🎉

You can:
- Add it to your resume as "Microservices Architecture with Docker"
- Deploy the runner to any cloud provider
- Scale horizontally (run multiple runners)
- Add more tools easily (just update TOOL_CONFIGS)

---

## 📸 Expected Screenshots

### Tools Page:
- Tool selection cards
- Job submission form
- Recent jobs table
- Runner status box

### Job Details Page:
- Job info (tool, target, status, duration)
- Results (JSON output)
- Raw output (terminal text)
- Timeline (created, started, completed)

### Runner Terminal:
- Startup message
- Job processing logs
- Success/error messages
- Real-time output

---

**Ready to test? Let's go! 🚀**

