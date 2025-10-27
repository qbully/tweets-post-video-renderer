# Video Generation Worker

Background worker system for processing video generation jobs asynchronously.

## Overview

The `VideoGenerationWorker` is a production-ready background worker that continuously monitors the job queue and processes video generation requests. It handles the complete pipeline from HTML template rendering to video composition and storage.

## Features

- **Concurrent Processing**: Process multiple jobs in parallel with configurable limits
- **Comprehensive Error Handling**: Graceful error recovery and detailed error reporting
- **Progress Tracking**: Real-time progress updates at each processing step
- **Automatic Cleanup**: Temporary files are automatically removed after processing
- **Graceful Shutdown**: Waits for current jobs to complete before stopping
- **Production Logging**: Detailed logs at every step for monitoring and debugging

## Architecture

### Processing Pipeline

Each job goes through the following steps:

1. **Generate Screenshot (20%)** - `generating_screenshot`
   - Render HTML template with job data
   - Generate high-quality screenshot (1080x1920 @ 2x)

2. **Compose Video (60%)** - `composing_video`
   - Initialize FFmpeg video composer
   - Combine screenshot with background audio
   - Apply fade in/out effects
   - Generate final MP4 video (5 seconds)

3. **Save to Storage (80%)** - `saving_file`
   - Generate secure filename with timestamp and hash
   - Save video to configured storage provider
   - Create metadata with expiration time
   - Generate download URL

4. **Complete Job (100%)**
   - Update job status to completed
   - Store result data (filename, URL, size, etc.)
   - Cleanup temporary files

### Error Handling

- All errors are caught and logged with full stack traces
- Failed jobs are marked with error details
- Worker continues processing other jobs after failures
- Temporary files are cleaned up even on failure

## Usage

### Basic Setup

```javascript
const { VideoGenerationWorker } = require('./workers/video-worker');
const { jobManager } = require('./utils/job-manager');
const { createDefaultStorageProvider } = require('./utils/storage');

// Create storage provider
const storageProvider = createDefaultStorageProvider();

// Create worker instance
const worker = new VideoGenerationWorker({
  jobManager: jobManager,
  storageProvider: storageProvider,
  templatePath: '/path/to/template.html',
  audioPath: '/path/to/audio.mp3',
  maxConcurrentJobs: 2,
  pollInterval: 5000,
});

// Start processing jobs
worker.start();

// Stop worker gracefully
await worker.stop();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `jobManager` | Object | *required* | JobManager instance |
| `storageProvider` | Object | *required* | Storage provider instance |
| `templatePath` | String | *required* | Absolute path to HTML template |
| `audioPath` | String | *required* | Absolute path to background music |
| `maxConcurrentJobs` | Number | `2` | Maximum concurrent jobs |
| `pollInterval` | Number | `5000` | Queue polling interval (ms) |

### Environment Variables

The worker uses the following environment variables:

- `STORAGE_TTL_HOURS` - Time-to-live for stored files in hours (default: 24)
- `BASE_URL` - Base URL for generating download URLs (default: http://localhost:3000)

### Creating Jobs

Jobs are created through the JobManager:

```javascript
const jobId = jobManager.createJob({
  tweetBody: 'Your tweet content here',
  profilePhotoUrl: 'https://example.com/avatar.jpg',
  profileName: 'Display Name',
  username: 'username',
  theme: 'dark', // or 'light'
});
```

### Monitoring Job Status

```javascript
// Get job details
const job = jobManager.getJob(jobId);

console.log(job.status);      // pending, processing, completed, failed
console.log(job.progress);    // 0-100
console.log(job.currentStep); // Current processing step
console.log(job.result);      // Result data (when completed)
console.log(job.error);       // Error details (when failed)
```

### Worker Status

```javascript
const status = worker.getStatus();

console.log(status.isRunning);        // Worker running state
console.log(status.currentJobCount);  // Jobs currently processing
console.log(status.processingJobs);   // Array of job IDs
```

## Job Result Schema

When a job completes successfully, the result contains:

```javascript
{
  filename: "2025-10-27_a1b2c3d4e5f6.mp4",
  downloadUrl: "https://api.example.com/download/2025-10-27_a1b2c3d4e5f6.mp4",
  expiresAt: "2025-10-28T22:15:00.000Z",
  fileSize: 1234567,
  duration: 5,
  resolution: "1080x1920"
}
```

## Integration Example

### Express API Integration

```javascript
const express = require('express');
const { VideoGenerationWorker } = require('./workers/video-worker');
const { jobManager } = require('./utils/job-manager');
const { createDefaultStorageProvider } = require('./utils/storage');

