# Storage Provider Architecture

## Overview

The storage system uses a flexible, extensible architecture based on the **Strategy Pattern** with a **Factory** for provider instantiation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Application Layer                            │
│  (API Routes, Video Service, Job Manager, etc.)                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ uses
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Factory Layer                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  createStorageProvider(type, config)                         │   │
│  │  createDefaultStorageProvider()                              │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────────────┘
                         │ creates
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Abstract Base Class                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              StorageProvider (base.js)                       │   │
│  │  - save(filename, buffer, metadata)                          │   │
│  │  - get(filename)                                             │   │
│  │  - delete(filename)                                          │   │
│  │  - exists(filename)                                          │   │
│  │  - list()                                                    │   │
│  │  - getMetadata(filename)                                     │   │
│  └──────────────────────┬───────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────────────┘
                         │ implements
         ┌───────────────┴────────────┬─────────────────┐
         ↓                            ↓                 ↓
┌──────────────────┐      ┌──────────────────┐  ┌────────────────┐
│ LocalStorage     │      │  S3Storage       │  │  GCSStorage    │
│ Provider         │      │  Provider        │  │  Provider      │
│ (local.js)       │      │  (future)        │  │  (future)      │
│                  │      │                  │  │                │
│ - Local FS       │      │  - AWS S3        │  │  - Google CS   │
│ - Railway Volume │      │  - Bucket ops    │  │  - Bucket ops  │
│ - JSON Metadata  │      │  - IAM auth      │  │  - OAuth       │
│ - TTL cleanup    │      │  - Lifecycle     │  │  - Lifecycle   │
└────────┬─────────┘      └──────────────────┘  └────────────────┘
         │
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Filesystem Layer                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  /data/videos/                                               │   │
│  │  ├── video-123.mp4                    ← Video file          │   │
│  │  ├── video-123.mp4.meta.json          ← Metadata sidecar    │   │
│  │  ├── video-456.mp4                                           │   │
│  │  └── video-456.mp4.meta.json                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. StorageProvider (base.js)
**Role:** Abstract base class defining the storage interface

- Enforces consistent API across all storage implementations
- Cannot be instantiated directly (throws error)
- All methods throw "must be implemented" errors
- Acts as a contract for storage providers

**Key Methods:**
- `save()` - Store a file with metadata
- `get()` - Retrieve a file
- `delete()` - Remove a file
- `exists()` - Check file existence
- `list()` - List all files
- `getMetadata()` - Get file metadata

### 2. Factory (factory.js)
**Role:** Provider instantiation and configuration

- Reads environment variables
- Merges default and custom configurations
- Creates appropriate provider based on type
- Extensible for new provider types

**Configuration Priority:**
1. Explicit config parameter (highest)
2. Environment variables
3. Default values (lowest)

**Environment Variables:**
- `STORAGE_PROVIDER` - Provider type
- `STORAGE_PATH` - Storage directory
- `STORAGE_TTL_HOURS` - Time-to-live

### 3. LocalStorageProvider (local.js)
**Role:** Filesystem-based storage implementation

**Features:**
- Async file operations with `fs.promises`
- Automatic directory creation
- JSON sidecar files for metadata
- TTL-based file expiration
- Filename sanitization for security
- Comprehensive error handling
- Detailed logging

**Storage Format:**
```
video-123.mp4           ← Binary video file
video-123.mp4.meta.json ← JSON metadata
{
  "filename": "video-123.mp4",
  "size": 1024000,
  "createdAt": "2025-10-27T21:45:00.000Z",
  "expiresAt": "2025-10-28T21:45:00.000Z",
  "ttlHours": 24,
  "duration": 15.5,
  "resolution": "1080x1920",
  "jobId": "abc-123"
}
```

**Special Methods:**
- `cleanupExpiredFiles()` - Removes files past TTL
- `_ensureDirectory()` - Creates storage dir if needed
- `_getFilePath()` - Sanitizes and resolves paths
- `_isExpired()` - Checks TTL expiration

### 4. Index (index.js)
**Role:** Main module exports

- Exports base class
- Exports all provider implementations
- Exports factory functions
- Single import point for consumers

## Data Flow

### Save Operation
```
User Code
   │
   ↓ storage.save('video.mp4', buffer, {...})
Factory → LocalStorageProvider
   │
   ├─→ Sanitize filename ('video.mp4')
   ├─→ Ensure directory exists (/data/videos/)
   ├─→ Write file (video.mp4)
   ├─→ Prepare metadata (add timestamps, TTL, etc.)
   ├─→ Write metadata (video.mp4.meta.json)
   │
   ↓ return { path, size, filename, metadata }
User Code
```

### Get Operation
```
User Code
   │
   ↓ storage.get('video.mp4')
Factory → LocalStorageProvider
   │
   ├─→ Read metadata (video.mp4.meta.json)
   ├─→ Check expiration (TTL)
   │   ├─→ If expired: delete file, throw error
   │   └─→ If valid: continue
   ├─→ Read file (video.mp4)
   │
   ↓ return Buffer
User Code
```

### Cleanup Operation
```
Scheduled Job / Cron
   │
   ↓ storage.cleanupExpiredFiles()
Factory → LocalStorageProvider
   │
   ├─→ List all files in directory
   ├─→ For each file:
   │   ├─→ Read metadata
   │   ├─→ Check expiration
   │   └─→ If expired: delete file + metadata
   │
   ↓ return count of deleted files
Scheduled Job / Cron
```

