#!/usr/bin/env node

/**
 * Local Testing Script for Video Generation API
 *
 * This script tests the video generation API by:
 * 1. Creating a signed request to generate a video
 * 2. Polling for job completion
 * 3. Downloading the generated video
 *
 * Usage:
 *   node scripts/test-local.js
 *   npm test
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const HMAC_SECRET = process.env.HMAC_SECRET;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const POLL_INTERVAL_MS = 5000; // 5 seconds
const MAX_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const OUTPUT_FILE = path.join(__dirname, '..', 'test-output.mp4');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Logging utilities
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`);
}

function logInfo(message) {
  log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`${colors.green}✓${colors.reset} ${message}`, colors.green);
}

function logError(message) {
  log(`${colors.red}✗${colors.reset} ${message}`, colors.red);
}

function logWarning(message) {
  log(`${colors.yellow}⚠${colors.reset} ${message}`, colors.yellow);
}

function logProgress(message, percentage) {
  const barLength = 30;
  const filledLength = Math.round((barLength * percentage) / 100);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  process.stdout.write(`\r${colors.cyan}${bar}${colors.reset} ${percentage}% - ${message}`);
  if (percentage >= 100) {
    process.stdout.write('\n');
  }
}

/**
 * Generates an HMAC-SHA256 signature for request authentication
 *
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {Object} body - Request body object
 * @returns {string} Hex-encoded HMAC signature
 */
function generateSignature(timestamp, body) {
  if (!HMAC_SECRET) {
    throw new Error('HMAC_SECRET environment variable is not set');
  }

  const timestampStr = String(timestamp);
  const bodyStr = JSON.stringify(body);
  const message = `${timestampStr}:${bodyStr}`;

  const hmac = crypto.createHmac('sha256', HMAC_SECRET);
  hmac.update(message);

  return hmac.digest('hex');
}

/**
 * Makes an authenticated request to the API
 *
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body (optional)
 * @returns {Promise<Object>} Response data
 */
async function makeAuthenticatedRequest(method, endpoint, body = null) {
  const timestamp = Math.floor(Date.now() / 1000);
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp.toString()
    }
  };

  if (body) {
    config.data = body;
    const signature = generateSignature(timestamp, body);
    config.headers['X-Signature'] = signature;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      throw new Error(
        `API Error (${error.response.status}): ${error.response.data.message || error.response.data.error || 'Unknown error'}`
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network Error: No response from server. Is the API running?');
    } else {
      // Error setting up request
      throw new Error(`Request Error: ${error.message}`);
    }
  }
}

/**
 * Polls a job until it completes or fails
 *
 * @param {string} jobId - Job ID to poll
 * @returns {Promise<Object>} Final job status
 */
async function pollJobStatus(jobId) {
  const startTime = Date.now();
  let lastStatus = null;
  let lastProgress = 0;

  while (true) {
    // Check timeout
    if (Date.now() - startTime > MAX_TIMEOUT_MS) {
      throw new Error('Timeout: Job did not complete within 5 minutes');
    }

    // Get job status
    const job = await makeAuthenticatedRequest('GET', `/job/${jobId}`);

    // Show progress if changed
    if (job.status !== lastStatus || job.progress !== lastProgress) {
      if (job.status === 'processing' && job.currentStep) {
        logProgress(job.currentStep, job.progress || 0);
      } else if (job.status === 'pending') {
        logInfo('Job is pending...');
      }
      lastStatus = job.status;
      lastProgress = job.progress;
    }

    // Check if job is complete
    if (job.status === 'completed') {
      return job;
    }

    // Check if job failed
    if (job.status === 'failed') {
      throw new Error(`Job failed: ${job.error || 'Unknown error'}`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/**
 * Downloads a file from a URL
 *
 * @param {string} url - URL to download from
 * @param {string} outputPath - Path to save the file
 * @returns {Promise<number>} File size in bytes
 */
async function downloadFile(url, outputPath) {
  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    let downloadedBytes = 0;
    const totalBytes = parseInt(response.headers['content-length'], 10);

    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (totalBytes) {
        const percentage = Math.round((downloadedBytes / totalBytes) * 100);
        logProgress('Downloading video', percentage);
      }
    });

    writer.on('finish', () => {
      const stats = fs.statSync(outputPath);
      resolve(stats.size);
    });

    writer.on('error', reject);
    response.data.on('error', reject);
  });
}

