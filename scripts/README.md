# Testing Scripts

This directory contains testing and utility scripts for the Video Generation API.

## test-local.js

Local testing script for the video generation API. Tests the complete workflow from request creation to video download.

### Prerequisites

1. Create a `.env` file in the project root with the following variables:
   ```bash
   HMAC_SECRET=your-secret-key-here
   BASE_URL=http://localhost:3000

   # Storage Configuration
   STORAGE_PROVIDER=local
   STORAGE_PATH=/data/videos
   STORAGE_TTL_HOURS=24
   ```

2. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

3. Start the API server:
   ```bash
   npm start
   ```

### Usage

Run the test script using either:

```bash
# Using npm script
npm test

# Or directly with node
node scripts/test-local.js
```

### What It Does

The script performs a complete end-to-end test:

1. **Configuration Validation**
   - Loads environment variables from `.env`
   - Validates HMAC_SECRET and BASE_URL are set
   - Displays configuration summary

2. **Request Creation**
   - Creates a sample tweet with realistic data
   - Generates HMAC-SHA256 signature for authentication
   - Includes timestamp to prevent replay attacks

3. **API Request**
   - POSTs to `/generate-video` endpoint with signed request
   - Receives job ID and initial status
   - Handles authentication and network errors

4. **Job Polling**
   - Polls `/job/:jobId` every 5 seconds
   - Displays real-time progress updates with progress bar
   - Shows current processing step and percentage
   - Continues until job completes or fails
   - Includes 5-minute timeout protection

5. **Video Download**
   - Downloads the generated video from the download URL
   - Shows download progress with percentage
   - Saves to `test-output.mp4` in project root

6. **Results Summary**
   - Displays video metadata (size, duration, resolution)
   - Shows total execution time
   - Indicates success or failure with clear messages

### Output

The script provides colored console output for easy reading:

- **Blue ℹ**: Informational messages
- **Green ✓**: Success messages
- **Red ✗**: Error messages
- **Yellow ⚠**: Warning messages
- **Cyan Progress Bar**: Real-time progress indicators

### Example Output

```
============================================================
  Video Generation API - Local Test
============================================================

[1/5] Validating configuration
ℹ Base URL: http://localhost:3000
ℹ HMAC Secret: my-secret-...
✓ Configuration valid

[2/5] Creating video generation request
ℹ Sample tweet data:
  Theme: dark
  Profile: Claude Code (@anthropic)
  Tweet: "Just tested the video generation API and it wo..."

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

### Error Handling

The script handles various error scenarios:

- **Missing Environment Variables**: Clear error if HMAC_SECRET or BASE_URL not set
- **Network Errors**: Detects if API is not running or unreachable
- **Authentication Errors**: Shows HMAC signature verification failures
- **API Errors**: Displays server error messages with status codes
- **Timeout**: Fails gracefully if job doesn't complete within 5 minutes
- **Download Errors**: Handles file system and network errors during download

### Customization

You can modify the script to test different scenarios:

```javascript
// Change the sample tweet data
const requestBody = {
  theme: 'light',  // or 'dark'
  profilePhotoUrl: 'https://your-image-url.com/photo.jpg',
  profileName: 'Your Name',
  username: 'yourusername',
  tweetBody: 'Your custom tweet text here'
};

// Adjust polling interval (in milliseconds)
const POLL_INTERVAL_MS = 5000;  // 5 seconds

// Adjust timeout (in milliseconds)
const MAX_TIMEOUT_MS = 5 * 60 * 1000;  // 5 minutes

// Change output file location
const OUTPUT_FILE = path.join(__dirname, 'custom-output.mp4');
```

### Programmatic Usage

The script can also be imported and used programmatically:

```javascript
const { testVideoGeneration, generateSignature, makeAuthenticatedRequest } = require('./scripts/test-local');

// Run full test
await testVideoGeneration();

// Generate signature only
const signature = generateSignature(timestamp, body);

// Make authenticated request
const data = await makeAuthenticatedRequest('POST', '/endpoint', body);
```

### Troubleshooting

**"HMAC_SECRET not found in environment variables"**
- Create a `.env` file in the project root
- Add `HMAC_SECRET=your-secret-key` to the file

**"Network Error: No response from server"**
- Ensure the API server is running (`npm start`)
- Check that BASE_URL matches your server configuration
- Verify the server is listening on the correct port

**"API Error (401): HMAC signature verification failed"**
- Ensure the HMAC_SECRET in `.env` matches the server's secret
- Check that your system clock is accurate (timestamps must be within 5 minutes)

**"Timeout: Job did not complete within 5 minutes"**
- Check server logs for errors during processing
- Ensure Chrome/Chromium and FFmpeg are properly installed
- Verify storage path is writable and has sufficient space

### Exit Codes

- `0`: Test completed successfully
- `1`: Test failed (error details displayed in console)
