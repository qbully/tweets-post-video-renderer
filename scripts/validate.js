#!/usr/bin/env node
/**
 * Validation script to check if all components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Twitter Video Generator - Configuration Validation\n');
console.log('='.repeat(60));

let hasErrors = false;

// Check Node version
const nodeVersion = process.version;
const requiredVersion = 'v20.0.0';
if (nodeVersion < requiredVersion) {
  console.error(`❌ Node.js version ${requiredVersion} or higher required (current: ${nodeVersion})`);
  hasErrors = true;
} else {
  console.log(`✓ Node.js version: ${nodeVersion}`);
}

// Check required files
const requiredFiles = [
  'package.json',
  'server.js',
  '.env.example',
  'claude/twitter-post-template.html',
  'utils/job-manager.js',
  'utils/signature-verifier.js',
  'utils/url-generator.js',
  'utils/cleanup-scheduler.js',
  'utils/chrome-detector.js',
  'utils/storage/index.js',
  'utils/rendering/template-renderer.js',
  'utils/rendering/screenshot-generator.js',
  'utils/video/ffmpeg-detector.js',
  'utils/video/video-composer.js',
  'workers/video-worker.js',
];

console.log('\nChecking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.error(`  ❌ ${file} - MISSING`);
    hasErrors = true;
  }
});

// Check environment variables
console.log('\nChecking environment configuration:');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const envVars = [
  { name: 'HMAC_SECRET', required: true },
  { name: 'PORT', required: false, default: '3000' },
  { name: 'STORAGE_PATH', required: false, default: '/data/videos' },
  { name: 'BASE_URL', required: false },
];

envVars.forEach(({ name, required, default: defaultValue }) => {
  const value = process.env[name];
  if (!value) {
    if (required) {
      console.error(`  ❌ ${name} - NOT SET (required)`);
      hasErrors = true;
    } else {
      console.log(`  ⚠️  ${name} - not set (will use default: ${defaultValue || 'auto-detected'})`);
    }
  } else {
    const displayValue = name === 'HMAC_SECRET' ? '***' : value;
    console.log(`  ✓ ${name} = ${displayValue}`);
  }
});

// Check for background music
console.log('\nChecking assets:');
const audioPath = path.join(__dirname, '..', 'assets', 'background-music.mp3');
if (fs.existsSync(audioPath)) {
  const stats = fs.statSync(audioPath);
  console.log(`  ✓ background-music.mp3 (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
  console.log('  ⚠️  background-music.mp3 - NOT FOUND');
  console.log('     Videos will be generated without audio');
  console.log('     See assets/README.md for instructions');
}

// Check FFmpeg
console.log('\nChecking system dependencies:');
const { execSync } = require('child_process');

try {
  const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf-8' });
  const versionMatch = ffmpegVersion.match(/ffmpeg version ([^\s]+)/);
  if (versionMatch) {
    console.log(`  ✓ FFmpeg: ${versionMatch[1]}`);
  } else {
    console.log('  ✓ FFmpeg: installed');
  }
} catch (error) {
  console.error('  ❌ FFmpeg: NOT FOUND');
  console.error('     Install with: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)');
  hasErrors = true;
}

// Check Chromium
try {
  const chromiumPaths = [
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/opt/homebrew/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];

  const foundChromium = chromiumPaths.find(p => fs.existsSync(p));
  if (foundChromium || process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log(`  ✓ Chromium/Chrome: ${process.env.PUPPETEER_EXECUTABLE_PATH || foundChromium || 'installed'}`);
  } else {
    console.log('  ⚠️  Chromium/Chrome: not found in standard locations');
    console.log('     Will attempt to auto-detect when server starts');
  }
} catch (error) {
  console.log('  ⚠️  Could not verify Chromium installation');
}

// Check storage directory
console.log('\nChecking storage:');
const storagePath = process.env.STORAGE_PATH || path.join(__dirname, '..', 'data', 'videos');
try {
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
    console.log(`  ✓ Storage directory created: ${storagePath}`);
  } else {
    console.log(`  ✓ Storage directory exists: ${storagePath}`);
  }
} catch (error) {
  console.error(`  ❌ Could not create storage directory: ${error.message}`);
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('\n❌ Validation failed. Please fix the errors above.\n');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed! Your application is ready to run.\n');
  console.log('Start the server with:');
  console.log('  npm start          # Production mode');
  console.log('  npm run dev        # Development mode with auto-reload');
  console.log('  npm test           # Run API tests\n');
  process.exit(0);
}