const app = express();
const storageProvider = createDefaultStorageProvider();

// Initialize and start worker
const worker = new VideoGenerationWorker({
  jobManager,
  storageProvider,
  templatePath: __dirname + '/templates/tweet-template.html',
  audioPath: __dirname + '/assets/background-music.mp3',
});

worker.start();

// API endpoint to create jobs
app.post('/api/generate', (req, res) => {
  const jobId = jobManager.createJob({
    tweetBody: req.body.tweetBody,
    profilePhotoUrl: req.body.profilePhotoUrl,
    profileName: req.body.profileName,
    username: req.body.username,
    theme: req.body.theme,
  });

  res.json({ jobId });
});

// API endpoint to check job status
app.get('/api/jobs/:jobId', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await worker.stop();
  process.exit(0);
});

app.listen(3000);
```

## Logging

The worker provides detailed logging at every step:

```
[VideoGenerationWorker] Worker initialized with configuration:
  - Template path: /path/to/template.html
  - Audio path: /path/to/audio.mp3
  - Max concurrent jobs: 2
  - Poll interval: 5000ms
  - Storage TTL: 24 hours
  - Base URL: http://localhost:3000

[VideoGenerationWorker] Starting worker...
[VideoGenerationWorker] Worker started successfully
[VideoGenerationWorker] Found 1 pending job(s)
[VideoGenerationWorker] Processing 1 job(s) (2 slots available)
[VideoGenerationWorker] ===== Starting job 123e4567-e89b-12d3-a456-426614174000 =====
[VideoGenerationWorker] Job 123e4567... - Step 1: Generating screenshot
[TemplateRenderer] Loading template from: /path/to/template.html
[TemplateRenderer] Template rendered successfully
[ScreenshotGenerator] Screenshot saved successfully to: /tmp/123e4567...-screenshot.png
[VideoGenerationWorker] Job 123e4567... - Step 2: Composing video
[VideoComposer] Video composition completed successfully
[VideoGenerationWorker] Job 123e4567... - Step 3: Saving to storage
[LocalStorageProvider] Saved file: 2025-10-27_a1b2c3d4e5f6.mp4 (1234567 bytes)
[VideoGenerationWorker] Job 123e4567... - Completed successfully
[VideoGenerationWorker] ===== Job 123e4567... finished successfully =====
```

## Error Examples

### Missing Dependencies

```
[VideoGenerationWorker] Job 123e4567... failed with error: Template file not found at path: /invalid/path
[VideoGenerationWorker] Job 123e4567... marked as failed in job manager
```

### FFmpeg Errors

```
[VideoComposer] FFmpeg error: Invalid file format
[VideoGenerationWorker] Job 123e4567... failed with error: Video composition failed: Invalid file format
```

### Storage Errors

```
[LocalStorageProvider] Failed to save file: Permission denied
[VideoGenerationWorker] Job 123e4567... failed with error: Failed to save file: Permission denied
```

## Best Practices

1. **Resource Management**
   - Set `maxConcurrentJobs` based on available CPU/memory
   - Monitor system resources during peak loads
   - Use appropriate `pollInterval` to balance responsiveness and overhead

2. **Error Handling**
   - Monitor failed jobs and investigate patterns
   - Set up alerting for high failure rates
   - Review logs regularly for error trends

3. **Storage Management**
   - Configure appropriate `STORAGE_TTL_HOURS` based on requirements
   - Implement cleanup scheduler to remove expired files
   - Monitor storage space usage

4. **Production Deployment**
   - Use process managers (PM2, systemd) for automatic restarts
   - Implement health checks to monitor worker status
   - Set up log aggregation and monitoring
   - Handle graceful shutdown signals

## Troubleshooting

### Worker Not Processing Jobs

Check:
- Worker is started: `worker.getStatus().isRunning === true`
- Jobs exist: `jobManager.getJobsByStatus('pending').length > 0`
- Not at capacity: `currentJobCount < maxConcurrentJobs`

### Jobs Failing

Check:
- Template file exists and is readable
- Audio file exists and is readable
- FFmpeg is installed and accessible
- Storage directory has write permissions
- Sufficient disk space in /tmp and storage directory

### Performance Issues

Optimize:
- Reduce `maxConcurrentJobs` if CPU/memory constrained
- Increase `pollInterval` to reduce overhead
- Monitor and optimize storage I/O
- Consider adding dedicated servers for video processing

## Testing

See `video-worker-example.js` for a complete working example.

```bash
# Run example (requires setup)
node workers/video-worker-example.js
```

## License

Part of the reel-tweet-render-api project.
