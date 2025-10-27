# Twitter Video Generator API

A production-ready REST API microservice for generating Twitter/X post video reels with automated rendering, storage, and delivery capabilities.

## Overview

This API service transforms Twitter posts into visually appealing video reels suitable for social media sharing. It uses Puppeteer for browser-based rendering, FFmpeg for video composition, and provides a robust job management system with HMAC-based authentication.

## Features

- **Automated Video Generation** - Convert Twitter posts to MP4 videos with customizable themes
- **Dual Theme Support** - Dark and light themes for visual variety
- **Job Management System** - Track video generation progress with status updates
- **Persistent Storage** - Railway volume integration with automatic cleanup
- **HMAC Authentication** - Secure API endpoints with replay attack prevention
- **Screenshot Rendering** - High-quality browser-based tweet rendering
- **Video Composition** - FFmpeg-powered video assembly with fade effects
- **Health Monitoring** - Built-in health check endpoint
- **Automatic Cleanup** - Scheduled removal of expired files and jobs
- **Security Focused** - Input validation, XSS protection, and timing-safe comparisons

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Request                         │
│              POST /generate-video (HMAC signed)              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express API Server                        │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐    │
│  │   Signature  │  │    Job     │  │   Template       │    │
│  │   Verifier   │─▶│  Manager   │─▶│   Renderer       │    │
│  └──────────────┘  └────────────┘  └──────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Rendering Pipeline                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │  Puppeteer  │─▶│   FFmpeg    │─▶│    Storage       │    │
│  │ Screenshot  │  │ Video Comp. │  │  (Railway Vol.)  │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Response & Download                       │
│         GET /job/:jobId  │  GET /download/:filename          │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

Before running this service, ensure you have the following installed:

### Required Software

- **Node.js 20+** - JavaScript runtime
- **FFmpeg** - Video processing library
- **Chromium** - Headless browser for rendering (installed via Puppeteer)

### Installation of Prerequisites

#### macOS
```bash
# Install Node.js using Homebrew
brew install node

# Install FFmpeg
brew install ffmpeg

# Verify installations
node --version  # Should be 20.x or higher
ffmpeg -version
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install FFmpeg
sudo apt-get update
sudo apt-get install -y ffmpeg

# Install dependencies for Chromium
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils

# Verify installations
node --version
ffmpeg -version
```

#### Railway (Production)
```bash
# Add to Railway environment or use Nixpacks buildpack
# FFmpeg is typically available in Railway environments
# Puppeteer will download Chromium automatically during npm install
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd reel-tweet-render-api
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web framework
- `puppeteer` - Headless browser automation
- `fluent-ffmpeg` - FFmpeg wrapper
- `dotenv` - Environment variable management
- `uuid` - Unique identifier generation
- `cors` - Cross-origin resource sharing
- `axios` - HTTP client

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Storage Configuration
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24

# HMAC Authentication
HMAC_SECRET=your-secret-key-here-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=production

# Base URL (for generating download links)
BASE_URL=https://your-domain.com
```

### 4. Create Storage Directory

```bash
mkdir -p /data/videos
# Or use the path specified in STORAGE_PATH
```

## Running Locally

### Development Mode (with auto-reload)

```bash
npm run dev
```

This starts the server with Nodemon, which automatically restarts on file changes.

### Production Mode

```bash
npm start
```

This starts the server in production mode.

### Running Tests

```bash
npm test
```

This runs the local integration test script.

## Environment Configuration

### Required Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `STORAGE_PROVIDER` | Storage backend type | `local` | `local` |
| `STORAGE_PATH` | Directory for video files | `/data/videos` | `/data/videos` |
| `STORAGE_TTL_HOURS` | File expiration time | `24` | `24` |
| `HMAC_SECRET` | Secret key for HMAC signing | - | `your-secret-key` |
| `PORT` | Server port | `3000` | `3000` |
| `NODE_ENV` | Environment mode | `production` | `development` |
| `BASE_URL` | API base URL | - | `https://api.example.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLEANUP_INTERVAL_HOURS` | Cleanup frequency | `1` |
| `JOB_RETENTION_HOURS` | Job data retention | `24` |
| `MAX_CONCURRENT_JOBS` | Concurrent video generation limit | `5` |

