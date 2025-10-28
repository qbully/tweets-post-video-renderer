/**
 * Main Application Logic
 */

const App = {
    pollingJobs: new Set(),

    /**
     * Initialize the application
     */
    async init() {
        this.setupEventListeners();
        this.loadSettings();
        await this.checkConnection();
        this.loadJobs();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        // Close settings
        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            UI.toggleModal('settingsModal', false);
        });

        // Settings form
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Reset settings
        document.getElementById('resetSettingsBtn').addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                this.resetSettings();
            }
        });

        // Video form
        document.getElementById('videoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createVideo();
        });

        // Use defaults button
        document.getElementById('useDefaultsBtn').addEventListener('click', () => {
            this.useDefaults();
        });

        // Clear form button
        document.getElementById('clearFormBtn').addEventListener('click', () => {
            this.clearForm();
        });

        // Refresh jobs button
        document.getElementById('refreshJobsBtn').addEventListener('click', () => {
            this.loadJobs();
        });

        // Character counter
        document.getElementById('tweetBody').addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('charCount').textContent = count;
        });

        // Close modal on outside click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                UI.toggleModal('settingsModal', false);
            }
        });
    },

    /**
     * Check API connection
     */
    async checkConnection() {
        try {
            const health = await API.testConnection();
            UI.updateConnectionStatus(true);
            console.log('API connected:', health);
        } catch (error) {
            UI.updateConnectionStatus(false);
            console.error('API connection failed:', error);
        }
    },

    /**
     * Open settings modal
     */
    openSettings() {
        const config = Config.load();
        document.getElementById('apiUrl').value = config.apiUrl || '';
        document.getElementById('hmacSecret').value = config.hmacSecret || '';
        document.getElementById('defaultProfileName').value = config.defaultProfileName || '';
        document.getElementById('defaultUsername').value = config.defaultUsername || '';
        document.getElementById('defaultProfilePhotoUrl').value = config.defaultProfilePhotoUrl || '';

        UI.toggleModal('settingsModal', true);
    },

    /**
     * Save settings
     */
    saveSettings() {
        const config = {
            apiUrl: document.getElementById('apiUrl').value.trim(),
            hmacSecret: document.getElementById('hmacSecret').value.trim(),
            defaultProfileName: document.getElementById('defaultProfileName').value.trim(),
            defaultUsername: document.getElementById('defaultUsername').value.trim(),
            defaultProfilePhotoUrl: document.getElementById('defaultProfilePhotoUrl').value.trim()
        };

        Config.save(config);
        UI.toggleModal('settingsModal', false);
        UI.showToast('Settings saved successfully!', 'success');
        this.checkConnection();
    },

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        Config.reset();
        this.openSettings();
        UI.showToast('Settings reset to defaults', 'info');
    },

    /**
     * Load settings into form
     */
    loadSettings() {
        const validation = Config.validate();
        if (!validation.valid) {
            UI.showToast('Please configure your settings first', 'error', 5000);
            setTimeout(() => this.openSettings(), 500);
        }
    },

    /**
     * Use default values in form
     */
    useDefaults() {
        const config = Config.load();

        if (config.defaultProfileName) {
            document.getElementById('profileName').value = config.defaultProfileName;
        }
        if (config.defaultUsername) {
            document.getElementById('username').value = config.defaultUsername;
        }
        if (config.defaultProfilePhotoUrl) {
            document.getElementById('profilePhotoUrl').value = config.defaultProfilePhotoUrl;
        }

        UI.showToast('Default values loaded', 'success');
    },

    /**
     * Clear the video form
     */
    clearForm() {
        document.getElementById('videoForm').reset();
        document.getElementById('charCount').textContent = '0';
    },

    /**
     * Create a new video
     */
    async createVideo() {
        // Validate settings
        const validation = Config.validate();
        if (!validation.valid) {
            UI.showToast(`Missing settings: ${validation.missing.join(', ')}`, 'error');
            this.openSettings();
            return;
        }

        // Get form data
        const formData = {
            profileName: document.getElementById('profileName').value.trim(),
            username: document.getElementById('username').value.trim(),
            profilePhotoUrl: document.getElementById('profilePhotoUrl').value.trim(),
            tweetBody: document.getElementById('tweetBody').value,
            theme: document.querySelector('input[name="theme"]:checked').value
        };

        // Validate form
        if (!formData.profileName || !formData.username || !formData.profilePhotoUrl || !formData.tweetBody) {
            UI.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            // Disable submit button
            const submitBtn = document.querySelector('#videoForm button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            // Create video
            const response = await API.createVideo(formData);

            // Add to jobs history
            const job = {
                jobId: response.jobId,
                status: response.status,
                createdAt: response.createdAt,
                ...formData,
                progress: 0
            };

            JobsHistory.add(job);
            this.loadJobs();

            // Start polling
            this.startPolling(response.jobId);

            UI.showToast('Video generation started!', 'success');

            // Clear form
            this.clearForm();

        } catch (error) {
            UI.showToast(`Error: ${error.message}`, 'error', 5000);
        } finally {
            // Re-enable submit button
            const submitBtn = document.querySelector('#videoForm button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Generate Video';
        }
    },

    /**
     * Start polling a job
     */
    async startPolling(jobId) {
        if (this.pollingJobs.has(jobId)) {
            return; // Already polling
        }

        this.pollingJobs.add(jobId);

        try {
            await API.pollJob(jobId, (job) => {
                // Update job in history
                JobsHistory.update(jobId, {
                    status: job.status,
                    progress: job.progress,
                    currentStep: job.currentStep,
                    downloadUrl: job.downloadUrl,
                    fileSize: job.fileSize,
                    error: job.error
                });

                // Update UI
                this.loadJobs();
            });

            UI.showToast('Video generation completed!', 'success');
        } catch (error) {
            console.error('Polling error:', error);
            UI.showToast(`Job error: ${error.message}`, 'error');
        } finally {
            this.pollingJobs.delete(jobId);
        }
    },

    /**
     * Load and display jobs
     */
    loadJobs() {
        const jobs = JobsHistory.load();
        const container = document.getElementById('jobsList');

        if (jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No jobs yet. Create your first video above!</p>
                </div>
            `;
            return;
        }

        // Render jobs
        container.innerHTML = jobs.map(job => UI.createJobCard(job)).join('');

        // Resume polling for processing jobs
        jobs.forEach(job => {
            if (job.status === 'processing' || job.status === 'pending') {
                this.startPolling(job.jobId);
            }
        });
    },

    /**
     * Download video
     */
    async downloadVideo(jobId) {
        const job = JobsHistory.get(jobId);
        if (!job || !job.downloadUrl) {
            UI.showToast('Download URL not available', 'error');
            return;
        }

        try {
            // Open download URL in new tab
            window.open(job.downloadUrl, '_blank');
            UI.showToast('Starting download...', 'success');
        } catch (error) {
            UI.showToast(`Download failed: ${error.message}`, 'error');
        }
    },

    /**
     * View job details
     */
    viewJobDetails(jobId) {
        const job = JobsHistory.get(jobId);
        if (!job) {
            UI.showToast('Job not found', 'error');
            return;
        }

        const details = `
Job ID: ${job.jobId}
Status: ${job.status}
Created: ${new Date(job.createdAt).toLocaleString()}
Profile: ${job.profileName} (@${job.username})
Theme: ${job.theme}
${job.fileSize ? `File Size: ${UI.formatBytes(job.fileSize)}` : ''}
${job.downloadUrl ? `Download URL: ${job.downloadUrl}` : ''}
${job.error ? `Error: ${job.error}` : ''}
        `.trim();

        alert(details);
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
