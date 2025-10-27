const fs = require('fs').promises;
const path = require('path');
const { StorageProvider } = require('./base');

/**
 * LocalStorageProvider - File system-based storage implementation
 *
 * Stores video files and metadata on the local filesystem.
 * Designed for use with Railway volumes or any persistent local storage.
 */
class LocalStorageProvider extends StorageProvider {
  /**
   * Creates a LocalStorageProvider instance
   * @param {Object} config - Configuration object
   * @param {string} config.storagePath - Directory path for storing files (default: /data/videos)
   * @param {number} config.ttlHours - Time-to-live in hours for files (default: 24)
   */
  constructor(config = {}) {
    super(config);
    this.storagePath = config.storagePath || '/data/videos';
    this.ttlHours = config.ttlHours || 24;
    this.initialized = false;

    console.log(`[LocalStorageProvider] Configured with path: ${this.storagePath}, TTL: ${this.ttlHours} hours`);
  }

  /**
   * Ensures the storage directory exists
   * @private
   */
  async _ensureDirectory() {
    if (this.initialized) {
      return;
    }

    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      console.log(`[LocalStorageProvider] Storage directory ready: ${this.storagePath}`);
      this.initialized = true;
    } catch (error) {
      console.error(`[LocalStorageProvider] Failed to create storage directory: ${error.message}`);
      throw new Error(`Failed to initialize storage directory: ${error.message}`);
    }
  }

  /**
   * Gets the full path for a file
   * @private
   * @param {string} filename - The filename
   * @returns {string} Full file path
   */
  _getFilePath(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }
    // Sanitize filename to prevent directory traversal
    const sanitized = path.basename(filename);
    return path.join(this.storagePath, sanitized);
  }

  /**
   * Gets the metadata file path for a given file
   * @private
   * @param {string} filename - The filename
   * @returns {string} Metadata file path
   */
  _getMetadataPath(filename) {
    return `${this._getFilePath(filename)}.meta.json`;
  }

  /**
   * Checks if a file has expired based on TTL
   * @private
   * @param {Object} metadata - File metadata
   * @returns {boolean} True if file has expired
   */
  _isExpired(metadata) {
    if (!metadata || !metadata.createdAt) {
      return false;
    }

    const createdAt = new Date(metadata.createdAt);
    const expiresAt = new Date(createdAt.getTime() + this.ttlHours * 60 * 60 * 1000);
    const now = new Date();

    return now > expiresAt;
  }

  /**
   * Saves a file with metadata
   * @param {string} filename - The name of the file to save
   * @param {Buffer} buffer - The file content as a buffer
   * @param {Object} metadata - Optional metadata about the file
   * @returns {Promise<Object>} Object containing save result
   */
  async save(filename, buffer, metadata = {}) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Buffer is required and must be a Buffer instance');
    }

    await this._ensureDirectory();

    // Sanitize filename
    const sanitizedFilename = path.basename(filename);
    const filePath = this._getFilePath(sanitizedFilename);
    const metadataPath = this._getMetadataPath(sanitizedFilename);

    try {
      // Save the file
      await fs.writeFile(filePath, buffer);
      console.log(`[LocalStorageProvider] Saved file: ${sanitizedFilename} (${buffer.length} bytes)`);

      // Prepare and save metadata
      const now = new Date().toISOString();
      const fileMetadata = {
        filename: sanitizedFilename,
        size: buffer.length,
        createdAt: now,
        updatedAt: now,
        expiresAt: new Date(Date.now() + this.ttlHours * 60 * 60 * 1000).toISOString(),
        ttlHours: this.ttlHours,
        ...metadata,
      };

      await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));
      console.log(`[LocalStorageProvider] Saved metadata for: ${sanitizedFilename}`);

      return {
        path: filePath,
        size: buffer.length,
        filename: sanitizedFilename,
        metadata: fileMetadata,
      };
    } catch (error) {
      console.error(`[LocalStorageProvider] Failed to save file ${filename}: ${error.message}`);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Retrieves a file
   * @param {string} filename - The name of the file to retrieve
   * @returns {Promise<Buffer>} The file content as a buffer
   */
  async get(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    await this._ensureDirectory();

    const filePath = this._getFilePath(filename);

    try {
      // Check if file has expired
      const metadata = await this.getMetadata(filename);
      if (this._isExpired(metadata)) {
        console.warn(`[LocalStorageProvider] File ${filename} has expired, deleting`);
        await this.delete(filename);
        throw new Error(`File has expired: ${filename}`);
      }

      const buffer = await fs.readFile(filePath);
      console.log(`[LocalStorageProvider] Retrieved file: ${filename} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`[LocalStorageProvider] File not found: ${filename}`);
        throw new Error(`File not found: ${filename}`);
      }
      console.error(`[LocalStorageProvider] Failed to retrieve file ${filename}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a file and its metadata
   * @param {string} filename - The name of the file to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    await this._ensureDirectory();

    const filePath = this._getFilePath(filename);
    const metadataPath = this._getMetadataPath(filename);

    try {
      let deletedFile = false;
      let deletedMetadata = false;

      // Delete the file
      try {
        await fs.unlink(filePath);
        deletedFile = true;
        console.log(`[LocalStorageProvider] Deleted file: ${filename}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      // Delete the metadata
      try {
        await fs.unlink(metadataPath);
        deletedMetadata = true;
        console.log(`[LocalStorageProvider] Deleted metadata for: ${filename}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      const success = deletedFile || deletedMetadata;
      if (!success) {
        console.warn(`[LocalStorageProvider] File not found for deletion: ${filename}`);
      }

      return success;
    } catch (error) {
      console.error(`[LocalStorageProvider] Failed to delete file ${filename}: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Checks if a file exists
   * @param {string} filename - The name of the file to check
   * @returns {Promise<boolean>} True if file exists
   */
  async exists(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    await this._ensureDirectory();

    const filePath = this._getFilePath(filename);

    try {
      await fs.access(filePath);
      console.log(`[LocalStorageProvider] File exists: ${filename}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`[LocalStorageProvider] File does not exist: ${filename}`);
        return false;
      }
      console.error(`[LocalStorageProvider] Error checking file existence ${filename}: ${error.message}`);
      throw new Error(`Failed to check file existence: ${error.message}`);
    }
  }

  /**
   * Lists all files in storage (excluding expired files)
   * @returns {Promise<Array>} Array of file information objects
   */
  async list() {
    await this._ensureDirectory();

    try {
      const files = await fs.readdir(this.storagePath);
      const videoFiles = files.filter(f => !f.endsWith('.meta.json'));
      const fileList = [];

      for (const filename of videoFiles) {
        try {
          const metadata = await this.getMetadata(filename);

          // Skip expired files
          if (this._isExpired(metadata)) {
            console.log(`[LocalStorageProvider] Skipping expired file in list: ${filename}`);
            continue;
          }

          const filePath = this._getFilePath(filename);
          const stats = await fs.stat(filePath);

          fileList.push({
            filename,
            path: filePath,
            size: stats.size,
            createdAt: metadata.createdAt,
            expiresAt: metadata.expiresAt,
            metadata,
          });
        } catch (error) {
          console.warn(`[LocalStorageProvider] Error reading metadata for ${filename}: ${error.message}`);
          // Continue with next file
        }
      }

      console.log(`[LocalStorageProvider] Listed ${fileList.length} files (${videoFiles.length} total, excluding expired)`);
      return fileList;
    } catch (error) {
      console.error(`[LocalStorageProvider] Failed to list files: ${error.message}`);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Gets metadata for a file
   * @param {string} filename - The name of the file
   * @returns {Promise<Object>} Metadata object
   */
  async getMetadata(filename) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    await this._ensureDirectory();

    const metadataPath = this._getMetadataPath(filename);

    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);
      console.log(`[LocalStorageProvider] Retrieved metadata for: ${filename}`);
      return metadata;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.warn(`[LocalStorageProvider] Metadata not found for: ${filename}`);
        throw new Error(`Metadata not found: ${filename}`);
      }
      console.error(`[LocalStorageProvider] Failed to retrieve metadata for ${filename}: ${error.message}`);
      throw new Error(`Failed to retrieve metadata: ${error.message}`);
    }
  }

  /**
   * Cleanup expired files based on TTL
   * @returns {Promise<number>} Number of files deleted
   */
  async cleanupExpiredFiles() {
    await this._ensureDirectory();

    try {
      const allFiles = await fs.readdir(this.storagePath);
      const videoFiles = allFiles.filter(f => !f.endsWith('.meta.json'));
      let deletedCount = 0;

      for (const filename of videoFiles) {
        try {
          const metadata = await this.getMetadata(filename);

          if (this._isExpired(metadata)) {
            await this.delete(filename);
            deletedCount++;
            console.log(`[LocalStorageProvider] Cleaned up expired file: ${filename}`);
          }
        } catch (error) {
          console.warn(`[LocalStorageProvider] Error during cleanup of ${filename}: ${error.message}`);
          // Continue with next file
        }
      }

      console.log(`[LocalStorageProvider] Cleanup completed: removed ${deletedCount} expired files`);
      return deletedCount;
    } catch (error) {
      console.error(`[LocalStorageProvider] Failed to cleanup expired files: ${error.message}`);
      throw new Error(`Failed to cleanup expired files: ${error.message}`);
    }
  }
}

module.exports = { LocalStorageProvider };
