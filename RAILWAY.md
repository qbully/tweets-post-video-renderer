# Railway Deployment Guide

This guide covers deploying the Twitter Video Generator API to Railway.

## Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed (optional, but recommended)
- Dockerfile present in the repository

## Deployment Configuration

### railway.json

The project includes a `railway.json` file with the following configuration:

- **Builder**: DOCKERFILE (uses the Dockerfile in the repository)
- **Replicas**: 1 instance
- **Restart Policy**: ON_FAILURE with 3 max retries

## Step-by-Step Deployment

### 1. Create New Project

```bash
# Using Railway CLI
railway login
railway init

# Or use the Railway Dashboard
# Visit https://railway.app/new and connect your repository
```

### 2. Set Up Persistent Storage Volume

Railway volumes provide persistent storage that survives deployments and restarts.

**Via Railway Dashboard:**

1. Navigate to your service
2. Go to **Settings** > **Volumes**
3. Click **Add Volume**
4. Configure the volume:
   - **Mount Path**: `/data`
   - **Size**: 1GB minimum (adjust based on your needs)
5. Click **Add** to create the volume

**Important Notes:**
- The volume mount path MUST be `/data`
- The application will automatically create `/data/videos` directory
- Files stored in the volume persist across deployments
- Volume data is NOT lost when you redeploy

### 3. Configure Environment Variables

Set the following environment variables in Railway:

**Required Variables:**

```bash
# Storage Configuration
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24
```

**Setting Variables via Railway Dashboard:**

1. Go to your service
2. Click on **Variables** tab
3. Add each variable with its value
4. Click **Add** for each one

**Setting Variables via Railway CLI:**

```bash
railway variables set STORAGE_PROVIDER=local
railway variables set STORAGE_PATH=/data/videos
railway variables set STORAGE_TTL_HOURS=24
```

### 4. Deploy

**Via Railway CLI:**

```bash
railway up
```

**Via GitHub Integration:**

1. Connect your GitHub repository in Railway Dashboard
2. Railway will automatically deploy on every push to main/master branch

**Via Railway Dashboard:**

1. Click **Deploy** button
2. Railway will build using the Dockerfile and deploy

## Post-Deployment Verification

### 1. Check Service Health

Visit your Railway service URL to verify the API is running:

```bash
curl https://your-service.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T..."
}
```

### 2. Verify Volume Mount

Check the logs to ensure the storage directory was created:

```bash
railway logs
```

Look for messages indicating successful storage initialization.

### 3. Test Storage Functionality

**Check storage status endpoint (if available):**

```bash
curl https://your-service.railway.app/api/storage/status
```

**Test file upload/download:**

```bash
# Test video generation or file upload
curl -X POST https://your-service.railway.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 4. Monitor Disk Usage

Check volume usage in Railway Dashboard:

1. Go to **Settings** > **Volumes**
2. Monitor the usage percentage
3. Increase volume size if needed

## Production Best Practices

### 1. Resource Monitoring

- **CPU/Memory**: Monitor usage in Railway Dashboard
- **Disk Space**: Set up alerts for volume usage (via Railway or custom monitoring)
- **Response Times**: Track API response times

### 2. Environment-Specific Configuration

Consider different TTL settings for production:

```bash
# Shorter TTL for production to save space
STORAGE_TTL_HOURS=12

# Longer TTL for staging/testing
STORAGE_TTL_HOURS=48
```

### 3. Backup Strategy

Railway volumes are persistent but not automatically backed up:

- Implement periodic backups of critical files
- Consider copying important videos to external storage (S3, etc.)
- Document recovery procedures

### 4. Scaling Considerations

Current configuration uses `numReplicas: 1`. When scaling:

- **Multiple replicas**: Requires shared storage (consider S3 or similar)
- **Local storage**: Only works with single instance
- **Future**: Implement S3 storage provider for horizontal scaling

### 5. Security

```bash
# Add security headers and rate limiting
# Configure CORS appropriately for your frontend domain
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 6. Logging

Railway automatically captures stdout/stderr:

- Use `console.log()` for info messages
- Use `console.error()` for errors
- Railway retains logs for 7 days (Pro plan)

### 7. Health Checks

Railway automatically monitors your service. Ensure:

- Service responds to HTTP requests within reasonable time
- Implement `/health` endpoint for health checks
- Service exits with non-zero code on fatal errors

## Troubleshooting

### Volume Not Mounted

**Symptoms**: Storage errors, "ENOENT" errors for `/data/videos`

**Solutions**:
1. Verify volume mount path is exactly `/data` in Railway Dashboard
2. Check `STORAGE_PATH` environment variable is set to `/data/videos`
3. Restart the service after adding volume

### Out of Disk Space

**Symptoms**: "ENOSPC" errors, writes failing

**Solutions**:
1. Reduce `STORAGE_TTL_HOURS` to cleanup files more aggressively
2. Increase volume size in Railway Dashboard
3. Manually trigger cleanup by restarting the service

### Container Build Failures

**Symptoms**: Deployment fails during build

**Solutions**:
1. Check Dockerfile syntax
2. Verify all dependencies are in package.json
3. Check Railway build logs for specific errors

### Application Crashes

**Symptoms**: Service keeps restarting, hits max retries

**Solutions**:
1. Check Railway logs for error messages
2. Verify all environment variables are set correctly
3. Test Dockerfile locally: `docker build -t test . && docker run test`

### Slow Response Times

**Symptoms**: API requests timeout or are very slow

**Solutions**:
1. Check if disk I/O is bottleneck (volume full?)
2. Monitor CPU/memory usage in Railway Dashboard
3. Consider optimizing video generation pipeline
4. Implement request queuing for concurrent requests

## Updating Deployment

### Configuration Changes

After modifying `railway.json`:

```bash
# Changes take effect on next deployment
railway up
```

### Environment Variable Changes

```bash
# Update a variable
railway variables set STORAGE_TTL_HOURS=12

# Service automatically restarts with new values
```

### Code Changes

With GitHub integration:
```bash
git push origin main
# Railway automatically builds and deploys
```

Manual deployment:
```bash
railway up
```

## Monitoring and Maintenance

### Regular Tasks

1. **Weekly**: Check disk usage and logs
2. **Monthly**: Review TTL settings and storage patterns
3. **As needed**: Scale resources based on usage

### Useful Railway CLI Commands

```bash
# View logs
railway logs

# Connect to service shell
railway run bash

# Check service status
railway status

# List environment variables
railway variables

# Open service in browser
railway open
```

## Support Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: [Your GitHub Issues URL]

## Migration from Other Platforms

If migrating from another platform:

1. Export environment variables from old platform
2. Set them in Railway using the methods above
3. Create volume BEFORE first deployment
4. Deploy and verify volume mount works
5. Test thoroughly before switching traffic
6. Update DNS/routing to point to Railway

## Cost Optimization

- Use appropriate volume size (start small, grow as needed)
- Set reasonable TTL to avoid storing files unnecessarily
- Monitor usage to right-size resources
- Single replica is sufficient for most use cases

---

**Last Updated**: 2025-10-27
**Railway.json Schema Version**: Latest
