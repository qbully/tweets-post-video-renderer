const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

/**
 * FFmpeg Detector Utility
 * Detects and verifies FFmpeg installation on the system
 */
class FFmpegDetector {
  /**
   * Common paths where FFmpeg might be installed
   */
  static COMMON_PATHS = [
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    'ffmpeg' // System PATH
  ];

  /**
   * Timeout for FFmpeg verification commands (in milliseconds)
   */
  static VERIFICATION_TIMEOUT = 5000;

  /**
   * Verify if a given FFmpeg path is valid by running ffmpeg -version
   * @param {string} ffmpegPath - Path to FFmpeg binary
   * @returns {Promise<boolean>} - True if valid, false otherwise
   */
  static async verify(ffmpegPath) {
    if (!ffmpegPath || typeof ffmpegPath !== 'string') {
      console.log('[FFmpegDetector] Invalid path provided for verification');
      return false;
    }

    try {
      console.log(`[FFmpegDetector] Verifying FFmpeg at: ${ffmpegPath}`);

      const { stdout, stderr } = await execAsync(`"${ffmpegPath}" -version`, {
        timeout: this.VERIFICATION_TIMEOUT,
        windowsHide: true
      });

      // Check if output contains FFmpeg version information
      const output = stdout + stderr;
      if (output.includes('ffmpeg version')) {
        console.log(`[FFmpegDetector] ✓ Valid FFmpeg found at: ${ffmpegPath}`);

        // Extract and log version info (first line)
        const versionLine = output.split('\n')[0];
        console.log(`[FFmpegDetector] ${versionLine}`);

        return true;
      }

      console.log(`[FFmpegDetector] ✗ Path exists but not a valid FFmpeg binary: ${ffmpegPath}`);
      return false;
    } catch (error) {
      // Handle different types of errors
      if (error.code === 'ENOENT') {
        console.log(`[FFmpegDetector] ✗ FFmpeg not found at: ${ffmpegPath}`);
      } else if (error.killed || error.signal === 'SIGTERM') {
        console.log(`[FFmpegDetector] ✗ Verification timeout for: ${ffmpegPath}`);
      } else {
        console.log(`[FFmpegDetector] ✗ Verification failed for ${ffmpegPath}: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Check if a file exists at the given path
   * @param {string} filePath - Path to check
   * @returns {Promise<boolean>} - True if file exists, false otherwise
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath, fs.constants.F_OK | fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Detect FFmpeg installation on the system
   * @returns {Promise<{found: boolean, path: string|null}>} - Detection result
   */
  static async detect() {
    console.log('[FFmpegDetector] Starting FFmpeg detection...');

    // Step 1: Check FFMPEG_PATH environment variable first
    const envPath = process.env.FFMPEG_PATH;
    if (envPath) {
      console.log(`[FFmpegDetector] Checking FFMPEG_PATH environment variable: ${envPath}`);
      const isValid = await this.verify(envPath);
      if (isValid) {
        console.log('[FFmpegDetector] FFmpeg detection complete - found via FFMPEG_PATH');
        return { found: true, path: envPath };
      }
      console.log('[FFmpegDetector] FFMPEG_PATH is set but not valid, trying common paths...');
    } else {
      console.log('[FFmpegDetector] FFMPEG_PATH environment variable not set');
    }

    // Step 2: Try common installation paths
    console.log('[FFmpegDetector] Checking common installation paths...');
    for (const commonPath of this.COMMON_PATHS) {
      // For absolute paths, check if file exists before verification to save time
      if (path.isAbsolute(commonPath)) {
        const exists = await this.fileExists(commonPath);
        if (!exists) {
          console.log(`[FFmpegDetector] File not found: ${commonPath}`);
          continue;
        }
      }

      const isValid = await this.verify(commonPath);
      if (isValid) {
        console.log('[FFmpegDetector] FFmpeg detection complete - found via common paths');
        return { found: true, path: commonPath };
      }
    }

    // Step 3: FFmpeg not found
    console.log('[FFmpegDetector] ✗ FFmpeg not found on system');
    console.log('[FFmpegDetector] Searched locations:');
    if (envPath) {
      console.log(`  - FFMPEG_PATH: ${envPath}`);
    }
    this.COMMON_PATHS.forEach(p => console.log(`  - ${p}`));
    console.log('[FFmpegDetector] Please install FFmpeg or set FFMPEG_PATH environment variable');

    return { found: false, path: null };
  }

  /**
   * Detect FFmpeg and throw error if not found
   * @returns {Promise<string>} - Path to FFmpeg binary
   * @throws {Error} - If FFmpeg is not found
   */
  static async detectOrThrow() {
    const result = await this.detect();
    if (!result.found) {
      throw new Error(
        'FFmpeg not found on system. Please install FFmpeg or set FFMPEG_PATH environment variable.'
      );
    }
    return result.path;
  }
}

module.exports = { FFmpegDetector };
