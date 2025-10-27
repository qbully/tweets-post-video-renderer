/**
 * Example Usage of JobManager
 *
 * This file demonstrates how to use the JobManager utility
 * for managing video generation jobs.
 */

const { jobManager } = require('./job-manager');

// Example 1: Create a new job
const jobId = jobManager.createJob({
  tweetBody: 'This is a sample tweet for video generation',
  profilePhotoUrl: 'https://example.com/avatar.jpg',
  profileName: 'John Doe',
  username: 'johndoe',
  theme: 'dark'
});

console.log(`Created job with ID: ${jobId}`);

// Example 2: Get job details
const job = jobManager.getJob(jobId);
console.log('Job details:', job);

// Example 3: Update job status to processing
jobManager.updateJobStatus(jobId, 'processing');

// Example 4: Update job progress
jobManager.updateJobProgress(jobId, 'Initializing browser', 10);
jobManager.updateJobProgress(jobId, 'Rendering tweet', 50);
jobManager.updateJobProgress(jobId, 'Recording video', 75);

// Example 5: Mark job as completed
jobManager.setJobCompleted(jobId, {
  filename: 'tweet-video-123.mp4',
  downloadUrl: 'https://example.com/downloads/tweet-video-123.mp4',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  fileSize: 2048576, // 2MB in bytes
  duration: 15.5, // seconds
  resolution: '1080x1920'
});

// Example 6: Create another job and mark it as failed
const jobId2 = jobManager.createJob({
  tweetBody: 'Another tweet',
  profileName: 'Jane Smith',
  username: 'janesmith',
  theme: 'light'
});

jobManager.updateJobStatus(jobId2, 'processing');

try {
  // Simulate an error
  throw new Error('Browser crashed during rendering');
} catch (error) {
  jobManager.setJobFailed(jobId2, error.message, error.stack);
}

// Example 7: Get all jobs
const allJobs = jobManager.getAllJobs();
console.log(`Total jobs: ${allJobs.length}`);

// Example 8: Get jobs by status
const completedJobs = jobManager.getJobsByStatus('completed');
const failedJobs = jobManager.getJobsByStatus('failed');
console.log(`Completed: ${completedJobs.length}, Failed: ${failedJobs.length}`);

// Example 9: Get statistics
const stats = jobManager.getStats();
console.log('Job statistics:', stats);

// Example 10: Cleanup old jobs (remove jobs older than 24 hours)
const removedCount = jobManager.cleanupExpiredJobs(24);
console.log(`Removed ${removedCount} expired jobs`);

// Example 11: Use with Express.js route (pseudo-code)
/*
app.post('/api/generate-video', async (req, res) => {
  try {
    // Create a new job
    const jobId = jobManager.createJob(req.body);

    // Return job ID immediately for async processing
    res.json({ jobId, status: 'pending' });

    // Process job asynchronously
    processVideoJob(jobId).catch(error => {
      jobManager.setJobFailed(jobId, error.message, error.stack);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/job/:jobId', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

async function processVideoJob(jobId) {
  jobManager.updateJobStatus(jobId, 'processing');

  jobManager.updateJobProgress(jobId, 'Initializing browser', 10);
  // ... browser setup

  jobManager.updateJobProgress(jobId, 'Rendering tweet', 40);
  // ... render tweet

  jobManager.updateJobProgress(jobId, 'Recording video', 70);
  // ... record video

  jobManager.updateJobProgress(jobId, 'Processing output', 90);
  // ... process and save

  jobManager.setJobCompleted(jobId, {
    filename: 'video.mp4',
    downloadUrl: 'https://...',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    fileSize: 1024000,
    duration: 10,
    resolution: '1080x1920'
  });
}
*/
