const fs = require('fs').promises;
const { existsSync } = require('fs');

class ChromeDetector {
  /**
   * Common Chrome/Chromium executable paths across different platforms
   */
  static COMMON_PATHS = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/opt/homebrew/bin/chromium',
    // Additional common paths
    '/usr/bin/google-chrome-stable',
    '/usr/local/bin/chromium',
    '/snap/bin/chromium',
    // macOS paths
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    // Windows paths (if running under WSL or similar)
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  /**
   * Detects Chrome/Chromium executable path on the system
   * @returns {Promise<{found: boolean, path: string|null}>}
   */
  static async detect() {
    try {
      // 1. Check PUPPETEER_EXECUTABLE_PATH environment variable first
      const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
      if (envPath) {
        console.log(`Checking PUPPETEER_EXECUTABLE_PATH: ${envPath}`);
        if (existsSync(envPath)) {
          console.log(`Found Chrome/Chromium at: ${envPath} (from environment variable)`);
          return { found: true, path: envPath };
        } else {
          console.warn(`PUPPETEER_EXECUTABLE_PATH is set but file does not exist: ${envPath}`);
        }
      }

      // 2. Try common paths
      console.log('Searching for Chrome/Chromium in common paths...');
      for (const path of this.COMMON_PATHS) {
        try {
          if (existsSync(path)) {
            console.log(`Found Chrome/Chromium at: ${path}`);
            return { found: true, path };
          }
        } catch (error) {
          // Skip paths that cause errors (e.g., permission issues)
          continue;
        }
      }

      // 3. Not found
      console.error('Chrome/Chromium executable not found in any common paths');
      console.error('Searched paths:', this.COMMON_PATHS);
      console.error('Please install Chrome/Chromium or set PUPPETEER_EXECUTABLE_PATH environment variable');
      return { found: false, path: null };
    } catch (error) {
      console.error('Error detecting Chrome/Chromium:', error.message);
      return { found: false, path: null };
    }
  }

  /**
   * Creates Puppeteer launch options with detected Chrome path
   * @param {boolean} headless - Whether to run in headless mode (default: true)
   * @returns {Promise<Object>} Puppeteer launch options
   * @throws {Error} If Chrome/Chromium executable is not found
   */
  static async createLaunchOptions(headless = true) {
    const detection = await this.detect();

    if (!detection.found || !detection.path) {
      throw new Error(
        'Chrome/Chromium executable not found. Please install Chrome/Chromium or set PUPPETEER_EXECUTABLE_PATH environment variable.'
      );
    }

    const options = {
      executablePath: detection.path,
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    };

    console.log('Created Puppeteer launch options:', {
      executablePath: options.executablePath,
      headless: options.headless,
      args: options.args,
    });

    return options;
  }
}

module.exports = { ChromeDetector };
