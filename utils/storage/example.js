/**
 * Example usage of storage provider utilities
 *
 * This file demonstrates how to use the storage providers.
 * Run with: node utils/storage/example.js
 */

const { createStorageProvider, createDefaultStorageProvider } = require('./index');
const path = require('path');

async function runExample() {
  console.log('='.repeat(80));
  console.log('Storage Provider Example');
  console.log('='.repeat(80));
  console.log();

  // Create a storage provider with test configuration
  const storage = createStorageProvider('local', {
    storagePath: path.join(__dirname, '../../tmp/test-videos'),
    ttlHours: 1 // Short TTL for testing
  });

  console.log('1. Creating test video buffer...');
  const videoBuffer = Buffer.from('This is a test video file content');
  console.log(`   Created buffer of ${videoBuffer.length} bytes`);
  console.log();

  console.log('2. Saving video file with metadata...');
  const saveResult = await storage.save('test-video-001.mp4', videoBuffer, {
    jobId: 'test-job-123',
    tweetId: '1234567890',
    username: 'testuser',
    duration: 15.5,
    resolution: '1080x1920',
    format: 'mp4',
    theme: 'dark'
  });
  console.log('   Save result:', JSON.stringify(saveResult, null, 2));
  console.log();

  console.log('3. Checking if file exists...');
  const exists = await storage.exists('test-video-001.mp4');
  console.log(`   File exists: ${exists}`);
  console.log();

  console.log('4. Retrieving file metadata...');
  const metadata = await storage.getMetadata('test-video-001.mp4');
  console.log('   Metadata:', JSON.stringify(metadata, null, 2));
  console.log();

  console.log('5. Retrieving file content...');
  const retrievedBuffer = await storage.get('test-video-001.mp4');
  console.log(`   Retrieved ${retrievedBuffer.length} bytes`);
  console.log(`   Content matches: ${retrievedBuffer.equals(videoBuffer)}`);
  console.log();

  console.log('6. Saving additional test files...');
  await storage.save('test-video-002.mp4', Buffer.from('Another test video'), {
    jobId: 'test-job-456',
    duration: 10.0
  });
  await storage.save('test-video-003.mp4', Buffer.from('Yet another test video'), {
    jobId: 'test-job-789',
    duration: 12.5
  });
  console.log('   Saved 2 additional files');
  console.log();

  console.log('7. Listing all files...');
  const files = await storage.list();
  console.log(`   Found ${files.length} files:`);
  files.forEach(file => {
    console.log(`   - ${file.filename} (${file.size} bytes, expires: ${file.expiresAt})`);
  });
  console.log();

  console.log('8. Deleting a file...');
  const deleted = await storage.delete('test-video-002.mp4');
  console.log(`   Deleted: ${deleted}`);
  console.log();

  console.log('9. Listing files after deletion...');
  const filesAfterDelete = await storage.list();
  console.log(`   Found ${filesAfterDelete.length} files (should be 2)`);
  console.log();

  console.log('10. Testing error handling - trying to get non-existent file...');
  try {
    await storage.get('non-existent.mp4');
    console.log('   ERROR: Should have thrown an error!');
  } catch (error) {
    console.log(`   ✓ Caught expected error: ${error.message}`);
  }
  console.log();

  console.log('11. Testing error handling - invalid buffer...');
  try {
    await storage.save('invalid.mp4', 'not a buffer');
    console.log('   ERROR: Should have thrown an error!');
  } catch (error) {
    console.log(`   ✓ Caught expected error: ${error.message}`);
  }
  console.log();

  console.log('12. Cleanup - deleting test files...');
  await storage.delete('test-video-001.mp4');
  await storage.delete('test-video-003.mp4');
  console.log('   All test files deleted');
  console.log();

  console.log('='.repeat(80));
  console.log('Example completed successfully!');
  console.log('='.repeat(80));
}

// Run example if executed directly
if (require.main === module) {
  runExample()
    .then(() => {
      console.log('\n✓ All tests passed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n✗ Example failed:', error);
      process.exit(1);
    });
}

module.exports = { runExample };
