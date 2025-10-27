# Docker Deployment Guide

This guide covers building and deploying the Twitter Video Generator microservice using Docker.

## Quick Start

### Using Docker Compose (Recommended for Local Development)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Using Docker CLI

```bash
# Build the image
docker build -t twitter-video-generator:latest .

# Run the container
docker run -d \
  --name twitter-video-generator \
  -p 3000:3000 \
  -v video-data:/data/videos \
  -e STORAGE_PROVIDER=local \
  -e STORAGE_PATH=/data/videos \
  -e STORAGE_TTL_HOURS=24 \
  twitter-video-generator:latest

# View logs
docker logs -f twitter-video-generator

# Stop and remove container
docker stop twitter-video-generator
docker rm twitter-video-generator
```

## Image Details

**Base Image:** `node:20-slim`

**Installed System Dependencies:**
- Chromium (for Puppeteer web rendering)
- FFmpeg (for video processing)
- Fonts (Liberation, Noto Color Emoji)
- Required Chromium libraries

**Environment Variables:**
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` - Use system Chromium
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium` - Path to Chromium binary
- `FFMPEG_PATH=/usr/bin/ffmpeg` - Path to FFmpeg binary
- `NODE_ENV=production` - Run in production mode

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example` or set environment variables:

```bash
# Storage Configuration
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24

# Optional: Add your custom environment variables
# API_KEY=your-secret-key
```

### Volumes

The container uses `/data/videos` for video storage. Mount a volume to persist data:

```bash
-v /host/path:/data/videos  # Bind mount
# or
-v video-data:/data/videos  # Named volume
```

## Health Check

The container includes a health check that:
- Checks `/health` endpoint every 30 seconds
- Times out after 10 seconds
- Waits 40 seconds before first check (startup time)
- Marks unhealthy after 3 consecutive failures

Check container health:
```bash
docker inspect --format='{{.State.Health.Status}}' twitter-video-generator
```

## Production Deployment

### Build for Production

```bash
# Build with version tag
docker build -t twitter-video-generator:1.0.0 .

# Tag for registry
docker tag twitter-video-generator:1.0.0 your-registry.com/twitter-video-generator:1.0.0

# Push to registry
docker push your-registry.com/twitter-video-generator:1.0.0
```

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Railway will automatically detect the Dockerfile
3. Add environment variables in Railway dashboard
4. Mount a volume at `/data/videos` for persistent storage
5. Deploy!

### Docker Swarm / Kubernetes

See platform-specific documentation for orchestration deployment.

## Optimization Features

### Layer Caching
- Package files copied before application code
- Dependencies installed in separate layer
- Code changes don't invalidate dependency cache

### Image Size Optimization
- Uses slim base image (~200MB vs ~1GB for full node image)
- Single RUN command for apt packages
- Cleaned apt cache
- Production dependencies only
- `.dockerignore` excludes unnecessary files

### Security Best Practices
- Runs as non-root user (`node`)
- Minimal base image (reduced attack surface)
- Production dependencies only
- Read-only root filesystem (in docker-compose)
- Dropped unnecessary Linux capabilities

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs twitter-video-generator

# Verify Chromium installation
docker exec twitter-video-generator chromium --version

# Verify FFmpeg installation
docker exec twitter-video-generator ffmpeg -version
```

### Permission issues
```bash
# Ensure /data/videos is writable by node user (uid 1000)
docker exec twitter-video-generator ls -la /data/videos
```

### Health check failing
```bash
# Check if server is listening
docker exec twitter-video-generator netstat -tlnp

# Test health endpoint manually
docker exec twitter-video-generator curl http://localhost:3000/health
```

### Puppeteer/Chromium issues
```bash
# Check Chromium path
docker exec twitter-video-generator which chromium

# Test Chromium launch
docker exec twitter-video-generator chromium --no-sandbox --disable-dev-shm-usage --version
```

## Development

### Local Development with Docker

Use docker-compose for development with hot-reload:

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  twitter-video-generator:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

```bash
docker-compose -f docker-compose.dev.yml up
```

## Performance Considerations

### Memory Requirements
- Minimum: 512MB RAM
- Recommended: 1GB+ RAM (Chromium can be memory-intensive)
- Set Docker memory limits if needed:
  ```bash
  docker run --memory="1g" --memory-swap="1g" ...
  ```

### CPU Requirements
- Minimum: 1 CPU core
- Recommended: 2+ CPU cores for concurrent video generation

### Disk Space
- Base image: ~800MB
- Video storage: Varies (configure cleanup via STORAGE_TTL_HOURS)
- Temp files: ~100MB per concurrent job

## Support

For issues related to:
- Docker: Check Docker logs and container health
- Application: See main README.md
- Deployment: Consult your platform documentation