## Design Patterns

### 1. Strategy Pattern
- `StorageProvider` is the strategy interface
- `LocalStorageProvider`, `S3StorageProvider`, etc. are concrete strategies
- Allows swapping storage backends at runtime
- Client code is decoupled from implementation details

### 2. Factory Pattern
- `createStorageProvider()` is the factory method
- Encapsulates provider creation logic
- Handles configuration and environment setup
- Makes it easy to add new providers

### 3. Template Method Pattern
- Base class defines the interface template
- Subclasses implement specific behavior
- Ensures consistent API across implementations

## Error Handling Strategy

### Validation Errors
- Throw immediately on invalid input
- Clear, descriptive error messages
- Example: "Buffer is required and must be a Buffer instance"

### File System Errors
- Catch and wrap native errors
- Preserve original error information
- Add context for debugging
- Example: "Failed to save file: EACCES: permission denied"

### Not Found Errors
- Distinguish between file not found (ENOENT) and other errors
- Handle gracefully (return null or throw descriptive error)
- Log warnings for troubleshooting

## Logging Strategy

All log messages follow this format:
```
[LocalStorageProvider] Action: details
```

**Log Levels:**
- `console.log()` - Normal operations (save, get, list)
- `console.warn()` - Non-fatal issues (file not found, expired)
- `console.error()` - Fatal errors (write failures, permissions)

## Security Considerations

### Filename Sanitization
```javascript
// Input:  ../../../etc/passwd
// Output: passwd
const sanitized = path.basename(filename);
```

### Path Validation
- All paths resolved relative to storage directory
- No traversal outside storage root
- Explicit directory creation with `recursive: true`

### Buffer Validation
- Strict type checking for file content
- Reject non-Buffer inputs
- Prevents injection of invalid data

## Extension Guide

### Adding a New Storage Provider

1. **Create Provider Class:**
```javascript
// s3.js
const { StorageProvider } = require('./base');
const AWS = require('aws-sdk');

class S3StorageProvider extends StorageProvider {
  constructor(config) {
    super(config);
    this.s3 = new AWS.S3({...});
    this.bucket = config.bucket;
  }

  async save(filename, buffer, metadata) {
    // S3 implementation
  }

  async get(filename) {
    // S3 implementation
  }

  // ... implement all methods
}

module.exports = { S3StorageProvider };
```

2. **Add to Factory:**
```javascript
// factory.js
const { S3StorageProvider } = require('./s3');

function createStorageProvider(type, config) {
  switch (type) {
    case 'local':
      return new LocalStorageProvider(config);
    case 's3':
      return new S3StorageProvider(config);
    // ...
  }
}
```

3. **Export from Index:**
```javascript
// index.js
const { S3StorageProvider } = require('./s3');

module.exports = {
  S3StorageProvider,
  // ...
};
```

4. **Update Documentation:**
- Add provider to README.md
- Document provider-specific configuration
- Add usage examples

## Testing Strategy

### Unit Tests (test.js)
- Test each method independently
- Test error conditions
- Test edge cases (empty files, long filenames, etc.)
- Test filename sanitization
- Test TTL expiration

### Integration Tests
- Test with actual filesystem
- Test Railway volume mounting
- Test cleanup scheduling
- Test concurrent operations

### Performance Tests
- Large file handling
- Many small files
- Cleanup performance with thousands of files
- Memory usage during operations

## Performance Considerations

### Filesystem I/O
- Use `fs.promises` for non-blocking operations
- Avoid synchronous operations
- Batch operations when possible

### Memory Management
- Stream large files instead of loading entirely
- Clean up buffers after use
- Regular cleanup of expired files

### Caching
- Consider caching frequently accessed metadata
- Invalidate cache on file changes
- Balance memory vs. I/O performance

## Railway Deployment

### Volume Configuration
1. Create volume in Railway dashboard
2. Mount at `/data` (or custom path)
3. Set `STORAGE_PATH=/data/videos`
4. Files persist across deployments

### Environment Setup
```bash
STORAGE_PROVIDER=local
STORAGE_PATH=/data/videos
STORAGE_TTL_HOURS=24
```

### Cleanup Scheduling
```javascript
// In main application startup
const storage = createDefaultStorageProvider();

// Cleanup every 6 hours
setInterval(() => {
  storage.cleanupExpiredFiles()
    .catch(err => console.error('Cleanup failed:', err));
}, 6 * 60 * 60 * 1000);
```

## Future Enhancements

### Planned Features
- [ ] Stream-based file operations for large files
- [ ] Compression support (gzip, brotli)
- [ ] Metadata search/query capabilities
- [ ] File versioning
- [ ] Access control and permissions
- [ ] Storage usage quotas and limits
- [ ] Webhook notifications on file events

### Additional Providers
- [ ] AWS S3
- [ ] Google Cloud Storage
- [ ] Azure Blob Storage
- [ ] DigitalOcean Spaces
- [ ] MinIO (S3-compatible)

### Monitoring
- [ ] Storage usage metrics
- [ ] File access patterns
- [ ] Cleanup statistics
- [ ] Error rate tracking
- [ ] Performance metrics
