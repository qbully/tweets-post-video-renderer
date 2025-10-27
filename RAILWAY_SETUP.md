# Railway Deployment - Complete Setup Guide

Quick reference for deploying to Railway with the correct environment variables.

## 🚀 Railway Environment Variables

When deploying to Railway, you **MUST** set these environment variables in the Railway dashboard:

### Required Variables

```env
# Security (REQUIRED)
HMAC_SECRET=<generate-a-secure-64-char-hex-string>

# Server Configuration
NODE_ENV=production
PORT=3000

# ⚠️ IMPORTANT: Set this to your Railway app URL!
BASE_URL=https://your-app.railway.app

# Storage Configuration
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24
CLEANUP_INTERVAL_MINUTES=60

# Worker Configuration
MAX_CONCURRENT_JOBS=2
JOB_CLEANUP_HOURS=72
WORKER_POLL_INTERVAL_MS=5000
```

## 📝 Step-by-Step Railway Setup

### Step 1: Generate HMAC Secret

Generate a secure random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - you'll need it for Railway.

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect Node.js and start deploying

### Step 3: Add Volume for Storage

1. In Railway dashboard, go to your service
2. Click **"Settings"** → **"Volumes"**
3. Click **"New Volume"**
4. Configure:
   - **Mount Path:** `/data`
   - **Size:** 10GB (adjust as needed)
5. Click **"Create"**

### Step 4: Set Environment Variables

In Railway dashboard:

1. Go to your service
2. Click **"Variables"** tab
3. Click **"New Variable"** for each of these:

| Variable | Value | Notes |
|----------|-------|-------|
| `HMAC_SECRET` | `<your-generated-secret>` | Use the secret from Step 1 |
| `NODE_ENV` | `production` | Required |
| `BASE_URL` | `https://your-app.railway.app` | ⚠️ **Replace with your actual Railway URL!** |
| `STORAGE_PATH` | `/data/videos` | Must match volume mount path |
| `STORAGE_TTL_HOURS` | `24` | How long to keep videos |
| `MAX_CONCURRENT_JOBS` | `2` | Adjust based on resources |

**Finding Your Railway URL:**
- Look in the Railway dashboard
- Usually: `https://<random-words>.railway.app`
- Or use your custom domain if configured

### Step 5: Deploy

Railway will automatically redeploy when you:
- Push to your connected GitHub branch
- Change environment variables
- Update the configuration

### Step 6: Verify Deployment

Test the health endpoint:

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Twitter Video Generator API",
  "version": "1.0.0",
  "uptime": 123,
  "worker": {
    "running": true,
    "currentJobs": 0,
    "maxConcurrentJobs": 2
  }
}
```

## 🧪 Testing Your Deployment

### Using the Remote Test Script

```bash
# Test your Railway deployment
node scripts/test-remote.js https://your-app.railway.app
```

Make sure your local `.env` has the same `HMAC_SECRET` as Railway!

### Manual cURL Test

```bash
# Set variables
RAILWAY_URL="https://your-app.railway.app"
HMAC_SECRET="your-secret-from-railway"
TIMESTAMP=$(date +%s)
BODY='{"tweetBody":"Testing from Railway!","profileName":"Test User","username":"testuser","theme":"dark","profilePhotoUrl":"https://via.placeholder.com/150"}'

# Generate signature
SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac "${HMAC_SECRET}" | awk '{print $2}')

# Create video job
curl -X POST ${RAILWAY_URL}/generate-video \
  -H "Content-Type: application/json" \
  -H "X-Signature: ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "${BODY}"
```

## ❗ Common Issues

### Issue: Download URLs show "localhost:3000"

**Cause:** `BASE_URL` not set correctly in Railway

**Fix:**
1. Go to Railway dashboard → Variables
2. Check `BASE_URL` is set to your Railway URL (e.g., `https://your-app.railway.app`)
3. NOT `http://localhost:3000`
4. Redeploy if needed

### Issue: Videos not persisting after restart

**Cause:** Volume not configured

**Fix:**
1. Go to Railway → Settings → Volumes
2. Ensure volume is mounted at `/data`
3. Verify `STORAGE_PATH=/data/videos` in environment variables

### Issue: "HMAC authentication failed"

**Cause:** Secret mismatch between client and server

**Fix:**
1. Check local `.env` has the same `HMAC_SECRET` as Railway
2. Copy from Railway → Variables → `HMAC_SECRET`
3. Update your local `.env`

### Issue: Worker not starting

**Check the logs:**
1. Railway dashboard → Deployments → View Logs
2. Look for `[VideoGenerationWorker] Worker initialized`
3. Check for FFmpeg or Chromium errors

## 📊 Monitoring

### View Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Check Resource Usage

In Railway dashboard:
- **Metrics** tab shows CPU, Memory, Network
- Monitor for spikes during video generation
- Adjust `MAX_CONCURRENT_JOBS` if needed

## 🔒 Security Best Practices

1. **Never commit secrets**
   - Keep `HMAC_SECRET` in Railway variables only
   - Don't add to `.env` in git

2. **Use strong secrets**
   - Minimum 32 characters
   - Use cryptographically random generation

3. **Rotate secrets periodically**
   - Change `HMAC_SECRET` every 90 days
   - Update both Railway and client applications

4. **Use HTTPS only**
   - Railway provides HTTPS automatically
   - Never use HTTP in production

## 🎯 Production Checklist

Before going live:

- [ ] `HMAC_SECRET` is set to a secure random value
- [ ] `BASE_URL` is set to your actual Railway URL
- [ ] `NODE_ENV=production`
- [ ] Volume is configured at `/data` (10GB+)
- [ ] Health check returns 200 OK
- [ ] Test video generation works end-to-end
- [ ] Download URLs point to Railway, not localhost
- [ ] Worker is running (check logs)
- [ ] FFmpeg and Chromium working (check logs)

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs** in Railway dashboard
2. **Test locally** first with `npm run dev`
3. **Compare environment variables** between local and Railway
4. **Use test scripts** to verify functionality
5. **Check Railway status** at [status.railway.app](https://status.railway.app)

---

**Quick Deploy:**
```bash
# 1. Generate secret
SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "HMAC_SECRET=$SECRET"

# 2. Push to Railway
git push

# 3. Set variables in Railway dashboard
# 4. Test with:
node scripts/test-remote.js https://your-app.railway.app
```

---

Made with ❤️ and [Claude Code](https://claude.com/claude-code).
