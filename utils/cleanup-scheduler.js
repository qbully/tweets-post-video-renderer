/**
 * CleanupScheduler - Automated cleanup utility for expired files and jobs
 *
 * This scheduler runs periodic cleanup operations to remove expired files
 * from storage and clean up old job records from the job manager.
 */

class CleanupScheduler {
  /**
   * Creates a new CleanupScheduler instance
   *
   * @param {Object} storageProvider - Storage instance with cleanupExpiredFiles method
   * @param {Object} jobManager - Job manager instance with cleanupExpiredJobs method
   * @param {number} intervalMinutes - Cleanup interval in minutes (default: 60)
   * @param {number} jobRetentionHours - Hours to retain completed jobs (default: 72)
   */
  constructor(storageProvider, jobManager, intervalMinutes = 60, jobRetentionHours = 72) {
    this.storageProvider = storageProvider;
    this.jobManager = jobManager;
    this.intervalMinutes = intervalMinutes;
    this.jobRetentionHours = jobRetentionHours;
    this.intervalId = null;
    this.isRunning = false;

    this._log('Cleanup scheduler initialized', {
      intervalMinutes: this.intervalMinutes,
      jobRetentionHours: this.jobRetentionHours
    });
  }

  /**
   * Starts the cleanup scheduler
   * Runs cleanup immediately and then at specified intervals
   */
  start() {
    if (this.isRunning) {
      this._log('Cleanup scheduler already running', {}, 'warn');
      return;
    }

    this._log('Starting cleanup scheduler');
    this.isRunning = true;

    // Run cleanup immediately on start
    this.cleanup().catch(err => {
      this._log('Error during initial cleanup', { error: err.message }, 'error');
    });

    // Schedule recurring cleanups
    const intervalMs = this.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.cleanup().catch(err => {
        this._log('Error during scheduled cleanup', { error: err.message }, 'error');
      });
    }, intervalMs);

    this._log('Cleanup scheduler started', {
      nextRunIn: `${this.intervalMinutes} minutes`
    });
  }

  /**
   * Stops the cleanup scheduler
   */
  stop() {
    if (!this.isRunning) {
      this._log('Cleanup scheduler not running', {}, 'warn');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this._log('Cleanup scheduler stopped');
  }

  /**
   * Performs cleanup operation
   * Removes expired files and cleans up old jobs
   *
   * @returns {Promise<Object>} Cleanup results with files and jobs removed counts
   */
  async cleanup() {
    this._log('Starting cleanup operation');

    const results = {
      filesRemoved: 0,
      jobsCleaned: 0,
      errors: []
    };

    // Cleanup expired files from storage
    try {
      this._log('Cleaning up expired files from storage');
      const filesResult = await this.storageProvider.cleanupExpiredFiles();
      results.filesRemoved = filesResult.removedCount || 0;

      this._log('File cleanup completed', {
        filesRemoved: results.filesRemoved
      });
    } catch (error) {
      const errorMsg = `Failed to cleanup expired files: ${error.message}`;
      results.errors.push(errorMsg);
      this._log('File cleanup failed', {
        error: error.message,
        stack: error.stack
      }, 'error');
    }

    // Cleanup expired jobs from job manager
    try {
      this._log('Cleaning up expired jobs', {
        retentionHours: this.jobRetentionHours
      });
      const jobsResult = await this.jobManager.cleanupExpiredJobs(this.jobRetentionHours);
      results.jobsCleaned = jobsResult.cleanedCount || 0;

      this._log('Job cleanup completed', {
        jobsCleaned: results.jobsCleaned
      });
    } catch (error) {
      const errorMsg = `Failed to cleanup expired jobs: ${error.message}`;
      results.errors.push(errorMsg);
      this._log('Job cleanup failed', {
        error: error.message,
        stack: error.stack
      }, 'error');
    }

    // Log final results
    const logLevel = results.errors.length > 0 ? 'warn' : 'info';
    this._log('Cleanup operation completed', {
      filesRemoved: results.filesRemoved,
      jobsCleaned: results.jobsCleaned,
      errorsCount: results.errors.length,
      errors: results.errors.length > 0 ? results.errors : undefined
    }, logLevel);

    return results;
  }

  /**
   * Internal logging method with timestamps and structured output
   *
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   * @param {string} level - Log level (info, warn, error)
   * @private
   */
  _log(message, data = {}, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      component: 'CleanupScheduler',
      message,
      ...data
    };

    const consoleMethod = console[level] || console.log;
    consoleMethod(JSON.stringify(logEntry));
  }

  /**
   * Gets the current status of the scheduler
   *
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      jobRetentionHours: this.jobRetentionHours,
      hasActiveInterval: this.intervalId !== null
    };
  }
}

module.exports = { CleanupScheduler };
