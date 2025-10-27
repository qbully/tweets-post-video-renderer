# Storage Provider Utilities

Storage abstraction layer for managing video files with Railway volume support.

## Overview

This module provides a flexible storage system for video files with:
- Multiple storage backend support (local filesystem, extensible to cloud storage)
- Automatic file expiration based on TTL
- Metadata management with JSON sidecar files
- Railway volume optimization
- Comprehensive error handling and logging

## Files

- **base.js** - Abstract StorageProvider base class defining the interface
- **local.js** - LocalStorageProvider implementation for filesystem storage
- **factory.js** - Factory functions for creating storage providers
- **index.js** - Main exports

## Environment Variables

```bash
STORAGE_PROVIDER=local           # Storage provider type (default: local)
STORAGE_PATH=/data/videos        # Storage directory path (default: /data/videos)
STORAGE_TTL_HOURS=24            # File TTL in hours (default: 24)
```

## Usage

### Basic Usage

```javascript
const { createDefaultStorageProvider } = require('./utils/storage');

// Create provider using environment configuration
const storage = createDefaultStorageProvider();

// Save a video file
const buffer = await fs.readFile('video.mp4');
const result = await storage.save('my-video.mp4', buffer, {
  duration: 15.5,
  resolution: '1080x1920',
  format: 'mp4'
});

// Retrieve a file
const videoBuffer = await storage.get('my-video.mp4');

// Check if file exists
const exists = await storage.exists('my-video.mp4');

// Get metadata
const metadata = await storage.getMetadata('my-video.mp4');

// List all files
const files = await storage.list();

// Delete a file
await storage.delete('my-video.mp4');

// Cleanup expired files
const deletedCount = await storage.cleanupExpiredFiles();
```

### Advanced Usage

```javascript
const { createStorageProvider } = require('./utils/storage');

// Create provider with custom configuration
const storage = createStorageProvider('local', {
  storagePath: '/custom/path',
  ttlHours: 48
});

// Save with custom metadata
await storage.save('video.mp4', buffer, {
  jobId: 'abc-123',
  tweetId: '1234567890',
  username: 'johndoe',
  createdBy: 'api-v1',
  format: 'mp4',
  duration: 15.5,
  resolution: '1080x1920'
});
```

### Using Different Providers

```javascript
const { createStorageProvider } = require('./utils/storage');

// Local filesystem (default)
const localStorage = createStorageProvider('local');

// Future cloud storage providers
// const s3Storage = createStorageProvider('s3', { bucket: 'my-bucket' });
// const gcsStorage = createStorageProvider('gcs', { bucket: 'my-bucket' });
```

## API Reference

### StorageProvider (Base Class)

Abstract base class that defines the storage interface.

#### Methods

##### `save(filename, buffer, metadata)`
Saves a file with optional metadata.

- **filename** (string): Name of the file
- **buffer** (Buffer): File content
- **metadata** (Object): Optional metadata object
- **Returns**: Promise<Object> - Save result with path, size, filename, metadata

##### `get(filename)`
Retrieves a file.

- **filename** (string): Name of the file
- **Returns**: Promise<Buffer> - File content

##### `delete(filename)`
Deletes a file and its metadata.

- **filename** (string): Name of the file
- **Returns**: Promise<boolean> - True if deleted

##### `exists(filename)`
Checks if a file exists.

- **filename** (string): Name of the file
- **Returns**: Promise<boolean> - True if exists

##### `list()`
Lists all non-expired files.

- **Returns**: Promise<Array> - Array of file info objects

##### `getMetadata(filename)`
Gets metadata for a file.

- **filename** (string): Name of the file
- **Returns**: Promise<Object> - Metadata object

### LocalStorageProvider

Filesystem-based storage implementation.

#### Additional Methods

##### `cleanupExpiredFiles()`
Removes expired files based on TTL.

- **Returns**: Promise<number> - Number of files deleted

#### Configuration

```javascript
{
  storagePath: '/data/videos',  // Storage directory
  ttlHours: 24                  // Time-to-live in hours
}
```

