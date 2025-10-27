# Twitter Video Generator API - Quick Start Guide

Get up and running in 5 minutes! 🚀

---

## Prerequisites Checklist

Before starting, ensure you have:
- ✅ Node.js 20+ installed (`node --version`)
- ✅ FFmpeg installed (`ffmpeg -version`)
- ✅ Chrome or Chromium browser

---

## Installation (3 steps)

### Step 1: Install Dependencies

```bash
cd reel-tweet-render-api
npm install
```

This installs all required packages (~230 dependencies).

### Step 2: Configure Environment

The `.env` file is already created with default values. You just need to verify it:

```bash
cat .env
```

**Important:** The `HMAC_SECRET` is pre-configured for local development. Change it for production!

### Step 3: Add Background Music (Optional)

For testing, you can create a silent audio file:

```bash
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 \
  -q:a 9 -acodec libmp3lame assets/background-music.mp3
```

Or copy your own music file:
```bash
cp /path/to/your/music.mp3 assets/background-music.mp3
```

---

## Running the API

### Development Mode (with auto-reload)

```bash
npm run dev
```

You should see:
```
============================================================
🚀 Twitter Video Generator API
============================================================
Environment:     development
Server URL:      http://localhost:3000
Port:            3000
...
✅ Server ready to accept requests
```

### Production Mode

```bash
npm start
```

---

## Testing the API

### Option 1: Automated Test Script

Open a new terminal and run:

```bash
npm test
```

This will:
1. ✅ Create a video generation job
2. ✅ Poll for completion
3. ✅ Download the generated video
4. ✅ Save as `test-output.mp4`

### Option 2: Manual cURL Test

```bash
# 1. Generate HMAC signature
TIMESTAMP=$(date +%s)
BODY='{"tweetBody":"Hello World!","profilePhotoUrl":"https://via.placeholder.com/150","profileName":"Test User","username":"testuser","theme":"dark"}'
SECRET="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')

# 2. Create job
JOB_ID=$(curl -s -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -H "X-Signature: $SIGNATURE" \
  -H "X-Timestamp: $TIMESTAMP" \
  -d "$BODY" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

echo "Job ID: $JOB_ID"

# 3. Check status
curl http://localhost:3000/job/$JOB_ID

# 4. Wait and check again (repeat until completed)
sleep 30
curl http://localhost:3000/job/$JOB_ID

# 5. Download video (when completed)
DOWNLOAD_URL=$(curl -s http://localhost:3000/job/$JOB_ID | grep -o '"downloadUrl":"[^"]*"' | cut -d'"' -f4)
curl -o video.mp4 "$DOWNLOAD_URL"
```

### Option 3: Health Check

```bash
curl http://localhost:3000/health | jq
```

Expected response:
```json
{
  "status": "ok",
  "service": "Twitter Video Generator API",
  "version": "1.0.0",
  "uptime": 45.2,
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

---

## Validation

Before starting, you can validate your setup:

```bash
node scripts/validate.js
```

This checks:
- ✅ Node.js version
- ✅ All required files
- ✅ Environment variables
- ✅ Background music
- ✅ FFmpeg installation
- ✅ Chromium/Chrome installation
- ✅ Storage directory

Expected output:
```
✅ All checks passed! Your application is ready to run.
```

---

## Video Generation Flow

```
1. Client sends POST /generate-video with tweet data
   └─→ Returns jobId immediately (202 Accepted)

2. Background worker picks up the job
   └─→ 20% - Rendering tweet screenshot...
   └─→ 60% - Composing video with effects...
   └─→ 80% - Saving video file...
   └─→ 100% - Completed!

3. Client polls GET /job/:jobId for status
   └─→ Returns download URL when ready

4. Client downloads video from GET /download/:filename
   └─→ Receives MP4 file (1080x1920, 5 seconds)
