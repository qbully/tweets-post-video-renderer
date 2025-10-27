const { v4: uuidv4 } = require('uuid');

/**
 * JobManager - Manages video generation job lifecycle
 *
 * Provides in-memory storage and management for video generation jobs
 * with full lifecycle tracking, progress monitoring, and cleanup capabilities.
 */
class JobManager {
  constructor() {
    this.jobs = new Map();
    console.log('[JobManager] Initialized with empty job store');
  }

  /**
   * Creates a new job with pending status
   * @param {Object} requestData - The request data containing tweetBody, profilePhotoUrl, profileName, username, theme
   * @returns {string} jobId - The UUID of the created job
   */
  createJob(requestData) {
    if (!requestData) {
      throw new Error('Request data is required to create a job');
    }

    const jobId = uuidv4();
    const now = new Date().toISOString();

    const job = {
      jobId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      request: {
        tweetBody: requestData.tweetBody || null,
        profilePhotoUrl: requestData.profilePhotoUrl || null,
        profileName: requestData.profileName || null,
        username: requestData.username || null,
        theme: requestData.theme || null,
      },
      result: null,
      error: null,
      currentStep: null,
      progress: 0,
    };

    this.jobs.set(jobId, job);
    console.log(`[JobManager] Created job ${jobId} with status: pending`);
    console.log(`[JobManager] Request data:`, JSON.stringify(job.request, null, 2));

    return jobId;
  }

  /**
   * Retrieves a job by its ID
   * @param {string} jobId - The UUID of the job
   * @returns {Object|null} The job object or null if not found
   */
  getJob(jobId) {
    if (!jobId) {
      console.warn('[JobManager] getJob called with empty jobId');
      return null;
    }

    const job = this.jobs.get(jobId);

    if (!job) {
      console.warn(`[JobManager] Job ${jobId} not found`);
      return null;
    }

    return { ...job }; // Return a copy to prevent external mutations
  }

