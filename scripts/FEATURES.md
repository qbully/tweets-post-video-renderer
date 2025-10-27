# Test Script Features

## Core Functionality

### 1. HMAC Authentication
- **generateSignature()**: Creates HMAC-SHA256 signatures
- Timestamp-based replay attack prevention
- Matches server-side signature verification
- Uses crypto.createHmac() for secure hashing

### 2. API Communication
- **makeAuthenticatedRequest()**: Unified API request handler
- Automatic signature generation for POST requests
- Proper header management (X-Signature, X-Timestamp)
- Comprehensive error handling:
  - HTTP error responses
  - Network failures
  - Request setup errors

### 3. Job Polling
- **pollJobStatus()**: Smart polling with timeout
- 5-second poll interval (configurable)
- 5-minute timeout protection
- Real-time progress updates
- Detects completion and failure states

### 4. Video Download
- **downloadFile()**: Streaming download with progress
- Stream-based for memory efficiency
- Real-time download progress bar
- File size verification
- Proper error handling

### 5. User Experience
- Colored console output (ANSI codes)
- Progress bars with percentage
- Clear step-by-step process (1/5, 2/5, etc.)
- Success/error/warning indicators
- Formatted output (file sizes, timestamps)
- Total execution time tracking

## Error Handling

### Configuration Errors
- Missing .env file detection
- Missing HMAC_SECRET validation
- Invalid BASE_URL detection

### Network Errors
- Server not running detection
- Connection timeout handling
- DNS resolution failures

### API Errors
- 401 Authentication failures
- 404 Not found errors
- 500 Server errors
- Detailed error messages with status codes

### Job Errors
- Job failure detection
- Timeout after 5 minutes
- Clear error message display

### File System Errors
- Download failures
- Write permission errors
- Disk space issues

## Progress Tracking

### Visual Indicators
```
Progress Bar Example:
██████████████████████████████ 100% - Processing output
```

### Status Messages
- Pending: "Job is pending..."
- Processing: Shows current step with progress bar
- Completed: Full success summary
- Failed: Detailed error information

## Security Features

### HMAC Signature
- Uses SHA-256 hashing
- Combines timestamp + JSON body
- Prevents tampering
- Prevents replay attacks (5-minute window)

### No Credentials in Code
- Reads from environment variables
- No hardcoded secrets
- Safe for version control

## Performance Features

### Streaming Download
- Memory efficient
- Handles large files
- Progress tracking
- Error recovery

### Efficient Polling
- Configurable interval (default 5s)
- Timeout protection
- Minimal API calls

## Output Information

### Video Metadata
- Filename
- Download URL
- File size (human-readable)
- Duration (seconds)
- Resolution (width x height)
- Expiration timestamp

### Execution Metrics
- Total execution time
- Download progress
- Processing progress
- Step-by-step timing

## Customization Options

### Environment Variables
```bash
HMAC_SECRET=your-secret      # Required
BASE_URL=http://localhost:3000  # API endpoint
```

### Script Constants
```javascript
POLL_INTERVAL_MS = 5000      # 5 seconds
MAX_TIMEOUT_MS = 300000      # 5 minutes
OUTPUT_FILE = 'test-output.mp4'  # Output location
```

### Sample Data
```javascript
requestBody = {
  theme: 'dark',              # or 'light'
  profilePhotoUrl: 'url',     # Profile image
  profileName: 'Name',        # Display name
  username: 'username',       # Twitter handle
  tweetBody: 'Tweet text'     # Tweet content
}
```

## Exit Codes

- **0**: Success - Video generated and downloaded
- **1**: Failure - Error occurred (details in console)

## Dependencies

### Required
- **axios**: HTTP requests
- **crypto**: HMAC signature generation (built-in)
- **fs**: File system operations (built-in)
- **path**: Path handling (built-in)
- **dotenv**: Environment variable loading

### Optional
- Colors work in all modern terminals
- No external color libraries needed
- Falls back to plain text if colors not supported

## Usage Modes

### 1. Standalone Script
```bash
node scripts/test-local.js
```

### 2. NPM Script
```bash
npm test
```

### 3. Programmatic
```javascript
const { testVideoGeneration } = require('./scripts/test-local');
await testVideoGeneration();
```

## File Output

### Location
- Default: `test-output.mp4` in project root
- Customizable via OUTPUT_FILE constant

### Format
- MP4 video file
- H.264 codec
- Variable bitrate
- Includes audio (if configured)

## Logging Levels

### Info (Blue ℹ)
- Configuration details
- Process information
- Status updates

### Success (Green ✓)
- Successful operations
- Completion messages
- Verification confirmations

### Error (Red ✗)
- Failures
- Exceptions
- Critical issues

### Warning (Yellow ⚠)
- Non-critical issues
- Deprecation notices
- Configuration suggestions

### Progress (Cyan █)
- Download progress
- Processing progress
- Percentage completion

## Integration Examples

### With CI/CD
```yaml
- name: Test API
  run: npm test
  env:
    HMAC_SECRET: ${{ secrets.HMAC_SECRET }}
    BASE_URL: http://localhost:3000
```

### With Docker
```bash
docker run -e HMAC_SECRET=secret \
           -e BASE_URL=http://api:3000 \
           your-image npm test
```

### With Monitoring
```javascript
const { testVideoGeneration } = require('./scripts/test-local');

try {
  await testVideoGeneration();
  // Send success metric
} catch (error) {
  // Send failure alert
}
```

## Future Enhancements

Possible additions:
- Multiple test scenarios
- Performance benchmarking
- Batch testing
- Different tweet templates
- Video quality validation
- Network latency simulation
- Stress testing mode