```

---

## File Locations

After running the API:

```
reel-tweet-render-api/
├── data/videos/              # Generated videos
│   ├── 2025-10-27_abc123.mp4
│   └── 2025-10-27_abc123.mp4.meta.json
│
├── test-output.mp4          # Test script output
└── node_modules/            # Dependencies (231 packages)
```

---

## Common Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Validate configuration
node scripts/validate.js

# Generate HMAC secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Configuration Files

All configuration is in `.env`:

```env
# Security (REQUIRED for production)
HMAC_SECRET=<change-this-for-production>

# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Storage
STORAGE_PATH=./data/videos
STORAGE_TTL_HOURS=24

# Worker
MAX_CONCURRENT_JOBS=2
```

See `.env.example` for all 60+ configuration options.

---

## Troubleshooting

### Server won't start

```bash
# Check if port is already in use
lsof -i :3000

# Change port
export PORT=3001
npm start
```

### FFmpeg not found

```bash
# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
```

### Chromium not found

```bash
# macOS
brew install --cask chromium

# Linux
sudo apt-get install chromium-browser

# Or use Chrome (already installed)
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Video generation fails

```bash
# Check logs
tail -f logs/app.log  # If configured

# Or check console output for errors

# Common issues:
# 1. Profile photo URL not accessible
# 2. Background music missing (warning, not error)
# 3. Disk space full
```

---

## Next Steps

### For Local Development
1. ✅ Test video generation with `npm test`
2. ✅ Try different tweet content and themes
3. ✅ Monitor logs and job status
4. ✅ Customize configuration in `.env`

### For Production Deployment
1. 📖 Read `DEPLOYMENT.md` for detailed guide
2. 🚀 Deploy to Railway (see `RAILWAY.md`)
3. 🐳 Or use Docker (see `DOCKER.md`)
4. 🔐 Change `HMAC_SECRET` to a secure value
5. 📊 Set up monitoring and alerts

### For Integration
1. 📚 Read API documentation in `README.md`
2. 🔑 Implement HMAC signature generation
3. 🎬 Build your client application
4. 🧪 Test thoroughly with various inputs

---

## Support & Resources

- **Documentation:** `README.md` (main), `DEPLOYMENT.md`, `PROJECT_SUMMARY.md`
- **Examples:** `scripts/test-local.js` (complete working example)
- **Validation:** `scripts/validate.js` (check configuration)
- **API Health:** `http://localhost:3000/health`

---

## Video Specifications

Generated videos will have:
- **Resolution:** 1080x1920 (9:16 vertical)
- **Duration:** 5 seconds
- **Format:** MP4 (H.264 + AAC)
- **File Size:** ~2-4 MB
- **Frame Rate:** 30 fps
- **Effects:** 0.5s fade in/out
- **Audio:** Background music at 30% volume

---

## Development Tips

### Watch Logs
```bash
# Development server shows all logs in console
npm run dev

# Grep for specific events
npm run dev | grep "Job"
npm run dev | grep "Error"
```

### Clean Storage
```bash
# Remove old videos
rm -rf data/videos/*.mp4
rm -rf data/videos/*.json
```

### Reset Everything
```bash
# Stop server (Ctrl+C)
# Remove videos and temp files
rm -rf data/videos/*
rm -f test-output.mp4
rm -rf /tmp/*-screenshot.png
rm -rf /tmp/*-video.mp4

# Restart
npm run dev
```

---

## Success Indicators

You know it's working when:
- ✅ Health endpoint returns `"status": "ok"`
- ✅ Test script completes successfully
- ✅ `test-output.mp4` file is created
- ✅ Video plays correctly (1080x1920, 5 seconds)
- ✅ No errors in console/logs
- ✅ Worker shows "running: true"

---

**You're all set! Start generating videos! 🎬**

For detailed information, see:
- `README.md` - Complete documentation
- `PROJECT_SUMMARY.md` - Project overview
- `DEPLOYMENT.md` - Production deployment guide