  /**
   * Updates job status and optionally merges additional data
   * @param {string} jobId - The UUID of the job
   * @param {string} status - New status: 'pending' | 'processing' | 'completed' | 'failed'
   * @param {Object} additionalData - Optional additional data to merge into job
   */
  updateJobStatus(jobId, status, additionalData = {}) {
    if (!jobId) {
      throw new Error('jobId is required');
    }

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: pending, processing, completed, failed`);
    }

    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const oldStatus = job.status;
    job.status = status;
    job.updatedAt = new Date().toISOString();

    // Merge additional data
    Object.assign(job, additionalData);

    // Set completedAt for terminal states
    if ((status === 'completed' || status === 'failed') && !job.completedAt) {
      job.completedAt = new Date().toISOString();
    }

    console.log(`[JobManager] Job ${jobId} status changed: ${oldStatus} -> ${status}`);

    if (Object.keys(additionalData).length > 0) {
      console.log(`[JobManager] Additional data merged:`, JSON.stringify(additionalData, null, 2));
    }
  }

  /**
   * Updates job progress with current step and percentage
   * @param {string} jobId - The UUID of the job
   * @param {string} step - Current step description
   * @param {number} percentage - Progress percentage (0-100)
   */
  updateJobProgress(jobId, step, percentage) {
    if (!jobId) {
      throw new Error('jobId is required');
    }

    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      throw new Error(`Invalid percentage: ${percentage}. Must be between 0 and 100`);
    }

    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    job.currentStep = step;
    job.progress = percentage;
    job.updatedAt = new Date().toISOString();

    console.log(`[JobManager] Job ${jobId} progress: ${percentage}% - ${step}`);
  }

  /**
   * Marks a job as completed with result data
   * @param {string} jobId - The UUID of the job
   * @param {Object} resultData - Result data containing filename, downloadUrl, expiresAt, fileSize, duration, resolution
   */
  setJobCompleted(jobId, resultData) {
    if (!jobId) {
      throw new Error('jobId is required');
    }

    if (!resultData) {
      throw new Error('resultData is required');
    }

    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const now = new Date().toISOString();

    job.status = 'completed';
    job.updatedAt = now;
    job.completedAt = now;
    job.progress = 100;
    job.currentStep = 'Completed';
    job.result = {
      filename: resultData.filename || null,
      downloadUrl: resultData.downloadUrl || null,
      expiresAt: resultData.expiresAt || null,
      fileSize: resultData.fileSize || null,
      duration: resultData.duration || null,
      resolution: resultData.resolution || null,
    };
    job.error = null; // Clear any previous errors

    console.log(`[JobManager] Job ${jobId} completed successfully`);
    console.log(`[JobManager] Result:`, JSON.stringify(job.result, null, 2));
  }

  /**
   * Marks a job as failed with error information
   * @param {string} jobId - The UUID of the job
   * @param {string} errorMessage - Error message
   * @param {string} errorStack - Optional error stack trace
   */
  setJobFailed(jobId, errorMessage, errorStack = null) {
    if (!jobId) {
      throw new Error('jobId is required');
    }

    if (!errorMessage) {
      throw new Error('errorMessage is required');
    }

    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const now = new Date().toISOString();

    job.status = 'failed';
    job.updatedAt = now;
    job.completedAt = now;
    job.error = {
      message: errorMessage,
      stack: errorStack,
      failedAt: now,
    };
    job.result = null; // Clear any partial results

    console.error(`[JobManager] Job ${jobId} failed: ${errorMessage}`);

    if (errorStack) {
      console.error(`[JobManager] Stack trace:`, errorStack);
    }
  }

  /**
   * Retrieves all jobs
   * @returns {Array} Array of all job objects
   */
  getAllJobs() {
    const jobs = Array.from(this.jobs.values());
    console.log(`[JobManager] Retrieved all jobs: ${jobs.length} total`);
    return jobs.map(job => ({ ...job })); // Return copies
  }

  /**
   * Retrieves jobs filtered by status
   * @param {string} status - Status to filter by: 'pending' | 'processing' | 'completed' | 'failed'
   * @returns {Array} Array of job objects with matching status
   */
  getJobsByStatus(status) {
    if (!status) {
      throw new Error('status is required');
    }

    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: pending, processing, completed, failed`);
    }

    const jobs = Array.from(this.jobs.values()).filter(job => job.status === status);
    console.log(`[JobManager] Retrieved jobs with status '${status}': ${jobs.length} found`);
    return jobs.map(job => ({ ...job })); // Return copies
  }

  /**
   * Removes jobs older than specified hours
   * @param {number} olderThanHours - Remove jobs older than this many hours
   * @returns {number} Number of jobs removed
   */
  cleanupExpiredJobs(olderThanHours) {
    if (typeof olderThanHours !== 'number' || olderThanHours <= 0) {
      throw new Error(`Invalid olderThanHours: ${olderThanHours}. Must be a positive number`);
    }

    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      const jobCreatedAt = new Date(job.createdAt);

      if (jobCreatedAt < cutoffTime) {
        this.jobs.delete(jobId);
        removedCount++;
        console.log(`[JobManager] Removed expired job ${jobId} (created at ${job.createdAt})`);
      }
    }

    console.log(`[JobManager] Cleanup completed: removed ${removedCount} jobs older than ${olderThanHours} hours`);
    return removedCount;
  }

  /**
   * Gets statistics about jobs by status
   * @returns {Object} Object with counts for each status and total
   */
  getStats() {
    const stats = {
      total: this.jobs.size,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    for (const job of this.jobs.values()) {
      if (stats.hasOwnProperty(job.status)) {
        stats[job.status]++;
      }
    }

    console.log(`[JobManager] Stats:`, JSON.stringify(stats, null, 2));
    return stats;
  }

  /**
   * Clears all jobs from the store (useful for testing/reset)
   * @returns {number} Number of jobs cleared
   */
  clearAllJobs() {
    const count = this.jobs.size;
    this.jobs.clear();
    console.log(`[JobManager] Cleared all jobs: ${count} jobs removed`);
    return count;
  }
}

// Export singleton instance
const jobManager = new JobManager();

module.exports = { JobManager, jobManager };