## API Documentation

### Base URL

```
http://localhost:3000
```

### Authentication

All POST endpoints require HMAC-SHA256 authentication with the following headers:

- `X-Signature`: HMAC-SHA256 signature (hex-encoded)
- `X-Timestamp`: Unix timestamp in seconds

### Endpoints

#### 1. Generate Video

Creates a new video generation job.

**Endpoint:** `POST /generate-video`

**Headers:**
```
Content-Type: application/json
X-Signature: <hmac-signature>
X-Timestamp: <unix-timestamp>
```

**Request Body:**
```json
{
  "tweetBody": "This is a sample tweet for video generation",
  "profilePhotoUrl": "https://example.com/avatar.jpg",
  "profileName": "John Doe",
  "username": "johndoe",
  "theme": "dark"
}
```

**Response:** `202 Accepted`
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Video generation job created successfully",
  "statusUrl": "/job/550e8400-e29b-41d4-a716-446655440000"
}
```

**Example Request (Node.js):**
```javascript
const crypto = require('crypto');
const axios = require('axios');

function generateSignature(timestamp, body, secret) {
  const message = `${timestamp}:${JSON.stringify(body)}`;
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

async function generateVideo() {
  const secret = 'your-secret-key';
  const timestamp = Math.floor(Date.now() / 1000);

  const body = {
    tweetBody: "This is a sample tweet",
    profilePhotoUrl: "https://example.com/avatar.jpg",
    profileName: "John Doe",
    username: "johndoe",
    theme: "dark"
  };

  const signature = generateSignature(timestamp, body, secret);

  const response = await axios.post('http://localhost:3000/generate-video', body, {
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': timestamp.toString()
    }
  });

  console.log('Job created:', response.data);
  return response.data.jobId;
}
```

---

#### 2. Get Job Status

Retrieves the status and details of a video generation job.

**Endpoint:** `GET /job/:jobId`

**Parameters:**
- `jobId` - UUID of the job

**Response:** `200 OK`

**Pending Job:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "createdAt": "2025-10-27T12:00:00.000Z",
  "updatedAt": "2025-10-27T12:00:00.000Z",
  "progress": 0,
  "currentStep": null
}
```

**Processing Job:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "createdAt": "2025-10-27T12:00:00.000Z",
  "updatedAt": "2025-10-27T12:00:30.000Z",
  "progress": 50,
  "currentStep": "Rendering tweet"
}
```

**Completed Job:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "createdAt": "2025-10-27T12:00:00.000Z",
  "updatedAt": "2025-10-27T12:01:00.000Z",
  "completedAt": "2025-10-27T12:01:00.000Z",
  "progress": 100,
  "currentStep": "Completed",
  "result": {
    "filename": "2025-10-27_abc123xyz456.mp4",
    "downloadUrl": "https://api.example.com/download/2025-10-27_abc123xyz456.mp4",
    "expiresAt": "2025-10-28T12:01:00.000Z",
    "fileSize": 2048576,
    "duration": 15.5,
    "resolution": "1080x1920"
  }
}
```

