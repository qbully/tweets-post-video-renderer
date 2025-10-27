/**
 * VideoGenerationWorker Usage Example
 *
 * This example demonstrates how to initialize and use the VideoGenerationWorker
 * in a production environment.
 */

const path = require('path');
const { VideoGenerationWorker } = require('./video-worker.js');
const { jobManager } = require('../utils/job-manager.js');
const { createDefaultStorageProvider } = require('../utils/storage');

/**
 * Initialize and start the video generation worker
 */
async function startWorker() {
  try {
    console.log('=== VideoGenerationWorker Example ===\n');

    // 1. Create storage provider from environment variables
    console.log('Step 1: Creating storage provider...');
    const storageProvider = createDefaultStorageProvider();
    console.log('Storage provider created\n');

    // 2. Define paths to template and audio
    console.log('Step 2: Setting up paths...');
    const templatePath = path.join(__dirname, '../templates/tweet-template.html');
    const audioPath = path.join(__dirname, '../assets/background-music.mp3');
    console.log(`Template path: ${templatePath}`);
    console.log(`Audio path: ${audioPath}\n`);

    // 3. Create worker instance with configuration
    console.log('Step 3: Creating worker instance...');
    const worker = new VideoGenerationWorker({
      jobManager: jobManager,
      storageProvider: storageProvider,
      templatePath: templatePath,
      audioPath: audioPath,
      maxConcurrentJobs: 2,        // Process up to 2 jobs concurrently
      pollInterval: 5000,           // Check for new jobs every 5 seconds
    });
    console.log('Worker instance created\n');

    // 4. Start the worker
    console.log('Step 4: Starting worker...');
    worker.start();
    console.log('Worker started successfully\n');

    // 5. Create a test job
    console.log('Step 5: Creating a test job...');
    const jobId = jobManager.createJob({
      tweetBody: 'This is a test tweet for the video generation worker! It will be rendered into a beautiful video with background music and fade effects.',
      profilePhotoUrl: 'https://pbs.twimg.com/profile_images/1234567890/avatar.jpg',
      profileName: 'Test User',
      username: 'testuser',
      theme: 'dark',
    });
    console.log(`Test job created with ID: ${jobId}\n`);

    // 6. Monitor job status
    console.log('Step 6: Monitoring job status...');
    const checkInterval = setInterval(() => {
      const job = jobManager.getJob(jobId);

      if (!job) {
        console.log('Job not found!');
        clearInterval(checkInterval);
        return;
      }

      console.log(`Job ${jobId} - Status: ${job.status}, Progress: ${job.progress}%, Step: ${job.currentStep || 'N/A'}`);

      if (job.status === 'completed') {
        console.log('\n✓ Job completed successfully!');
        console.log('Result:', JSON.stringify(job.result, null, 2));
        clearInterval(checkInterval);

        // Stop the worker after job completion
        console.log('\nStopping worker...');
        worker.stop().then(() => {
          console.log('Worker stopped. Example finished.');
          process.exit(0);
        });
      } else if (job.status === 'failed') {
        console.log('\n✗ Job failed!');
        console.log('Error:', JSON.stringify(job.error, null, 2));
        clearInterval(checkInterval);

        // Stop the worker after job failure
        console.log('\nStopping worker...');
        worker.stop().then(() => {
          console.log('Worker stopped. Example finished.');
          process.exit(1);
        });
      }
    }, 2000); // Check every 2 seconds

    // 7. Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nReceived SIGINT, shutting down gracefully...');
      clearInterval(checkInterval);
      await worker.stop();
      console.log('Worker stopped. Exiting.');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n\nReceived SIGTERM, shutting down gracefully...');
      clearInterval(checkInterval);
      await worker.stop();
      console.log('Worker stopped. Exiting.');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error starting worker:', error);
    process.exit(1);
  }
}

/**
 * Example: Get worker status
 */
function getWorkerStatus(worker) {
  const status = worker.getStatus();
  console.log('Worker Status:', JSON.stringify(status, null, 2));
}

/**
 * Example: Process multiple jobs
 */
async function processMultipleJobs(worker) {
  console.log('Creating multiple test jobs...\n');

  const jobs = [
    {
      tweetBody: 'First test tweet!',
      profilePhotoUrl: 'https://example.com/avatar1.jpg',
      profileName: 'User One',
      username: 'userone',
      theme: 'dark',
    },
    {
      tweetBody: 'Second test tweet with light theme!',
      profilePhotoUrl: 'https://example.com/avatar2.jpg',
      profileName: 'User Two',
      username: 'usertwo',
      theme: 'light',
    },
    {
      tweetBody: 'Third test tweet with more content to test word wrapping and layout!',
      profilePhotoUrl: 'https://example.com/avatar3.jpg',
      profileName: 'User Three',
      username: 'userthree',
      theme: 'dark',
    },
  ];

  const jobIds = jobs.map(jobData => {
    const jobId = jobManager.createJob(jobData);
    console.log(`Created job: ${jobId}`);
    return jobId;
  });

  console.log(`\nCreated ${jobIds.length} jobs. Worker will process them automatically.\n`);

  return jobIds;
}

// Run the example if executed directly
if (require.main === module) {
  console.log('Note: This example requires the following to exist:');
  console.log('  - Template file at: ../templates/tweet-template.html');
  console.log('  - Audio file at: ../assets/background-music.mp3');
  console.log('  - Proper environment variables set (STORAGE_PATH, etc.)');
  console.log('');

  startWorker().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  startWorker,
  getWorkerStatus,
  processMultipleJobs,
};
