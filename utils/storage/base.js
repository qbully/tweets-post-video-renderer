/**
 * StorageProvider - Base class/interface for storage implementations
 *
 * Defines the contract that all storage providers must implement.
 * This allows for swappable storage backends (local, S3, etc.)
 */
class StorageProvider {
  constructor(config = {}) {
    if (new.target === StorageProvider) {
      throw new Error('StorageProvider is an abstract class and cannot be instantiated directly');
    }
    this.config = config;
  }

  /**
   * Saves a file with metadata
   * @param {string} filename - The name of the file to save
   * @param {Buffer} buffer - The file content as a buffer
   * @param {Object} metadata - Optional metadata about the file
   * @returns {Promise<Object>} Object containing save result (path, size, etc.)
   */
  async save(filename, buffer, metadata = {}) {
    throw new Error('save() must be implemented by subclass');
  }

  /**
   * Retrieves a file
   * @param {string} filename - The name of the file to retrieve
   * @returns {Promise<Buffer>} The file content as a buffer
   */
  async get(filename) {
    throw new Error('get() must be implemented by subclass');
  }

  /**
   * Deletes a file
   * @param {string} filename - The name of the file to delete
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async delete(filename) {
    throw new Error('delete() must be implemented by subclass');
  }

  /**
   * Checks if a file exists
   * @param {string} filename - The name of the file to check
   * @returns {Promise<boolean>} True if file exists
   */
  async exists(filename) {
    throw new Error('exists() must be implemented by subclass');
  }

  /**
   * Lists all files in storage
   * @returns {Promise<Array>} Array of file information objects
   */
  async list() {
    throw new Error('list() must be implemented by subclass');
  }

  /**
   * Gets metadata for a file
   * @param {string} filename - The name of the file
   * @returns {Promise<Object>} Metadata object
   */
  async getMetadata(filename) {
    throw new Error('getMetadata() must be implemented by subclass');
  }
}

module.exports = { StorageProvider };
