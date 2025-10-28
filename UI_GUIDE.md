# Web UI Guide - Twitter Video Generator

## 🎨 Complete Web Interface Now Available!

A beautiful, modern web dashboard is now included for easy interaction with the API.

---

## Quick Start

### 1. Start the Server

```bash
npm run dev
```

### 2. Open Your Browser

Navigate to: **http://localhost:3000**

You'll see the dashboard with:
- 🎬 Video creation form
- ⚙️ Settings button
- 📊 Recent jobs list
- 🔌 Connection status indicator

### 3. First-Time Setup

Click **⚙️ Settings** and configure:

**Required:**
- **API Base URL**: `http://localhost:3000` (or your server URL)
- **HMAC Secret**: Copy from your `.env` file

**Optional (saves time later):**
- **Default Display Name**: Your name
- **Default Username**: Your Twitter handle
- **Default Profile Photo URL**: Your profile photo URL

Click **Save Settings** when done.

---

## Creating Your First Video

### Using the Form

1. Fill in the video details:
   - **Display Name** *
   - **Username** * (without @)
   - **Profile Photo URL** *
   - **Tweet Content** * (up to 5000 characters)
   - **Theme** (Dark or Light)

2. Or click **Use Defaults** to auto-fill saved values

3. Click **Generate Video**

4. Watch the progress in "Recent Jobs" section below

5. Click **📥 Download Video** when completed!

---

## Features Overview

### 🎬 Video Creation
- Simple form with all required fields
- Character counter for tweet content
- Theme selector (Dark/Light preview)
- One-click default values
- Form validation before submission

### 📊 Job Management
- **Real-time updates**: Jobs auto-refresh every 5 seconds
- **Progress tracking**: Visual progress bars for processing jobs
- **Job history**: Stores up to 50 recent jobs locally
- **Quick actions**: Download or view details for completed jobs
- **Error display**: Clear error messages for failed jobs

### ⚙️ Settings
- **Persistent storage**: All settings saved in browser localStorage
- **Secure**: HMAC secret stored locally (never sent to server)
- **Easy config**: Simple form interface
- **Reset option**: Restore defaults with one click

### 🔌 Connection Status
- **Live indicator**: Dot shows connection status
- **Auto-check**: Tests connection on page load
- **Color-coded**: Green (connected), Red (disconnected), Gray (checking)

---

## UI Features

### Smart Defaults
Save your profile information once, reuse it forever:
```
Settings → Default Values → Save
Then: Use Defaults button on the form
```

### Job Status Indicators
- 🟡 **PENDING**: Waiting in queue
- 🔵 **PROCESSING**: Video being generated (with progress %)
- 🟢 **COMPLETED**: Ready to download
- 🔴 **FAILED**: Error occurred (with message)

### Toast Notifications
Helpful messages appear in top-right:
- ✅ Success (green)
- ❌ Error (red)
- ℹ️ Info (blue)

### Responsive Design
Works on:
- Desktop browsers
- Tablets
- Mobile devices

---

## How It Works

### Settings Storage
```javascript
// Stored in browser localStorage
{
  "apiUrl": "http://localhost:3000",
  "hmacSecret": "your-secret",
  "defaultProfileName": "John Doe",
  "defaultUsername": "johndoe",
  "defaultProfilePhotoUrl": "https://..."
}
```

### Job History
```javascript
// Last 50 jobs stored locally
[
  {
    "jobId": "550e8400-...",
    "status": "completed",
    "profileName": "John Doe",
    "username": "johndoe",
    "tweetBody": "Hello world!",
    "downloadUrl": "http://...",
    "createdAt": "2025-10-27T..."
  }
]
```

### HMAC Authentication
The UI automatically:
1. Generates HMAC signature using Web Crypto API
2. Adds signature and timestamp to requests
3. Handles authentication transparently

---

## Common Workflows

### Quick Video with Defaults
1. Set up defaults once in Settings
2. Click **Use Defaults**
3. Enter tweet content
4. Click **Generate Video**
5. Done! 🎉

### Batch Creation
1. Create first video
2. Wait for "PROCESSING" status
3. Create next video (no need to wait)
4. All videos process concurrently
5. Download when each completes

