# Storage Provider Quick Reference

## Quick Start

```javascript
const { createDefaultStorageProvider } = require('./utils/storage');

// Initialize storage
const storage = createDefaultStorageProvider();

// Save a video
const videoBuffer = Buffer.from(videoData);
await storage.save('video-123.mp4', videoBuffer, {
  jobId: '123',
  duration: 15.5,
  resolution: '1080x1920'
});

// Get a video
const buffer = await storage.get('video-123.mp4');

// List all videos
const files = await storage.list();

// Delete a video
await storage.delete('video-123.mp4');

// Cleanup expired files
await storage.cleanupExpiredFiles();
```

## Environment Setup

Create a `.env` file:

```bash
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24
```

## Railway Volume Setup

1. **Create Volume in Railway Dashboard:**
   - Go to your service settings
   - Add a new volume
   - Mount path: `/data`

2. **Configure Environment:**
   ```bash
   STORAGE_PATH=/data/videos
   ```

3. **Deploy:**
   - The storage system will automatically create `/data/videos` on first use
   - Files will persist across deployments

## File Structure

```
/data/videos/
├── video-123.mp4           # Actual video file
├── video-123.mp4.meta.json # Metadata sidecar file
├── video-456.mp4
└── video-456.mp4.meta.json
```

## Automatic Cleanup

Schedule cleanup of expired files:

```javascript
// In your main application
const { createDefaultStorageProvider } = require('./utils/storage');
const storage = createDefaultStorageProvider();

// Run cleanup every hour
setInterval(async () => {
  try {
    const count = await storage.cleanupExpiredFiles();
    console.log(`Cleaned up ${count} expired files`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 60 * 60 * 1000); // 1 hour
```

## API Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `save(filename, buffer, metadata)` | Save a file | `Promise<Object>` |
| `get(filename)` | Retrieve a file | `Promise<Buffer>` |
| `delete(filename)` | Delete a file | `Promise<boolean>` |
| `exists(filename)` | Check if file exists | `Promise<boolean>` |
| `list()` | List all files | `Promise<Array>` |
| `getMetadata(filename)` | Get file metadata | `Promise<Object>` |
| `cleanupExpiredFiles()` | Remove expired files | `Promise<number>` |

## Complete Documentation

See [utils/storage/README.md](./utils/storage/README.md) for complete documentation.

## Example

Run the example:
```bash
node utils/storage/example.js
```
