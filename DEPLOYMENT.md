# Twitter Video Generator API - Deployment Guide

Complete guide for deploying the Twitter Video Generator API to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Development Setup](#local-development-setup)
3. [Railway Deployment](#railway-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Node.js 20+ installed
- [ ] FFmpeg installed
- [ ] Chromium/Chrome installed
- [ ] Background music file added to `assets/`
- [ ] `.env` file configured with all required variables
- [ ] HMAC_SECRET generated (minimum 32 characters)
- [ ] Storage directory configured and accessible
- [ ] All dependencies installed (`npm install`)
- [ ] Tests passing (`npm test` or `node scripts/validate.js`)

---

## Local Development Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd reel-tweet-render-api
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and set required variables
nano .env
```

**Required variables:**
```env
HMAC_SECRET=your-secure-secret-min-32-chars
BASE_URL=http://localhost:3000
```

### 3. Add Background Music

```bash
# Add your music file (see assets/README.md for sources)
cp /path/to/your/music.mp3 assets/background-music.mp3
```

### 4. Validate Configuration

```bash
node scripts/validate.js
```

### 5. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 6. Test the API

```bash
# Open a new terminal and run
npm test
```

---

## Railway Deployment

### Step 1: Prepare Your Repository

```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the Dockerfile

### Step 3: Configure Volume

1. In your Railway project, go to **Settings**
2. Navigate to **Volumes** tab
3. Click **"New Volume"**
4. Configure:
   - **Mount Path:** `/data`
   - **Size:** 10GB (minimum, adjust based on usage)
5. Click **"Add Volume"**

### Step 4: Set Environment Variables

Go to **Variables** tab and add:

**Required:**
```
HMAC_SECRET=<generate-secure-256-bit-key>
NODE_ENV=production
STORAGE_PATH=/data/videos
```

**Recommended:**
```
BASE_URL=https://your-app.railway.app
STORAGE_TTL_HOURS=24
MAX_CONCURRENT_JOBS=2
CLEANUP_INTERVAL_MINUTES=60
```

**Generate HMAC_SECRET:**
```bash
# Use this command to generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (5-10 minutes)
3. Railway will provide a public URL

### Step 6: Add Background Music

Since Railway doesn't support file uploads during build:

**Option A: Pre-commit to repo (for testing)**
```bash
# Add a test music file
cp test-music.mp3 assets/background-music.mp3
git add assets/background-music.mp3
git commit -m "Add background music"
git push
```

**Option B: Mount via volume (recommended for production)**
1. Use Railway's CLI or SSH to upload
2. Or fetch from CDN/S3 on startup

### Step 7: Verify Deployment

```bash
# Check health endpoint
curl https://your-app.railway.app/health
```

---

## Docker Deployment

### Build Image

```bash
docker build -t twitter-video-generator .
```

### Run Container

```bash
docker run -d \
  --name twitter-video-api \
  -p 3000:3000 \
  -v $(pwd)/data:/data \
  -e HMAC_SECRET=your-secret-key \
  -e NODE_ENV=production \
  twitter-video-generator
```

### Using Docker Compose

```bash
# Edit docker-compose.yml with your settings
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Environment Configuration

### Production Environment Variables

**Core Configuration:**
```env
# Server
NODE_ENV=production
PORT=3000
BASE_URL=https://your-domain.com

# Security (REQUIRED)
HMAC_SECRET=<64-char-hex-string>

# Storage
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24
CLEANUP_INTERVAL_MINUTES=60

# Worker
MAX_CONCURRENT_JOBS=2
JOB_CLEANUP_HOURS=72
WORKER_POLL_INTERVAL_MS=5000

# Video Settings
VIDEO_DURATION=5
VIDEO_WIDTH=1080
VIDEO_HEIGHT=1920
VIDEO_FPS=30
AUDIO_VOLUME=0.3
FADE_DURATION=0.5

# Paths (auto-detected in Docker)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
FFMPEG_PATH=/usr/bin/ffmpeg
BACKGROUND_MUSIC_PATH=/app/assets/background-music.mp3
TWEET_TEMPLATE_PATH=/app/claude/twitter-post-template.html
```

### Generating Secrets

```bash
# Generate HMAC secret (64 hex characters)
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-api-url/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Twitter Video Generator API",
  "version": "1.0.0",
  "uptime": 123.45,
  "worker": {
    "running": true,
    "currentJobs": 0,
    "maxConcurrentJobs": 2
  },
  "jobs": {
    "total": 0,
    "pending": 0,
    "processing": 0,
    "completed": 0,
    "failed": 0
  }
}
```

### 2. Test Video Generation

```bash
# Run the test script
node scripts/test-local.js
```

### 3. Verify Storage

Check that videos are being saved and cleaned up:

```bash
# SSH into Railway or Docker container
ls -lh /data/videos/

# Check logs
railway logs  # For Railway
docker logs twitter-video-api  # For Docker
```

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Server Health**
   - Endpoint: `GET /health`
   - Check every 30 seconds
   - Alert if status ≠ "ok"

2. **Job Queue**
   - Monitor pending/processing job counts
   - Alert if queue backs up (>50 pending)

3. **Storage Space**
   - Monitor `/data/videos` disk usage
   - Alert at 80% capacity
   - Ensure cleanup scheduler is running

4. **Worker Status**
   - Verify worker is processing jobs
   - Check for failed jobs pattern
   - Monitor processing times

### Regular Maintenance

**Daily:**
- Check error logs
- Monitor disk space
- Verify job completion rates

**Weekly:**
- Review failed jobs
- Check for memory leaks (restart if needed)
- Update dependencies (security patches)

**Monthly:**
- Review and adjust TTL settings
- Optimize storage usage
- Performance testing

### Log Monitoring

```bash
# Railway
railway logs --tail

# Docker
docker logs -f twitter-video-api

# Look for these patterns
# ✅ Success: "Video generation completed"
# ⚠️  Warning: "Background music not found"
# ❌ Error: "Failed to generate video"
```

---

## Troubleshooting

### Server Won't Start

**Symptom:** Server exits immediately after startup

**Solutions:**
```bash
# Check logs
railway logs  # or docker logs

# Common issues:
1. Missing HMAC_SECRET
   - Set in environment variables
   - Must be at least 32 characters

2. Port already in use
   - Change PORT environment variable
   - Or stop conflicting service

3. FFmpeg not found
   - Ensure FFmpeg is installed in container
   - Check FFMPEG_PATH environment variable
```

### Video Generation Fails

**Symptom:** Jobs stuck in "processing" or fail immediately

**Solutions:**
```bash
# Check worker logs
grep "Worker" railway.log

# Common issues:
1. Chromium not found
   - Verify Puppeteer can launch browser
   - Check PUPPETEER_EXECUTABLE_PATH

2. FFmpeg not found
   - Test: ffmpeg -version
   - Install or set FFMPEG_PATH

3. Template not found
   - Verify TWEET_TEMPLATE_PATH
   - Check file exists in container

4. Profile photo download fails
   - Verify URL is accessible
   - Check network connectivity
```

### Disk Space Full

**Symptom:** Storage errors, videos can't be saved

**Solutions:**
```bash
# Check disk usage
df -h /data/videos

# Manual cleanup
cd /data/videos
find . -type f -mtime +1 -delete  # Delete files older than 1 day

# Verify cleanup scheduler
# Check logs for "Cleanup scheduler"
# Should see periodic cleanup messages

# Adjust settings
STORAGE_TTL_HOURS=12  # Shorter retention
CLEANUP_INTERVAL_MINUTES=30  # More frequent cleanup
```

### High Memory Usage

**Symptom:** Container crashes, out of memory errors

**Solutions:**
```bash
# Reduce concurrent jobs
MAX_CONCURRENT_JOBS=1

# Increase container memory (Railway)
# Go to Settings > Resources > Memory

# Check for memory leaks
# Monitor with: docker stats twitter-video-api
# Restart if memory grows continuously
```

### Authentication Failures

**Symptom:** 401 errors on API requests

**Solutions:**
```bash
# Verify HMAC signature generation
# Timestamp must be within 5 minutes
# Signature must match server-side calculation

# Test signature generation
node -e "
const crypto = require('crypto');
const secret = 'your-secret';
const timestamp = Math.floor(Date.now()/1000);
const body = JSON.stringify({test: 'data'});
const sig = crypto.createHmac('sha256', secret)
  .update(timestamp + ':' + body)
  .digest('hex');
console.log('Timestamp:', timestamp);
console.log('Signature:', sig);
"

# Common issues:
1. Clock skew - sync system time
2. Wrong secret - verify HMAC_SECRET
3. Body serialization - must match exactly
```

---

## Performance Optimization

### For High Traffic

```env
# Increase concurrent jobs (requires more CPU/memory)
MAX_CONCURRENT_JOBS=4

# Faster polling
WORKER_POLL_INTERVAL_MS=2000

# Shorter retention
STORAGE_TTL_HOURS=12
```

### For Low Resources

```env
# Single job at a time
MAX_CONCURRENT_JOBS=1

# Less frequent polling
WORKER_POLL_INTERVAL_MS=10000

# Aggressive cleanup
STORAGE_TTL_HOURS=6
CLEANUP_INTERVAL_MINUTES=15
```

---

## Support & Resources

- **Documentation:** See README.md
- **API Reference:** See README.md API Documentation section
- **Issue Tracker:** GitHub Issues
- **Docker Hub:** (if publishing images)

---

## Security Best Practices

1. **Never commit .env file**
2. **Rotate HMAC_SECRET periodically**
3. **Use HTTPS only in production**
4. **Set up rate limiting** (see .env.example)
5. **Monitor for suspicious activity**
6. **Keep dependencies updated**
7. **Use Railway secrets** (not environment variables for sensitive data)

---

**Happy Deploying! 🚀**
