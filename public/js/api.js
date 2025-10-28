/**
 * API Client
 * Handles all API communication with HMAC authentication
 */

const API = {
    /**
     * Generate HMAC signature for request
     * @param {number} timestamp - Unix timestamp
     * @param {Object} body - Request body
     * @param {string} secret - HMAC secret
     * @returns {Promise<string>} Hex-encoded signature
     */
    async generateSignature(timestamp, body, secret) {
        const encoder = new TextEncoder();
        const message = `${timestamp}:${JSON.stringify(body)}`;
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(message);

        // Import key
        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Sign message
        const signature = await crypto.subtle.sign('HMAC', key, messageData);

        // Convert to hex
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Make an authenticated API request
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} body - Request body (optional)
     * @returns {Promise<Object>} Response data
     */
    async request(method, endpoint, body = null) {
        const config = Config.load();
        const baseUrl = config.apiUrl.replace(/\/$/, ''); // Remove trailing slash
        const url = `${baseUrl}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json'
        };

        const options = {
            method,
            headers
        };

        // Add HMAC authentication for non-GET requests
        if (body) {
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = await this.generateSignature(timestamp, body, config.hmacSecret);

            headers['X-Signature'] = signature;
            headers['X-Timestamp'] = timestamp.toString();
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Cannot connect to API server. Is it running?');
            }
            throw error;
        }
    },

    /**
     * Test connection to API
     * @returns {Promise<Object>} Health check response
     */
    async testConnection() {
        const config = Config.load();
        const url = `${config.apiUrl}/health`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            throw new Error('Cannot connect to API');
        }
    },

    /**
     * Create a new video generation job
     * @param {Object} data - Video generation data
     * @returns {Promise<Object>} Job response
     */
    async createVideo(data) {
        return this.request('POST', '/generate-video', data);
    },

    /**
     * Get job status
     * @param {string} jobId - Job ID
     * @returns {Promise<Object>} Job status
     */
    async getJobStatus(jobId) {
        return this.request('GET', `/job/${jobId}`);
    },

    /**
     * Poll job until complete or failed
     * @param {string} jobId - Job ID
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Final job status
     */
    async pollJob(jobId, onProgress) {
        const maxAttempts = 120; // 10 minutes max
        const interval = 5000; // 5 seconds

        for (let i = 0; i < maxAttempts; i++) {
            const job = await this.getJobStatus(jobId);

            if (onProgress) {
                onProgress(job);
            }

            if (job.status === 'completed' || job.status === 'failed') {
                return job;
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, interval));
        }

        throw new Error('Job timed out');
    }
};
