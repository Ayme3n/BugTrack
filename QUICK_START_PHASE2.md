# ⚡ Quick Start - Phase 2 Tool Integration

Get up and running in **5 minutes**!

---

## 1️⃣ Install Docker

✅ Download from: https://www.docker.com/products/docker-desktop/  
✅ Start Docker Desktop  
✅ Verify: `docker --version`

---

## 2️⃣ Test Docker with Subfinder

```bash
docker run --rm projectdiscovery/subfinder:latest -d example.com -silent
```

Should output hundreds of subdomains! ✅

---

## 3️⃣ Setup Runner

```bash
cd runner
```

Create `.env`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
```

Start runner:
```bash
npm start
```

Should see:
```
🚀 BugTrack Runner started
📊 Polling every 5s
```

**Keep this terminal open!**

---

## 4️⃣ Test in Browser

1. Go to: `http://localhost:3001/dashboard/tools`  
   (Or whatever port your Next.js dev server is using - check your terminal!)
2. Select "Subfinder"
3. Enter: `example.com`
4. Click "▶️ Run Subfinder"
5. Watch runner terminal process the job!
6. See results in browser (847 subdomains found)

---

## ✅ You're Done!

Phase 2 is **fully functional**! 🎉

Now you have:
- ✅ Docker-based tool execution
- ✅ Job queue system
- ✅ Real-time status updates
- ✅ 3 working security tools
- ✅ Full UI for managing jobs

---

## 🐛 Troubleshooting

**Runner not picking up jobs?**
- Check `.env` file has correct DATABASE_URL
- Make sure runner terminal is still open

**Docker errors?**
- Start Docker Desktop
- Try: `docker ps`

**Jobs stay "QUEUED"?**
- Runner needs to be running
- Check runner terminal for errors

---

## 📚 Full Documentation

- `PHASE2_TESTING_GUIDE.md` - Complete testing guide
- `PHASE2_COMPLETE.md` - What we built
- `runner/README.md` - Runner service details

---

**Ready to add more tools?** See `PHASE2_COMPLETE.md` for how to add new tools in 3 steps!

