# Quick Start Guide

Get the test script running in under 2 minutes!

## Step 1: Create .env File

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Then edit `.env` and set your HMAC secret:

```bash
# Generate a secure secret
openssl rand -hex 32

# Or use any secure random string (minimum 32 characters)
```

Update your `.env` file:
```bash
HMAC_SECRET=your-generated-secret-here
BASE_URL=http://localhost:3000

# Other settings can use defaults for local testing
STORAGE_PROVIDER=local
STORAGE_PATH=/tmp/videos
STORAGE_TTL_HOURS=24
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Start the API Server

In one terminal:

```bash
npm start
```

You should see:
```
Server started on port 3000
Storage initialized: Local storage at /tmp/videos
```

## Step 4: Run the Test Script

In another terminal:

```bash
npm test
```

Or:

```bash
node scripts/test-local.js
```

## Expected Output

```
============================================================
  Video Generation API - Local Test
============================================================

[1/5] Validating configuration
ℹ Base URL: http://localhost:3000
ℹ HMAC Secret: abc123def4...
✓ Configuration valid

[2/5] Creating video generation request
ℹ Sample tweet data:
  Theme: dark
  Profile: Claude Code (@anthropic)
  Tweet: "Just tested the video generation API..."

[3/5] Submitting request to /generate-video
✓ Job created: 550e8400-e29b-41d4-a716-446655440000
ℹ Status: pending

[4/5] Polling job status
██████████████████████████████ 100% - Processing output
✓ Job completed successfully!
ℹ Filename: tweet-video-123.mp4
ℹ Download URL: http://localhost:3000/download/tweet-video-123.mp4
ℹ File Size: 2.5 MB
ℹ Duration: 15s
ℹ Resolution: 1080x1920

[5/5] Downloading video
██████████████████████████████ 100% - Downloading video
✓ Video downloaded successfully!
ℹ File size: 2.5 MB
ℹ Location: /path/to/project/test-output.mp4

============================================================
  Test Completed Successfully!
============================================================

Total time: 45.23s
Output file: /path/to/project/test-output.mp4
```

The generated video will be saved as `test-output.mp4` in your project root!

## Troubleshooting

### "HMAC_SECRET not found in environment variables"

Create a `.env` file in the project root and add:
```bash
HMAC_SECRET=your-secret-key-here
BASE_URL=http://localhost:3000
```

### "Network Error: No response from server"

Make sure the API server is running:
```bash
npm start
```

### Storage directory errors

Create the storage directory and ensure it's writable:
```bash
mkdir -p /tmp/videos
chmod 755 /tmp/videos
```

Or use a different path in your `.env`:
```bash
STORAGE_PATH=/tmp/videos
```

### Chrome/FFmpeg not found

The script will auto-detect Chrome and FFmpeg. If detection fails:

**macOS:**
```bash
brew install chromium ffmpeg
```

**Linux/Ubuntu:**
```bash
apt-get install chromium ffmpeg
```

## Next Steps

- Customize the tweet data in `scripts/test-local.js`
- Try different themes (dark/light)
- Integrate with your application
- Deploy to production (Railway, Docker, etc.)

For more details, see [scripts/README.md](./README.md)