### Remote Server Testing
1. Deploy to Railway (or other platform)
2. In Settings, change API URL to your deployed URL
3. Ensure HMAC secret matches
4. Create videos on remote server
5. Download from cloud!

---

## Troubleshooting

### "Cannot connect to API server"
**Causes:**
- Server not running
- Wrong API URL in settings
- CORS issues

**Fix:**
1. Check server is running: `npm run dev`
2. Verify API URL in Settings
3. Check browser console for errors

### "Invalid HMAC signature"
**Causes:**
- HMAC secret doesn't match server
- System clock wrong

**Fix:**
1. Check HMAC_SECRET in server's `.env`
2. Copy exact value to UI Settings
3. Save settings and try again

### Jobs not updating
**Causes:**
- Browser tab inactive
- Network issues

**Fix:**
1. Click **🔄 Refresh** button
2. Check browser console
3. Reload page

### Settings not saving
**Causes:**
- localStorage disabled
- Browser privacy mode

**Fix:**
1. Enable localStorage in browser
2. Exit private/incognito mode
3. Check browser settings

---

## Keyboard Shortcuts

- **Esc** - Close settings modal
- **Tab** - Navigate form fields
- **Enter** (in form) - Submit form

---

## Browser Support

### Fully Supported
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- ES6+ JavaScript
- Web Crypto API
- CSS Grid & Flexbox
- LocalStorage

---

## Development

### File Structure
```
public/
├── index.html       # Main page
├── css/
│   └── styles.css   # Dark theme styles
└── js/
    ├── config.js    # Settings management
    ├── api.js       # API client
    ├── ui.js        # UI utilities
    └── app.js       # Main logic
```

### Customization

**Change Theme Colors:**
Edit `public/css/styles.css`:
```css
:root {
    --primary: #1d9bf0;  /* Change to your color */
    --bg-primary: #000000;
}
```

**Add Features:**
1. Edit JavaScript files in `public/js/`
2. Reload browser (no build step!)

---

## Production Deployment

### Railway
1. Push to Git
2. Deploy to Railway
3. UI automatically served at root: `https://your-app.railway.app/`
4. Configure settings with your Railway URL

### Other Platforms
The UI is just static files served by Express:
- No build step required
- No dependencies needed
- Works anywhere Express runs

---

## Tips & Tricks

### 💡 Pro Tips

1. **Save Time**: Set up defaults once, never type them again
2. **Batch Process**: Create multiple videos at once
3. **Bookmark**: Save the URL for quick access
4. **Share Defaults**: Export settings JSON and share with team
5. **Test Locally**: Perfect your videos locally before using remote API

### 🎨 UI Customization

Want to change colors? Edit these CSS variables:
```css
--primary: #1d9bf0;        /* Buttons, links */
--success: #00ba7c;        /* Success states */
--error: #f4212e;          /* Error states */
--bg-primary: #000000;     /* Background */
```

### 🔒 Security Best Practices

1. **Never share** your HMAC secret
2. **Use HTTPS** in production
3. **Rotate secrets** periodically
4. **Clear localStorage** when changing servers

---

## What You Get

✅ **Modern UI**: Clean, professional dashboard
✅ **No Build Step**: Pure HTML/CSS/JS
✅ **Persistent Settings**: Never lose your config
✅ **Job History**: Track all your generations
✅ **Real-time Updates**: See progress live
✅ **Mobile Friendly**: Works on any device
✅ **Error Handling**: Clear, helpful messages
✅ **Toast Notifications**: Instant feedback
✅ **Connection Status**: Know your API health
✅ **Easy Downloads**: One-click video downloads

---

## Next Steps

1. ✅ Configure your settings
2. ✅ Create your first video
3. ✅ Set up defaults to save time
4. ✅ Deploy to production
5. ✅ Share with your team!

---

**Enjoy your new Twitter Video Generator dashboard!** 🚀

For API documentation, see: `README.md`
For deployment help, see: `DEPLOYMENT.md`
For project overview, see: `PROJECT_SUMMARY.md`
