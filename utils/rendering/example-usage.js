/**
 * Example usage of TemplateRenderer
 * This demonstrates how to use the template renderer in your application
 */

const { TemplateRenderer } = require('./template-renderer');
const path = require('path');
const fs = require('fs').promises;

async function exampleUsage() {
  // Initialize the renderer with the template path
  const templatePath = path.join(__dirname, '../../claude/twitter-post-template.html');
  const renderer = new TemplateRenderer(templatePath);

  console.log('Creating rendered HTML for a tweet...\n');

  // Example 1: Dark theme tweet
  const darkTweetData = {
    theme: 'dark',
    profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
    profileName: 'Claude AI',
    username: 'ClaudeAI',
    tweetBody: `Just shipped a new feature! 🚀

Check out our latest update that makes AI assistance even better.

What do you think?`
  };

  try {
    const darkHtml = await renderer.render(darkTweetData);

    // Save the rendered HTML to a file
    const outputPath = path.join(__dirname, 'output-dark.html');
    await fs.writeFile(outputPath, darkHtml);
    console.log(`✓ Dark theme HTML saved to: ${outputPath}`);
    console.log(`  File size: ${darkHtml.length} bytes\n`);

    // Example 2: Light theme tweet
    const lightTweetData = {
      theme: 'light',
      profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/profile.jpg',
      profileName: 'Tech News Daily',
      username: 'TechNewsDaily',
      tweetBody: 'Breaking: Major advancement in AI technology announced today!'
    };

    const lightHtml = await renderer.render(lightTweetData);

    const lightOutputPath = path.join(__dirname, 'output-light.html');
    await fs.writeFile(lightOutputPath, lightHtml);
    console.log(`✓ Light theme HTML saved to: ${lightOutputPath}`);
    console.log(`  File size: ${lightHtml.length} bytes\n`);

    // Example 3: Demonstrate caching benefit
    console.log('Testing cache performance...');
    const startTime = Date.now();

    // Render the same template multiple times
    for (let i = 0; i < 100; i++) {
      await renderer.render(darkTweetData);
    }

    const endTime = Date.now();
    console.log(`✓ Rendered 100 templates in ${endTime - startTime}ms (cached)\n`);

    // Example 4: Clear cache and reload
    renderer.clearCache();
    console.log('✓ Cache cleared\n');

    // Reload template
    await renderer.loadTemplate();
    console.log('✓ Template reloaded\n');

    console.log('Example usage completed successfully!');
    console.log('\nTo view the rendered HTML files:');
    console.log(`  - Dark theme: open ${outputPath}`);
    console.log(`  - Light theme: open ${lightOutputPath}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  exampleUsage();
}

module.exports = { exampleUsage };
