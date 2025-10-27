# TemplateRenderer Integration Guide

Quick guide for integrating the TemplateRenderer into your application.

## Quick Start

```javascript
const { TemplateRenderer } = require('./utils/rendering/template-renderer');

// 1. Initialize once (e.g., at application startup)
const renderer = new TemplateRenderer('/path/to/template.html');

// 2. Use in your routes/handlers
app.post('/render-tweet', async (req, res) => {
  try {
    const html = await renderer.render({
      theme: req.body.theme || 'dark',
      profilePhotoUrl: req.body.profilePhotoUrl,
      profileName: req.body.profileName,
      username: req.body.username,
      tweetBody: req.body.tweetBody
    });

    res.send(html);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Express.js Integration

```javascript
const express = require('express');
const { TemplateRenderer } = require('./utils/rendering/template-renderer');
const path = require('path');

const app = express();
app.use(express.json());

// Initialize renderer at startup
const templatePath = path.join(__dirname, 'claude/twitter-post-template.html');
const renderer = new TemplateRenderer(templatePath);

// Pre-load template to avoid first-request delay
renderer.loadTemplate().then(() => {
  console.log('Template pre-loaded and cached');
});

// Endpoint to render tweets
app.post('/api/render-tweet', async (req, res) => {
  try {
    const { theme, profilePhotoUrl, profileName, username, tweetBody } = req.body;

    const html = await renderer.render({
      theme,
      profilePhotoUrl,
      profileName,
      username,
      tweetBody
    });

    res.type('html').send(html);
  } catch (error) {
    res.status(400).json({
      error: 'Rendering failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    templateCached: renderer.isCached()
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API Endpoint Example

### Request

```http
POST /api/render-tweet
Content-Type: application/json

{
  "theme": "dark",
  "profilePhotoUrl": "https://example.com/profile.jpg",
  "profileName": "John Doe",
  "username": "johndoe",
  "tweetBody": "This is my tweet!"
}
```

### Response (Success)

```http
HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
<html lang="en">
...rendered HTML...
</html>
```

### Response (Error)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Rendering failed",
  "message": "Missing required fields: profilePhotoUrl"
}
```

## With Screenshot Generation

Combine with Puppeteer for screenshot generation:

```javascript
const { TemplateRenderer } = require('./utils/rendering/template-renderer');
const puppeteer = require('puppeteer');

async function generateTweetImage(tweetData) {
  // 1. Render HTML
  const renderer = new TemplateRenderer('./template.html');
  const html = await renderer.render(tweetData);

  // 2. Take screenshot
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.setViewport({ width: 1080, height: 1920 });

  const screenshot = await page.screenshot({
    type: 'png',
    fullPage: true
  });

  await browser.close();
  return screenshot;
}
```

## Environment-Specific Configuration

### Development

```javascript
const isDev = process.env.NODE_ENV !== 'production';

const renderer = new TemplateRenderer(templatePath);

if (isDev) {
  // Clear cache on each request in development
  app.use((req, res, next) => {
    renderer.clearCache();
    next();
  });
}
```

### Production

```javascript
// Pre-load and cache template at startup
const renderer = new TemplateRenderer(templatePath);

app.listen(PORT, async () => {
  await renderer.loadTemplate();
  console.log('Template pre-loaded for production');
});
```

## Error Handling Best Practices

```javascript
async function renderTweet(data) {
  try {
    return await renderer.render(data);
  } catch (error) {
    // Log error for debugging
    console.error('Render error:', error);

    // Return user-friendly error
    if (error.message.includes('Missing required fields')) {
      throw new Error('Invalid tweet data provided');
    } else if (error.message.includes('Invalid theme')) {
      throw new Error('Theme must be "dark" or "light"');
    } else {
      throw new Error('Failed to render tweet');
    }
  }
}
```

## Validation Middleware

```javascript
function validateTweetData(req, res, next) {
  const { theme, profilePhotoUrl, profileName, username, tweetBody } = req.body;

  // Check required fields
  if (!theme || !profilePhotoUrl || !profileName || !username || !tweetBody) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['theme', 'profilePhotoUrl', 'profileName', 'username', 'tweetBody']
    });
  }

  // Validate theme
  if (!['dark', 'light'].includes(theme)) {
    return res.status(400).json({
      error: 'Invalid theme',
      message: 'Theme must be "dark" or "light"'
    });
  }

  // Validate URL format
  try {
    new URL(profilePhotoUrl);
  } catch {
    return res.status(400).json({
      error: 'Invalid profilePhotoUrl',
      message: 'Must be a valid URL'
    });
  }

  next();
}

app.post('/api/render-tweet', validateTweetData, async (req, res) => {
  // Handler code...
});
```

## Testing Integration

```javascript
const request = require('supertest');
const app = require('./app');

describe('Tweet Rendering API', () => {
  it('should render a tweet with valid data', async () => {
    const response = await request(app)
      .post('/api/render-tweet')
      .send({
        theme: 'dark',
        profilePhotoUrl: 'https://example.com/photo.jpg',
        profileName: 'Test User',
        username: 'testuser',
        tweetBody: 'Test tweet'
      });

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toContain('Test User');
    expect(response.text).toContain('testuser');
  });

  it('should return error for missing fields', async () => {
    const response = await request(app)
      .post('/api/render-tweet')
      .send({ theme: 'dark' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
```

## Performance Considerations

1. **Initialize Once**: Create the TemplateRenderer instance once at application startup
2. **Pre-load Template**: Call `loadTemplate()` during initialization to avoid first-request delay
3. **Keep Cache**: Don't clear cache in production unless template changes
4. **Monitor Memory**: Template cache is small (~5KB), but monitor if using multiple templates

## Monitoring

```javascript
// Add metrics
let renderCount = 0;
let errorCount = 0;

app.post('/api/render-tweet', async (req, res) => {
  const startTime = Date.now();

  try {
    const html = await renderer.render(req.body);
    renderCount++;

    const duration = Date.now() - startTime;
    console.log(`Render successful in ${duration}ms`);

    res.type('html').send(html);
  } catch (error) {
    errorCount++;
    console.error('Render failed:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  res.json({
    renders: renderCount,
    errors: errorCount,
    errorRate: errorCount / (renderCount + errorCount),
    templateCached: renderer.isCached()
  });
});
```

## Common Issues

### Issue: Template not found
**Solution**: Use absolute paths with `path.join(__dirname, ...)`

### Issue: First request is slow
**Solution**: Pre-load template at startup with `await renderer.loadTemplate()`

### Issue: Template not updating
**Solution**: Clear cache in development or restart application

### Issue: XSS concerns
**Solution**: All user input is automatically escaped by the renderer