**Failed Job:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "createdAt": "2025-10-27T12:00:00.000Z",
  "updatedAt": "2025-10-27T12:00:45.000Z",
  "completedAt": "2025-10-27T12:00:45.000Z",
  "error": {
    "message": "Browser crashed during rendering",
    "stack": "Error: Browser crashed...",
    "failedAt": "2025-10-27T12:00:45.000Z"
  }
}
```

**Example Request:**
```javascript
async function checkJobStatus(jobId) {
  const response = await axios.get(`http://localhost:3000/job/${jobId}`);
  console.log('Job status:', response.data);
  return response.data;
}
```

---

#### 3. Download Video

Downloads a generated video file.

**Endpoint:** `GET /download/:filename`

**Parameters:**
- `filename` - Secure filename (e.g., `2025-10-27_abc123xyz456.mp4`)

**Response:** `200 OK`
- Content-Type: `video/mp4`
- Content-Disposition: `attachment; filename="<filename>"`
- Binary video data

**Error Responses:**
- `404 Not Found` - File not found or expired
- `400 Bad Request` - Invalid filename format

**Example Request:**
```javascript
async function downloadVideo(filename) {
  const response = await axios.get(`http://localhost:3000/download/${filename}`, {
    responseType: 'arraybuffer'
  });

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(`downloaded-${filename}`, response.data);
  console.log('Video downloaded successfully');
}
```

---

#### 4. Health Check

Checks if the API service is running and healthy.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

**Example Request:**
```bash
curl http://localhost:3000/health
```

---

## Authentication (HMAC Signature Generation)

The API uses HMAC-SHA256 signatures to authenticate requests and prevent replay attacks.

### Signature Generation Process

1. **Create the message**: Concatenate timestamp and JSON body
   ```
   message = "{timestamp}:{jsonBody}"
   ```

2. **Generate HMAC**: Use HMAC-SHA256 with your secret key
   ```
   signature = HMAC-SHA256(message, secret)
   ```

3. **Encode as hex**: Convert to hexadecimal string

4. **Add headers**: Include in request headers
   - `X-Signature`: The generated signature
   - `X-Timestamp`: Unix timestamp in seconds

### Example Implementation

#### Node.js
```javascript
const crypto = require('crypto');