## Metadata Format

Metadata is stored as JSON sidecar files (`.meta.json`):

```json
{
  "filename": "video-123.mp4",
  "size": 1024000,
  "createdAt": "2025-10-27T21:45:00.000Z",
  "updatedAt": "2025-10-27T21:45:00.000Z",
  "expiresAt": "2025-10-28T21:45:00.000Z",
  "ttlHours": 24,
  "duration": 15.5,
  "resolution": "1080x1920",
  "format": "mp4",
  "jobId": "abc-123"
}
```

## Railway Volume Setup

For Railway deployments:

1. Create a volume in Railway dashboard
2. Mount it at `/data`
3. Set environment variables:
   ```bash
   STORAGE_PROVIDER=local
   STORAGE_PATH=/data/videos
   STORAGE_TTL_HOURS=24
   ```

## Error Handling

All methods throw descriptive errors:

```javascript
try {
  await storage.get('nonexistent.mp4');
} catch (error) {
  // Error: File not found: nonexistent.mp4
  console.error(error.message);
}

try {
  await storage.save('test.mp4', 'not a buffer');
} catch (error) {
  // Error: Buffer is required and must be a Buffer instance
  console.error(error.message);
}
```

## Extending with New Providers

To add a new storage provider (e.g., S3):

1. Create `s3.js` extending `StorageProvider`
2. Implement all required methods
3. Add to `factory.js`:
   ```javascript
   case 's3':
     return new S3StorageProvider(finalConfig);
   ```
4. Export from `index.js`

## Best Practices

1. **Always use the factory**: Use `createStorageProvider()` or `createDefaultStorageProvider()` instead of instantiating directly
2. **Handle errors**: Wrap storage operations in try-catch blocks
3. **Regular cleanup**: Schedule periodic calls to `cleanupExpiredFiles()` to manage disk space
4. **Validate filenames**: The provider sanitizes filenames, but validate before passing
5. **Use metadata**: Store relevant information in metadata for easier file management
6. **Monitor storage**: Check available disk space when using local storage

## Example Integration

```javascript
const { createDefaultStorageProvider } = require('./utils/storage');
const { jobManager } = require('./utils/job-manager');

class VideoService {
  constructor() {
    this.storage = createDefaultStorageProvider();
  }

  async saveVideoForJob(jobId, videoBuffer, videoMetadata) {
    const filename = `${jobId}.mp4`;

    // Save with job metadata
    const result = await this.storage.save(filename, videoBuffer, {
      jobId,
      ...videoMetadata
    });

    // Update job with download info
    jobManager.setJobCompleted(jobId, {
      filename: result.filename,
      downloadUrl: `/api/download/${result.filename}`,
      expiresAt: result.metadata.expiresAt,
      fileSize: result.size,
      duration: videoMetadata.duration,
      resolution: videoMetadata.resolution
    });

    return result;
  }

  async getVideoForJob(jobId) {
    const filename = `${jobId}.mp4`;
    return await this.storage.get(filename);
  }

  async cleanupOldVideos() {
    return await this.storage.cleanupExpiredFiles();
  }
}

module.exports = new VideoService();
```

## Testing

```javascript
const { createStorageProvider } = require('./utils/storage');

async function testStorage() {
  const storage = createStorageProvider('local', {
    storagePath: '/tmp/test-storage',
    ttlHours: 1
  });

  // Test save
  const buffer = Buffer.from('test video content');
  const result = await storage.save('test.mp4', buffer, { test: true });
  console.log('Saved:', result);

  // Test exists
  const exists = await storage.exists('test.mp4');
  console.log('Exists:', exists);

  // Test get
  const retrieved = await storage.get('test.mp4');
  console.log('Retrieved:', retrieved.toString());

  // Test metadata
  const metadata = await storage.getMetadata('test.mp4');
  console.log('Metadata:', metadata);

  // Test list
  const files = await storage.list();
  console.log('Files:', files);

  // Test delete
  await storage.delete('test.mp4');
  console.log('Deleted');
}

testStorage().catch(console.error);
```
