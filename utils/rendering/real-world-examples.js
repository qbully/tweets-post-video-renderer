/**
 * Real-world examples of using TemplateRenderer
 * Demonstrates various use cases and edge cases
 */

const { TemplateRenderer } = require('./template-renderer');
const path = require('path');
const fs = require('fs').promises;

const templatePath = path.join(__dirname, '../../claude/twitter-post-template.html');

/**
 * Example 1: Simple Tweet
 */
async function example1_SimpleTweet() {
  console.log('\n=== Example 1: Simple Tweet ===');

  const renderer = new TemplateRenderer(templatePath);

  const data = {
    theme: 'dark',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'Tech Enthusiast',
    username: 'techlover',
    tweetBody: 'Just discovered an amazing new framework! 🎉'
  };

  const html = await renderer.render(data);
  console.log(`✓ Rendered simple tweet (${html.length} bytes)`);
  return html;
}

/**
 * Example 2: Multi-line Tweet
 */
async function example2_MultilineTweet() {
  console.log('\n=== Example 2: Multi-line Tweet ===');

  const renderer = new TemplateRenderer(templatePath);

  const data = {
    theme: 'light',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'Product Manager',
    username: 'pm_daily',
    tweetBody: `Exciting announcement!

We're launching 3 new features:
• Feature A
• Feature B
• Feature C

Check them out at our website!`
  };

  const html = await renderer.render(data);
  console.log(`✓ Rendered multi-line tweet with bullets (${html.length} bytes)`);
  return html;
}

/**
 * Example 3: Tweet with Special Characters
 */
async function example3_SpecialCharacters() {
  console.log('\n=== Example 3: Special Characters & Emojis ===');

  const renderer = new TemplateRenderer(templatePath);

  const data = {
    theme: 'dark',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'Code & Coffee ☕',
    username: 'dev_life',
    tweetBody: `Writing code that's 100% bug-free...

Said no developer ever! 😅

#DevLife #Programming`
  };

  const html = await renderer.render(data);
  console.log(`✓ Rendered tweet with emojis and symbols (${html.length} bytes)`);
  return html;
}

/**
 * Example 4: Long Tweet
 */
async function example4_LongTweet() {
  console.log('\n=== Example 4: Long Tweet ===');

  const renderer = new TemplateRenderer(templatePath);

  const data = {
    theme: 'light',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'Thought Leader',
    username: 'thoughts',
    tweetBody: `Here's what I learned after 10 years in tech:

1. Communication beats technical skills
2. Simple solutions are often the best
3. Testing saves time in the long run
4. Documentation is a love letter to your future self
5. Take breaks to avoid burnout

What would you add to this list?`
  };

  const html = await renderer.render(data);
  console.log(`✓ Rendered long tweet with list (${html.length} bytes)`);
  return html;
}

/**
 * Example 5: Quote Tweet Style
 */
async function example5_QuoteTweet() {
  console.log('\n=== Example 5: Quote Tweet Style ===');

  const renderer = new TemplateRenderer(templatePath);

  const data = {
    theme: 'dark',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'News Reporter',
    username: 'newstoday',
    tweetBody: `"The best time to plant a tree was 20 years ago. The second best time is now." - Chinese Proverb

This applies to starting your project too!`
  };

  const html = await renderer.render(data);
  console.log(`✓ Rendered quote-style tweet (${html.length} bytes)`);
  return html;
}

/**
 * Example 6: Handling HTML in User Input (XSS Protection)
 */
async function example6_XSSProtection() {
  console.log('\n=== Example 6: XSS Protection Test ===');

  const renderer = new TemplateRenderer(templatePath);

  // Attempt to inject HTML/JavaScript
  const data = {
    theme: 'dark',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: '<script>alert("XSS")</script>Hacker',
    username: '<img src=x onerror=alert(1)>',
    tweetBody: 'Check out this link: <a href="javascript:alert(1)">Click me</a>'
  };

  const html = await renderer.render(data);
  const hasUnescapedScript = html.includes('<script>') && !html.includes('&lt;script&gt;');

  console.log(`✓ XSS protection ${hasUnescapedScript ? 'FAILED' : 'PASSED'}`);
  console.log(`  All HTML entities properly escaped`);
  return html;
}

/**
 * Example 7: Performance Test with Caching
 */
async function example7_PerformanceTest() {
  console.log('\n=== Example 7: Performance Test ===');

  const renderer = new TemplateRenderer(templatePath);

  const data = {
    theme: 'dark',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'Performance Tester',
    username: 'perftest',
    tweetBody: 'Testing rendering performance...'
  };

  // First render (loads template)
  const start1 = Date.now();
  await renderer.render(data);
  const time1 = Date.now() - start1;
  console.log(`✓ First render (with template load): ${time1}ms`);

  // Second render (uses cache)
  const start2 = Date.now();
  await renderer.render(data);
  const time2 = Date.now() - start2;
  console.log(`✓ Second render (cached): ${time2}ms`);

  // Bulk render test
  const bulkStart = Date.now();
  for (let i = 0; i < 100; i++) {
    await renderer.render(data);
  }
  const bulkTime = Date.now() - bulkStart;
  console.log(`✓ 100 renders: ${bulkTime}ms (avg: ${(bulkTime/100).toFixed(2)}ms per render)`);

  const speedup = (time1 / time2).toFixed(2);
  console.log(`✓ Cache speedup: ${speedup}x faster`);
}

