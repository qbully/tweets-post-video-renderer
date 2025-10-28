/**
 * UI Utilities
 * Helper functions for UI interactions
 */

const UI = {
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, info)
     * @param {number} duration - Duration in ms (default: 3000)
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✓',
            error: '✗',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show/hide modal
     * @param {string} modalId - Modal element ID
     * @param {boolean} show - Whether to show or hide
     */
    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    },

    /**
     * Update connection status indicator
     * @param {boolean} connected - Connection status
     */
    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connectionIndicator');
        const text = document.getElementById('connectionText');

        if (connected) {
            indicator.className = 'status-dot status-connected';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'status-dot status-disconnected';
            text.textContent = 'Disconnected';
        }
    },

    /**
     * Format date to relative time
     * @param {string} dateString - ISO date string
     * @returns {string} Relative time string
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    },

    /**
     * Format bytes to human readable
     * @param {number} bytes - Bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Escape HTML
     * @param {string} html - HTML string
     * @returns {string} Escaped string
     */
    escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    /**
     * Create job card HTML
     * @param {Object} job - Job object
     * @returns {string} HTML string
     */
    createJobCard(job) {
        const statusClass = `status-${job.status}`;
        const profileName = this.escapeHtml(job.profileName || 'Unknown');
        const username = this.escapeHtml(job.username || 'unknown');
        const tweetBody = this.escapeHtml(this.truncate(job.tweetBody || '', 100));

        let actionsHtml = '';
        let progressHtml = '';
        let errorHtml = '';

        if (job.status === 'processing' && job.progress !== undefined) {
            progressHtml = `
                <div class="job-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${job.progress}%"></div>
                    </div>
                    <div class="progress-text">${job.currentStep || 'Processing...'} - ${job.progress}%</div>
                </div>
            `;
        }

        if (job.status === 'completed') {
            actionsHtml = `
                <div class="job-actions">
                    <button class="btn btn-small btn-primary" onclick="App.downloadVideo('${job.jobId}')">
                        📥 Download Video
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="App.viewJobDetails('${job.jobId}')">
                        👁️ View Details
                    </button>
                </div>
            `;
        }

        if (job.status === 'failed' && job.error) {
            errorHtml = `
                <div class="job-error">
                    ❌ ${this.escapeHtml(job.error)}
                </div>
            `;
        }

        return `
            <div class="job-card" data-job-id="${job.jobId}">
                <div class="job-header">
                    <div class="job-info">
                        <div class="job-id">${job.jobId}</div>
                        <div class="job-meta">
                            <span>${this.formatRelativeTime(job.createdAt)}</span>
                            ${job.theme ? `<span>Theme: ${job.theme}</span>` : ''}
                        </div>
                    </div>
                    <div class="job-status ${statusClass}">${job.status}</div>
                </div>
                <div class="job-content">
                    <strong>${profileName}</strong> <span class="username">@${username}</span><br>
                    ${tweetBody}
                </div>
                ${progressHtml}
                ${actionsHtml}
                ${errorHtml}
            </div>
        `;
    }
};
