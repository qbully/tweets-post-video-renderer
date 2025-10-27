const crypto = require('crypto');

/**
 * Generates a secure random filename with timestamp and hash
 * @param {string} jobId - The job identifier (for logging/tracking)
 * @param {string} extension - File extension (without dot)
 * @returns {string} Secure filename in format: YYYY-MM-DD_randomhash.extension
 */
function generateSecureFilename(jobId, extension) {
  // Validate inputs
  if (!jobId || typeof jobId !== 'string') {
    throw new Error('Invalid jobId: must be a non-empty string');
  }

  if (!extension || typeof extension !== 'string') {
    throw new Error('Invalid extension: must be a non-empty string');
  }

  // Sanitize extension - remove leading dot if present and validate
  const sanitizedExtension = extension.replace(/^\.+/, '').toLowerCase();

  // Only allow alphanumeric characters in extension
  if (!/^[a-z0-9]+$/.test(sanitizedExtension)) {
    throw new Error('Invalid extension: must contain only alphanumeric characters');
  }

  // Generate timestamp in YYYY-MM-DD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day}`;

  // Generate cryptographically secure random hash (12 characters)
  const randomBytes = crypto.randomBytes(9); // 9 bytes = 12 base64 characters
  const randomHash = randomBytes
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .substring(0, 12)
    .toLowerCase();

  // Construct filename
  const filename = `${timestamp}_${randomHash}.${sanitizedExtension}`;

  console.log(`[URL Generator] Generated secure filename for job ${jobId}: ${filename}`);

  return filename;
}

/**
 * Generates a complete download URL
 * @param {string} baseUrl - Base URL (e.g., https://api.example.com)
 * @param {string} filename - The filename to append
 * @returns {string} Complete download URL
 */
function generateDownloadUrl(baseUrl, filename) {
  // Validate inputs
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('Invalid baseUrl: must be a non-empty string');
  }

  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: must be a non-empty string');
  }

  // Validate filename before using it
  if (!isValidFilename(filename)) {
    console.error(`[URL Generator] Attempted to generate URL with invalid filename: ${filename}`);
    throw new Error('Invalid filename: failed security validation');
  }

  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  // Construct download URL
  const downloadUrl = `${cleanBaseUrl}/download/${filename}`;

  console.log(`[URL Generator] Generated download URL: ${downloadUrl}`);

  return downloadUrl;
}

/**
 * Validates filename format and security
 * @param {string} filename - The filename to validate
 * @returns {boolean} True if filename is valid and secure
 */
function isValidFilename(filename) {
  // Check if filename exists and is a string
  if (!filename || typeof filename !== 'string') {
    console.warn('[URL Generator] Validation failed: filename is not a string');
    return false;
  }

  // Check filename length (prevent extremely long filenames)
  if (filename.length > 255) {
    console.warn(`[URL Generator] Validation failed: filename too long (${filename.length} characters)`);
    return false;
  }

  if (filename.length < 3) {
    console.warn(`[URL Generator] Validation failed: filename too short (${filename.length} characters)`);
    return false;
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    console.error(`[URL Generator] SECURITY: Path traversal attempt detected in filename: ${filename}`);
    return false;
  }

  // Check for null bytes (another path traversal technique)
  if (filename.includes('\0')) {
    console.error(`[URL Generator] SECURITY: Null byte detected in filename: ${filename}`);
    return false;
  }

  // Only allow alphanumeric characters, hyphens, underscores, and dots
  if (!/^[a-zA-Z0-9\-_.]+$/.test(filename)) {
    console.warn(`[URL Generator] Validation failed: filename contains invalid characters: ${filename}`);
    return false;
  }

  // Must have an extension
  const parts = filename.split('.');
  if (parts.length < 2) {
    console.warn(`[URL Generator] Validation failed: filename has no extension: ${filename}`);
    return false;
  }

  // Check for multiple consecutive dots (suspicious)
  if (filename.includes('..')) {
    console.error(`[URL Generator] SECURITY: Multiple consecutive dots detected: ${filename}`);
    return false;
  }

  // Validate extension - must be .mp4 for video files
  const extension = parts[parts.length - 1].toLowerCase();
  const allowedExtensions = ['mp4', 'mov', 'avi', 'webm']; // Add more if needed

  if (!allowedExtensions.includes(extension)) {
    console.warn(`[URL Generator] Validation failed: invalid extension .${extension} (allowed: ${allowedExtensions.join(', ')})`);
    return false;
  }

  // Check that filename doesn't start or end with dot
  if (filename.startsWith('.') || filename.endsWith('.')) {
    console.warn(`[URL Generator] Validation failed: filename starts or ends with dot: ${filename}`);
    return false;
  }

  // All checks passed
  return true;
}

/**
 * Sanitizes a filename by removing or replacing dangerous characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  // Check if filename exists and is a string
  if (!filename || typeof filename !== 'string') {
    console.warn('[URL Generator] Sanitization received invalid input, returning default');
    return 'untitled.mp4';
  }

  // Convert to lowercase
  let sanitized = filename.toLowerCase();

  // Remove any path components (security)
  sanitized = sanitized.split('/').pop();
  sanitized = sanitized.split('\\').pop();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Replace spaces with hyphens
  sanitized = sanitized.replace(/\s+/g, '-');

  // Remove any characters that are not alphanumeric, hyphen, underscore, or dot
  sanitized = sanitized.replace(/[^a-z0-9\-_.]/g, '');

  // Replace multiple consecutive hyphens with single hyphen
  sanitized = sanitized.replace(/-+/g, '-');

  // Replace multiple consecutive underscores with single underscore
  sanitized = sanitized.replace(/_+/g, '_');

  // Replace multiple consecutive dots with single dot (but preserve extension)
  sanitized = sanitized.replace(/\.+/g, '.');

  // Remove leading and trailing hyphens, underscores, or dots
  sanitized = sanitized.replace(/^[-_.]+/, '');
  sanitized = sanitized.replace(/[-_.]+$/, '');

  // Ensure there's an extension, if not add .mp4
  if (!sanitized.includes('.')) {
    sanitized = `${sanitized}.mp4`;
  }

  // Truncate if too long (keep extension intact)
  const maxLength = 200;
  if (sanitized.length > maxLength) {
    const parts = sanitized.split('.');
    const extension = parts.pop();
    const basename = parts.join('.');
    const truncatedBasename = basename.substring(0, maxLength - extension.length - 1);
    sanitized = `${truncatedBasename}.${extension}`;
  }

  // If sanitization resulted in empty string or just extension, provide default
  if (!sanitized || sanitized.startsWith('.') || sanitized.length < 3) {
    console.warn(`[URL Generator] Sanitization resulted in invalid filename, using default. Original: ${filename}`);
    sanitized = 'untitled.mp4';
  }

  console.log(`[URL Generator] Sanitized filename: "${filename}" -> "${sanitized}"`);

  return sanitized;
}

// Export all functions
module.exports = {
  generateSecureFilename,
  generateDownloadUrl,
  isValidFilename,
  sanitizeFilename
};
