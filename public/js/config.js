/**
 * Configuration Management
 * Handles saving/loading settings from localStorage
 */

const Config = {
    // Storage key
    STORAGE_KEY: 'twitter_video_gen_config',

    // Default configuration
    defaults: {
        apiUrl: 'http://localhost:3000',
        hmacSecret: '',
        defaultProfileName: '',
        defaultUsername: '',
        defaultProfilePhotoUrl: ''
    },

    /**
     * Load configuration from localStorage
     * @returns {Object} Configuration object
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const config = JSON.parse(stored);
                return { ...this.defaults, ...config };
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
        return { ...this.defaults };
    },

    /**
     * Save configuration to localStorage
     * @param {Object} config - Configuration object to save
     */
    save(config) {
        try {
            const toSave = { ...this.defaults, ...config };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    },

    /**
     * Get a specific config value
     * @param {string} key - Config key
     * @returns {*} Config value
     */
    get(key) {
        const config = this.load();
        return config[key];
    },

    /**
     * Set a specific config value
     * @param {string} key - Config key
     * @param {*} value - Config value
     */
    set(key, value) {
        const config = this.load();
        config[key] = value;
        this.save(config);
    },

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.save(this.defaults);
    },

    /**
     * Check if configuration is valid
     * @returns {Object} { valid: boolean, missing: Array }
     */
    validate() {
        const config = this.load();
        const missing = [];

        if (!config.apiUrl) missing.push('API URL');
        if (!config.hmacSecret) missing.push('HMAC Secret');

        return {
            valid: missing.length === 0,
            missing
        };
    }
};

// Jobs history management
const JobsHistory = {
    STORAGE_KEY: 'twitter_video_gen_jobs',
    MAX_JOBS: 50,

    /**
     * Load all jobs from localStorage
     * @returns {Array} Array of job objects
     */
    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading jobs:', error);
        }
        return [];
    },

    /**
     * Save jobs to localStorage
     * @param {Array} jobs - Array of job objects
     */
    save(jobs) {
        try {
            // Keep only the latest MAX_JOBS
            const toSave = jobs.slice(0, this.MAX_JOBS);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
        } catch (error) {
            console.error('Error saving jobs:', error);
        }
    },

    /**
     * Add a new job
     * @param {Object} job - Job object
     */
    add(job) {
        const jobs = this.load();
        jobs.unshift(job); // Add to beginning
        this.save(jobs);
    },

    /**
     * Update an existing job
     * @param {string} jobId - Job ID
     * @param {Object} updates - Updates to apply
     */
    update(jobId, updates) {
        const jobs = this.load();
        const index = jobs.findIndex(j => j.jobId === jobId);
        if (index !== -1) {
            jobs[index] = { ...jobs[index], ...updates };
            this.save(jobs);
        }
    },

    /**
     * Get a specific job
     * @param {string} jobId - Job ID
     * @returns {Object|null} Job object or null
     */
    get(jobId) {
        const jobs = this.load();
        return jobs.find(j => j.jobId === jobId) || null;
    },

    /**
     * Clear all jobs
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