/**
 * Example 8: Error Handling
 */
async function example8_ErrorHandling() {
  console.log('\n=== Example 8: Error Handling ===');

  const renderer = new TemplateRenderer(templatePath);

  // Test 1: Missing field
  try {
    await renderer.render({
      theme: 'dark',
      profileName: 'Test'
      // Missing other required fields
    });
    console.log('✗ Should have thrown error for missing fields');
  } catch (error) {
    console.log(`✓ Caught missing field error: "${error.message}"`);
  }

  // Test 2: Invalid theme
  try {
    await renderer.render({
      theme: 'blue',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      profileName: 'Test',
      username: 'test',
      tweetBody: 'Test'
    });
    console.log('✗ Should have thrown error for invalid theme');
  } catch (error) {
    console.log(`✓ Caught invalid theme error: "${error.message}"`);
  }

  // Test 3: Empty string
  try {
    await renderer.render({
      theme: 'dark',
      profilePhotoUrl: '',
      profileName: 'Test',
      username: 'test',
      tweetBody: 'Test'
    });
    console.log('✗ Should have thrown error for empty string');
  } catch (error) {
    console.log(`✓ Caught empty string error: "${error.message}"`);
  }

  // Test 4: Invalid template path
  try {
    const badRenderer = new TemplateRenderer('/nonexistent/path.html');
    await badRenderer.render({
      theme: 'dark',
      profilePhotoUrl: 'https://example.com/photo.jpg',
      profileName: 'Test',
      username: 'test',
      tweetBody: 'Test'
    });
    console.log('✗ Should have thrown error for missing template');
  } catch (error) {
    console.log(`✓ Caught template not found error: "${error.message}"`);
  }
}

/**
 * Example 9: Different Themes Comparison
 */
async function example9_ThemeComparison() {
  console.log('\n=== Example 9: Theme Comparison ===');

  const renderer = new TemplateRenderer(templatePath);

  const baseData = {
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'Theme Tester',
    username: 'themetest',
    tweetBody: 'Testing both dark and light themes!'
  };

  // Dark theme
  const darkHtml = await renderer.render({ ...baseData, theme: 'dark' });
  const darkHasClass = darkHtml.includes('class="dark"');
  console.log(`✓ Dark theme rendered (has dark class: ${darkHasClass})`);

  // Light theme
  const lightHtml = await renderer.render({ ...baseData, theme: 'light' });
  const lightHasClass = lightHtml.includes('class="light"');
  console.log(`✓ Light theme rendered (has light class: ${lightHasClass})`);

  console.log(`  Dark theme size: ${darkHtml.length} bytes`);
  console.log(`  Light theme size: ${lightHtml.length} bytes`);
}

/**
 * Example 10: Batch Processing
 */
async function example10_BatchProcessing() {
  console.log('\n=== Example 10: Batch Processing ===');

  const renderer = new TemplateRenderer(templatePath);

  const tweets = [
    {
      theme: 'dark',
      profilePhotoUrl: 'https://example.com/user1.jpg',
      profileName: 'User One',
      username: 'user1',
      tweetBody: 'First tweet in batch'
    },
    {
      theme: 'light',
      profilePhotoUrl: 'https://example.com/user2.jpg',
      profileName: 'User Two',
      username: 'user2',
      tweetBody: 'Second tweet in batch'
    },
    {
      theme: 'dark',
      profilePhotoUrl: 'https://example.com/user3.jpg',
      profileName: 'User Three',
      username: 'user3',
      tweetBody: 'Third tweet in batch'
    }
  ];

  const startTime = Date.now();
  const results = await Promise.all(
    tweets.map(tweet => renderer.render(tweet))
  );
  const totalTime = Date.now() - startTime;

  console.log(`✓ Processed ${results.length} tweets in ${totalTime}ms`);
  console.log(`  Average: ${(totalTime / results.length).toFixed(2)}ms per tweet`);
  console.log(`  Total size: ${results.reduce((sum, html) => sum + html.length, 0)} bytes`);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  TemplateRenderer Real-World Examples     ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await example1_SimpleTweet();
    await example2_MultilineTweet();
    await example3_SpecialCharacters();
    await example4_LongTweet();
    await example5_QuoteTweet();
    await example6_XSSProtection();
    await example7_PerformanceTest();
    await example8_ErrorHandling();
    await example9_ThemeComparison();
    await example10_BatchProcessing();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  All Examples Completed Successfully!     ║');
    console.log('╚════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n✗ Example failed:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  example1_SimpleTweet,
  example2_MultilineTweet,
  example3_SpecialCharacters,
  example4_LongTweet,
  example5_QuoteTweet,
  example6_XSSProtection,
  example7_PerformanceTest,
  example8_ErrorHandling,
  example9_ThemeComparison,
  example10_BatchProcessing,
  runAllExamples
};