/**
 * Formats bytes to human-readable format
 *
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Main test function
 */
async function testVideoGeneration() {
  const testStartTime = Date.now();

  // Print header
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Video Generation API - Local Test', colors.bright);
  log('='.repeat(60) + '\n', colors.cyan);

  try {
    // Validate configuration
    logStep('1/5', 'Validating configuration');

    if (!HMAC_SECRET) {
      throw new Error('HMAC_SECRET not found in environment variables. Please create a .env file.');
    }

    logInfo(`Base URL: ${BASE_URL}`);
    logInfo(`HMAC Secret: ${HMAC_SECRET.substring(0, 10)}...`);
    logSuccess('Configuration valid\n');

    // Create request body with sample tweet data
    logStep('2/5', 'Creating video generation request');

    const requestBody = {
      theme: 'dark',
      profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg',
      profileName: 'Claude Code',
      username: 'anthropic',
      tweetBody: 'Just tested the video generation API and it works perfectly! The HMAC authentication is solid and the job polling is smooth. Great work on the architecture!'
    };

    logInfo('Sample tweet data:');
    logInfo(`  Theme: ${requestBody.theme}`);
    logInfo(`  Profile: ${requestBody.profileName} (@${requestBody.username})`);
    logInfo(`  Tweet: "${requestBody.tweetBody.substring(0, 50)}..."`);

    // Submit video generation request
    logStep('3/5', 'Submitting request to /generate-video');

    const createResponse = await makeAuthenticatedRequest(
      'POST',
      '/generate-video',
      requestBody
    );

    logSuccess(`Job created: ${createResponse.jobId}`);
    logInfo(`Status: ${createResponse.status}`);

    // Poll for completion
    logStep('4/5', 'Polling job status');

    const completedJob = await pollJobStatus(createResponse.jobId);

    logSuccess('Job completed successfully!');
    logInfo(`Filename: ${completedJob.result.filename}`);
    logInfo(`Download URL: ${completedJob.result.downloadUrl}`);
    logInfo(`File Size: ${formatBytes(completedJob.result.fileSize)}`);
    logInfo(`Duration: ${completedJob.result.duration}s`);
    logInfo(`Resolution: ${completedJob.result.resolution}`);
    logInfo(`Expires At: ${new Date(completedJob.result.expiresAt).toLocaleString()}`);

    // Download video
    logStep('5/5', 'Downloading video');

    logInfo(`Saving to: ${OUTPUT_FILE}`);

    const fileSize = await downloadFile(completedJob.result.downloadUrl, OUTPUT_FILE);

    logSuccess(`Video downloaded successfully!`);
    logInfo(`File size: ${formatBytes(fileSize)}`);
    logInfo(`Location: ${OUTPUT_FILE}`);

    // Print summary
    const totalTime = ((Date.now() - testStartTime) / 1000).toFixed(2);

    log('\n' + '='.repeat(60), colors.green);
    log('  Test Completed Successfully!', colors.bright);
    log('='.repeat(60), colors.green);
    log(`\n${colors.green}Total time: ${totalTime}s${colors.reset}`);
    log(`${colors.green}Output file: ${OUTPUT_FILE}${colors.reset}\n`);

    process.exit(0);

  } catch (error) {
    // Print error
    log('\n' + '='.repeat(60), colors.red);
    log('  Test Failed', colors.bright);
    log('='.repeat(60), colors.red);
    logError(`\n${error.message}\n`);

    if (error.stack) {
      log(colors.dim + error.stack + colors.reset);
    }

    log('');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testVideoGeneration();
}

module.exports = { testVideoGeneration, generateSignature, makeAuthenticatedRequest };
