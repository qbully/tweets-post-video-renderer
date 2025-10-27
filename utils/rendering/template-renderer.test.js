/**
 * Test script for TemplateRenderer
 * Run this file to verify the template renderer is working correctly
 */

const { TemplateRenderer } = require('./template-renderer');
const path = require('path');

async function runTests() {
  console.log('=== TemplateRenderer Test Suite ===\n');

  try {
    // Test 1: Initialize with template path
    console.log('Test 1: Initialize TemplateRenderer');
    const templatePath = path.join(__dirname, '../../claude/twitter-post-template.html');
    const renderer = new TemplateRenderer(templatePath);
    console.log('✓ TemplateRenderer initialized successfully\n');

    // Test 2: Load template
    console.log('Test 2: Load template');
    await renderer.loadTemplate();
    console.log('✓ Template loaded and cached\n');

    // Test 3: Verify cache
    console.log('Test 3: Verify caching');
    const isCached = renderer.isCached();
    console.log(`✓ Template is cached: ${isCached}\n`);

    // Test 4: HTML escaping
    console.log('Test 4: HTML escaping');
    const escapedText = renderer.escapeHtml('<script>alert("XSS")</script>');
    console.log(`Original: <script>alert("XSS")</script>`);
    console.log(`Escaped: ${escapedText}`);
    console.log('✓ HTML escaping works correctly\n');

    // Test 5: Timestamp formatting
    console.log('Test 5: Timestamp formatting');
    const timestamp = renderer.formatTimestamp();
    console.log(`Generated timestamp: ${timestamp}`);
    console.log('✓ Timestamp formatted correctly\n');

    // Test 6: Render template with data (dark theme)
    console.log('Test 6: Render template (dark theme)');
    const darkData = {
      theme: 'dark',
      profilePhotoUrl: 'https://example.com/profile.jpg',
      profileName: 'John Doe',
      username: 'johndoe',
      tweetBody: 'This is a test tweet!\nWith multiple lines.\nAnd some more content.'
    };
    const darkHtml = await renderer.render(darkData);
    console.log(`✓ Dark theme HTML generated (${darkHtml.length} bytes)\n`);

    // Test 7: Render template with data (light theme)
    console.log('Test 7: Render template (light theme)');
    const lightData = {
      theme: 'light',
      profilePhotoUrl: 'https://example.com/profile.jpg',
      profileName: 'Jane Smith',
      username: 'janesmith',
      tweetBody: 'Testing the light theme!'
    };
    const lightHtml = await renderer.render(lightData);
    console.log(`✓ Light theme HTML generated (${lightHtml.length} bytes)\n`);

    // Test 8: Error handling - missing required field
    console.log('Test 8: Error handling - missing required field');
    try {
      await renderer.render({ theme: 'dark', profileName: 'Test' });
      console.log('✗ Should have thrown an error\n');
    } catch (error) {
      console.log(`✓ Error caught: ${error.message}\n`);
    }

    // Test 9: Error handling - invalid theme
    console.log('Test 9: Error handling - invalid theme');
    try {
      await renderer.render({
        theme: 'invalid',
        profilePhotoUrl: 'https://example.com/profile.jpg',
        profileName: 'Test User',
        username: 'testuser',
        tweetBody: 'Test'
      });
      console.log('✗ Should have thrown an error\n');
    } catch (error) {
      console.log(`✓ Error caught: ${error.message}\n`);
    }

    // Test 10: XSS protection
    console.log('Test 10: XSS protection in rendered output');
    const xssData = {
      theme: 'dark',
      profilePhotoUrl: 'https://example.com/profile.jpg',
      profileName: '<script>alert("XSS")</script>',
      username: 'testuser',
      tweetBody: 'Normal content'
    };
    const xssHtml = await renderer.render(xssData);
    const containsScript = xssHtml.includes('<script>');
    console.log(`✓ XSS protection working: script tags ${containsScript ? 'NOT escaped (FAIL)' : 'properly escaped'}\n`);

    // Test 11: Cache clearing
    console.log('Test 11: Cache clearing');
    renderer.clearCache();
    console.log(`✓ Cache cleared: ${!renderer.isCached()}\n`);

    console.log('=== All Tests Completed Successfully ===');

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