function generateSignature(timestamp, body, secret) {
  const message = `${timestamp}:${JSON.stringify(body)}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);
  return hmac.digest('hex');
}

// Usage
const timestamp = Math.floor(Date.now() / 1000);
const body = { tweetBody: "Hello world", username: "user" };
const secret = process.env.HMAC_SECRET;
const signature = generateSignature(timestamp, body, secret);
```

#### Python
```python
import hmac
import hashlib
import json
import time

def generate_signature(timestamp, body, secret):
    message = f"{timestamp}:{json.dumps(body, separators=(',', ':'))}"
    signature = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return signature

# Usage
timestamp = int(time.time())
body = {"tweetBody": "Hello world", "username": "user"}
secret = "your-secret-key"
signature = generate_signature(timestamp, body, secret)
```

#### cURL
```bash
#!/bin/bash

SECRET="your-secret-key"
TIMESTAMP=$(date +%s)
BODY='{"tweetBody":"Hello","username":"user","theme":"dark","profileName":"Test","profilePhotoUrl":"https://example.com/photo.jpg"}'

# Generate signature
SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac "${SECRET}" | awk '{print $2}')

# Make request
curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -H "X-Signature: ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "${BODY}"
```

### Security Considerations

- **Timestamp Validation**: Requests are rejected if timestamp differs by more than 5 minutes from server time
- **Timing-Safe Comparison**: Signatures are compared using constant-time comparison to prevent timing attacks
- **Replay Attack Prevention**: Timestamp validation prevents reuse of old signatures
- **Secret Key Protection**: Never expose your HMAC secret in client-side code or version control

---

## Deployment to Railway

### 1. Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository

### 2. Configure Railway Volume

The application requires a persistent volume for video storage.

**In Railway Dashboard:**

1. Navigate to your service
2. Go to **Settings** → **Volumes**
3. Click **Add Volume**
4. Configure:
   - **Mount Path**: `/data`
   - **Size**: 10GB (or as needed)
5. Click **Create**

### 3. Set Environment Variables

In Railway Dashboard, add the following environment variables:

```env
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24
HMAC_SECRET=<generate-a-secure-random-string>
NODE_ENV=production
BASE_URL=https://your-app.up.railway.app
PORT=3000
```

### 4. Deploy

Railway will automatically:
1. Detect Node.js project
2. Install dependencies
3. Download Chromium via Puppeteer
4. Start the server

### 5. Verify Deployment

```bash
# Check health endpoint
curl https://your-app.up.railway.app/health

# Expected response:
# {"status":"healthy","timestamp":"...","uptime":...}
```

### Volume Structure

After deployment, your volume will have:

```
/data/
└── videos/
    ├── 2025-10-27_abc123xyz456.mp4
    ├── 2025-10-27_abc123xyz456.mp4.meta.json
    ├── 2025-10-27_def789ghi012.mp4
    └── 2025-10-27_def789ghi012.mp4.meta.json
```

### Railway Best Practices

- **Volume Backups**: Railway volumes are persistent but consider regular backups for production
- **Monitoring**: Use Railway's built-in logs and metrics
- **Scaling**: For high traffic, consider adding worker instances
- **Secrets**: Use Railway's secret management, not `.env` files

---

## Testing Instructions

### 1. Local Integration Test

The project includes a test script that verifies the entire pipeline:

```bash
npm test
```

This will:
1. Start a test job
2. Generate HMAC signature
3. Submit video generation request
4. Poll job status
5. Download the completed video
6. Save it to `tmp/test-video.mp4`

### 2. Manual Testing with cURL

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Create Job:**
```bash
# Set your secret
SECRET="your-secret-key"
TIMESTAMP=$(date +%s)
BODY='{"tweetBody":"Test tweet","profileName":"Test User","username":"testuser","theme":"dark","profilePhotoUrl":"https://via.placeholder.com/150"}'

SIGNATURE=$(echo -n "${TIMESTAMP}:${BODY}" | openssl dgst -sha256 -hmac "${SECRET}" | awk '{print $2}')

curl -X POST http://localhost:3000/generate-video \
  -H "Content-Type: application/json" \
  -H "X-Signature: ${SIGNATURE}" \
  -H "X-Timestamp: ${TIMESTAMP}" \
  -d "${BODY}"
```

**Check Status:**
```bash
curl http://localhost:3000/job/<job-id>
```

**Download Video:**
```bash
curl -O http://localhost:3000/download/<filename>
```

### 3. Automated Testing

Run individual utility tests:

```bash
# Test template renderer
node utils/rendering/template-renderer.test.js

# Test job manager
node utils/job-manager-example.js

# Test storage system
node utils/storage/test.js
```

### 4. Load Testing

For production deployments, consider load testing:

```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/health

# Using Artillery
npm install -g artillery
artillery quick --count 10 --num 50 http://localhost:3000/health
```

---

## Project Structure

```
reel-tweet-render-api/
├── README.md                          # This file
├── package.json                       # Dependencies and scripts
├── .env.example                       # Environment variable template
├── STORAGE.md                         # Storage system documentation
│
├── utils/                             # Utility modules
│   ├── job-manager.js                 # Job lifecycle management
│   ├── job-manager-example.js         # Usage examples
│   ├── signature-verifier.js          # HMAC authentication middleware
│   ├── url-generator.js               # Secure URL/filename generation
│   ├── chrome-detector.js             # Chromium binary detection
│   ├── cleanup-scheduler.js           # Automated cleanup scheduler
│   │
│   ├── rendering/                     # Template rendering utilities
│   │   ├── index.js                   # Module exports
│   │   ├── template-renderer.js       # HTML template renderer
│   │   ├── screenshot-generator.js    # Puppeteer screenshot capture
│   │   ├── example-usage.js           # Usage examples
│   │   ├── README.md                  # Rendering documentation
│   │   └── INTEGRATION.md             # Integration guide
│   │
│   ├── video/                         # Video composition utilities
│   │   ├── video-composer.js          # FFmpeg video assembly
│   │   └── ffmpeg-detector.js         # FFmpeg binary detection
│   │
│   └── storage/                       # Storage abstraction layer
│       ├── index.js                   # Module exports
│       ├── factory.js                 # Storage provider factory
│       ├── base.js                    # Base storage interface
│       ├── local.js                   # Local filesystem storage
│       ├── example.js                 # Usage examples
│       └── test.js                    # Storage tests
│
├── tmp/                               # Temporary files (gitignored)
└── claude/                            # Claude-related templates/configs
```

### Key Files

| File | Purpose |
|------|---------|
| `utils/job-manager.js` | Manages video generation jobs with status tracking |
| `utils/signature-verifier.js` | HMAC authentication middleware |
| `utils/rendering/template-renderer.js` | Renders tweet HTML templates |
| `utils/rendering/screenshot-generator.js` | Captures screenshots with Puppeteer |
| `utils/video/video-composer.js` | Assembles videos with FFmpeg |
| `utils/storage/local.js` | Local filesystem storage implementation |
| `utils/url-generator.js` | Generates secure filenames and URLs |
| `utils/cleanup-scheduler.js` | Schedules automatic cleanup tasks |

---

## Technology Stack

### Backend Framework
- **Express.js 4.x** - Fast, minimalist web framework for Node.js
- **Node.js 20+** - JavaScript runtime built on Chrome's V8 engine

### Video Processing
- **Puppeteer 23.x** - Headless Chrome automation for screenshot rendering
- **FFmpeg** - Complete cross-platform solution for video processing
- **fluent-ffmpeg 2.x** - Node.js wrapper for FFmpeg

### Storage & Data
- **Local Filesystem** - Default storage with Railway volume support
- **In-Memory Job Store** - Fast job status tracking with cleanup

### Security
- **HMAC-SHA256** - Cryptographic request signing
- **crypto** (Node.js) - Cryptographic functionality
- **Input Validation** - Comprehensive request validation

### Utilities
- **uuid 9.x** - RFC4122 UUID generation
- **dotenv 16.x** - Environment variable management
- **axios 1.x** - Promise-based HTTP client
- **cors 2.x** - CORS middleware for Express

### Development Tools
- **Nodemon 3.x** - Auto-restart on file changes during development

### Dependencies Overview

```json
{
  "dependencies": {
    "axios": "^1.7.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "fluent-ffmpeg": "^2.1.3",
    "puppeteer": "^23.11.1",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add feature: description"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Code Style

- **Use ES6+ features** where appropriate
- **Follow existing code patterns** for consistency
- **Add comments** for complex logic
- **Use meaningful variable names**
- **Keep functions small and focused**

### Testing Requirements

Before submitting a PR:

1. Run existing tests: `npm test`
2. Add tests for new features
3. Ensure all tests pass
4. Test locally with actual API calls
5. Verify HMAC authentication works

### Documentation

- Update README.md if adding new features
- Add JSDoc comments to new functions
- Include usage examples for new utilities
- Update API documentation for endpoint changes

### Commit Message Convention

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(api): add support for video duration customization
fix(storage): resolve file deletion race condition
docs(readme): update deployment instructions for Railway
refactor(video): optimize FFmpeg rendering pipeline
```

### Pull Request Process

1. Ensure your PR has a clear title and description
2. Reference any related issues
3. Include screenshots/videos for UI changes
4. Wait for code review and address feedback
5. Maintain a clean commit history (squash if needed)

### Reporting Issues

When reporting bugs, include:

- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages and stack traces
- Relevant logs

### Feature Requests

For feature requests, provide:

- Clear use case description
- Expected behavior
- Potential implementation approach
- Any relevant examples or references

---

## License

**MIT License**

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Support

For issues, questions, or contributions:

- **Issues**: Open an issue on GitHub
- **Documentation**: Check the `/utils` subdirectory READMEs for detailed module docs
- **Examples**: Review the `*-example.js` files in the utils directory

## Roadmap

Future enhancements under consideration:

- [ ] Multiple video format support (WebM, AVI)
- [ ] Custom font and styling options
- [ ] Animated profile images support
- [ ] Batch video generation
- [ ] S3/Cloud storage integration
- [ ] Video preview thumbnails
- [ ] Rate limiting per API key
- [ ] Webhook notifications for job completion
- [ ] Admin dashboard for job monitoring
- [ ] Docker containerization

---

**Built with Node.js, Express, Puppeteer, and FFmpeg**

Made with ❤️ and [Claude Code](https://claude.com/claude-code).
