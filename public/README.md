# Web UI - Twitter Video Generator Dashboard

A clean, modern web interface for the Twitter Video Generator API.

## Features

### ⚙️ Settings Management
- **API Configuration**: Set the base URL for your API server
- **HMAC Authentication**: Configure your secret key
- **Default Values**: Save default profile information for quick video creation
- **Persistent Storage**: All settings saved in browser localStorage

### 🎬 Video Creation
- **Quick Form**: Simple interface to create new videos
- **Default Values**: One-click to fill form with saved defaults
- **Theme Selection**: Choose between dark and light Twitter themes
- **Character Counter**: Real-time count for tweet content
- **Form Validation**: Ensures all required fields are filled

### 📊 Job Management
- **Job History**: View all recent video generation jobs
- **Real-time Status**: Auto-refreshing job status and progress
- **Progress Indicators**: Visual progress bars for processing jobs
- **Download Videos**: One-click download for completed videos
- **Error Handling**: Clear error messages for failed jobs

### 🔌 Connection Status
- **Live Indicator**: Real-time connection status to API server
- **Auto-check**: Automatic health check on startup
- **Visual Feedback**: Color-coded status indicator

## Usage

### 1. Start the Server

```bash
npm run dev
```

### 2. Open the Dashboard

Navigate to: `http://localhost:3000`

### 3. Configure Settings

1. Click **⚙️ Settings** button
2. Enter your **API Base URL** (default: `http://localhost:3000`)
3. Enter your **HMAC Secret** (must match server's `HMAC_SECRET`)
4. (Optional) Set default profile values
5. Click **Save Settings**

### 4. Create a Video

1. Fill in the form:
   - **Display Name**: Profile name to display
   - **Username**: Twitter handle (without @)
   - **Profile Photo URL**: URL to profile photo
   - **Tweet Content**: Your tweet text (up to 5000 characters)
   - **Theme**: Dark or Light mode
2. Click **Use Defaults** to auto-fill saved values (optional)
3. Click **Generate Video**
4. Watch progress in the "Recent Jobs" section
5. Click **📥 Download Video** when complete

## File Structure

```
public/
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # Styles (dark theme)
├── js/
│   ├── config.js       # Settings & localStorage management
│   ├── api.js          # API client with HMAC auth
│   ├── ui.js           # UI utilities & helpers
│   └── app.js          # Main application logic
└── README.md           # This file
```

## Features Breakdown

### Settings (config.js)
- Load/save configuration to localStorage
- Default values management
- Validation checking
- Job history tracking (up to 50 jobs)

### API Client (api.js)
- HMAC-SHA256 signature generation using Web Crypto API
- Authenticated requests to API endpoints
- Job polling with progress callbacks
- Connection testing

### UI Utilities (ui.js)
- Toast notifications (success, error, info)
- Modal management
- Time formatting (relative)
- File size formatting
- Job card rendering

### Application Logic (app.js)
- Event handling
- Form management
- Job creation & polling
- Settings persistence
- Connection status monitoring

## Local Storage

The UI uses browser localStorage to save:

1. **Configuration** (`twitter_video_gen_config`):
   - API URL
   - HMAC Secret
   - Default profile values

2. **Job History** (`twitter_video_gen_jobs`):
   - Recent jobs (max 50)
   - Job status and progress
   - Download URLs

## Security Notes

- HMAC secret is stored in browser localStorage
- Never commit localStorage data
- Use HTTPS in production
- Keep HMAC secret secure

## Browser Compatibility

Requires modern browsers with support for:
- ES6+ JavaScript
- Web Crypto API (for HMAC signing)
- CSS Grid & Flexbox
- Local Storage

## Troubleshooting

### "Cannot connect to API server"
- Ensure server is running (`npm run dev`)
- Check API URL in settings
- Verify CORS is enabled on server

### "Invalid HMAC signature"
- Verify HMAC secret matches server
- Check timestamp (must be within 5 minutes)

### Settings not saving
- Check browser localStorage is enabled
- Try clearing localStorage and reconfiguring

### Jobs not updating
- Check browser console for errors
- Verify API connection
- Try refreshing the jobs list

## Development

To modify the UI:

1. Edit HTML in `public/index.html`
2. Edit styles in `public/css/styles.css`
3. Edit JavaScript in `public/js/*.js`
4. Reload browser to see changes (no build step required)

## Production Deployment

The UI is served as static files from the `/public` directory. No build step required.

For Railway/production:
1. Ensure `public/` directory is included in deployment
2. Server automatically serves static files from `/public`
3. Access UI at your domain root: `https://your-app.railway.app/`

## Screenshots

### Main Dashboard
- Clean, modern dark theme
- Video creation form
- Job history with real-time updates

### Settings Modal
- Easy configuration
- Default values management
- Persistent storage

### Job Status
- Visual progress indicators
- Download buttons
- Error messages

---

**Built with vanilla JavaScript - No frameworks required!** 🚀
