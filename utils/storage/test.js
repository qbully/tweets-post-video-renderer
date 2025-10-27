/**
 * Simple test suite for storage providers
 * Run with: node utils/storage/test.js
 */

const { createStorageProvider } = require('./index');
const path = require('path');
const fs = require('fs').promises;

// Test counters
let passed = 0;
let failed = 0;

// Helper function to run a test
async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

// Helper function to assert
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('Storage Provider Test Suite');
  console.log('='.repeat(80));
  console.log();

  // Setup test storage
  const testPath = path.join(__dirname, '../../tmp/test-storage');
  const storage = createStorageProvider('local', {
    storagePath: testPath,
    ttlHours: 24
  });

  // Test 1: Base class cannot be instantiated
  await test('StorageProvider base class throws on direct instantiation', async () => {
    const { StorageProvider } = require('./base');
    try {
      new StorageProvider();
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('abstract class'), 'Wrong error message');
    }
  });

  // Test 2: Factory creates local provider
  await test('Factory creates LocalStorageProvider', async () => {
    const { LocalStorageProvider } = require('./local');
    assert(storage instanceof LocalStorageProvider, 'Not a LocalStorageProvider instance');
  });

  // Test 3: Save file
  const testBuffer = Buffer.from('test content');
  let saveResult;
  await test('Save file with metadata', async () => {
    saveResult = await storage.save('test-file.mp4', testBuffer, {
      testKey: 'testValue',
      duration: 10
    });
    assert(saveResult.filename === 'test-file.mp4', 'Wrong filename');
    assert(saveResult.size === testBuffer.length, 'Wrong size');
    assert(saveResult.metadata.testKey === 'testValue', 'Metadata not saved');
  });

  // Test 4: File exists
  await test('File exists check returns true for existing file', async () => {
    const exists = await storage.exists('test-file.mp4');
    assert(exists === true, 'File should exist');
  });

  // Test 5: File exists check for non-existent file
  await test('File exists check returns false for non-existent file', async () => {
    const exists = await storage.exists('non-existent.mp4');
    assert(exists === false, 'File should not exist');
  });

  // Test 6: Get file
  await test('Get file returns correct buffer', async () => {
    const buffer = await storage.get('test-file.mp4');
    assert(buffer.equals(testBuffer), 'Retrieved buffer does not match');
  });

  // Test 7: Get metadata
  await test('Get metadata returns correct data', async () => {
    const metadata = await storage.getMetadata('test-file.mp4');
    assert(metadata.filename === 'test-file.mp4', 'Wrong filename in metadata');
    assert(metadata.testKey === 'testValue', 'Custom metadata not preserved');
    assert(metadata.size === testBuffer.length, 'Wrong size in metadata');
    assert(metadata.createdAt, 'No createdAt timestamp');
    assert(metadata.expiresAt, 'No expiresAt timestamp');
  });

  // Test 8: List files
  await test('List files returns correct results', async () => {
    await storage.save('test-file-2.mp4', Buffer.from('content 2'), {});
    const files = await storage.list();
    assert(files.length === 2, `Expected 2 files, got ${files.length}`);
    assert(files[0].filename, 'File should have filename');
    assert(files[0].metadata, 'File should have metadata');
  });

  // Test 9: Delete file
  await test('Delete file removes file and metadata', async () => {
    const deleted = await storage.delete('test-file-2.mp4');
    assert(deleted === true, 'Delete should return true');
    const exists = await storage.exists('test-file-2.mp4');
    assert(exists === false, 'File should not exist after delete');
  });

  // Test 10: Error on invalid save (not a buffer)
  await test('Save throws error for invalid buffer', async () => {
    try {
      await storage.save('invalid.mp4', 'not a buffer');
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('Buffer'), 'Wrong error message');
    }
  });

  // Test 11: Error on get non-existent file
  await test('Get throws error for non-existent file', async () => {
    try {
      await storage.get('non-existent.mp4');
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('not found'), 'Wrong error message');
    }
  });

  // Test 12: Error on getMetadata for non-existent file
  await test('GetMetadata throws error for non-existent file', async () => {
    try {
      await storage.getMetadata('non-existent.mp4');
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('not found'), 'Wrong error message');
    }
  });

  // Test 13: Filename sanitization (prevent directory traversal)
  await test('Filename sanitization prevents directory traversal', async () => {
    const result = await storage.save('../../../evil.mp4', Buffer.from('evil'), {});
    assert(result.filename === 'evil.mp4', 'Filename should be sanitized');
    assert(!result.path.includes('..'), 'Path should not contain ..');
  });

  // Test 14: Factory with no type uses default
  await test('Factory with no type creates default provider', async () => {
    const defaultStorage = createStorageProvider();
    const { LocalStorageProvider } = require('./local');
    assert(defaultStorage instanceof LocalStorageProvider, 'Should create LocalStorageProvider by default');
  });

  // Test 15: Factory with unknown type throws error
  await test('Factory with unknown type throws error', async () => {
    try {
      createStorageProvider('unknown-type');
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('Unknown storage provider'), 'Wrong error message');
    }
  });

  // Test 16: Cleanup expired files (with expired TTL)
  await test('Cleanup removes expired files', async () => {
    // Create storage with very short TTL
    const shortTtlStorage = createStorageProvider('local', {
      storagePath: testPath,
      ttlHours: 0.0001 // About 0.36 seconds
    });

    await shortTtlStorage.save('expire-soon.mp4', Buffer.from('expire'), {});

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));

    const count = await shortTtlStorage.cleanupExpiredFiles();
    assert(count >= 1, 'Should have cleaned up at least 1 file');
  });

  // Cleanup test files
  await test('Cleanup test directory', async () => {
    await storage.delete('test-file.mp4');
    await storage.delete('evil.mp4');

    // Try to remove test directory
    try {
      await fs.rm(testPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // Print results
  console.log();
  console.log('='.repeat(80));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80));

  return failed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      if (success) {
        console.log('\n✓ All tests passed!');
        process.exit(0);
      } else {
        console.error('\n✗ Some tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n✗ Test suite error:', error);
      process.exit(1);
    });
}

module.exports = { runTests };
