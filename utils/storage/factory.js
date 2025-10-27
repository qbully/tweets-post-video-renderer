const { LocalStorageProvider } = require('./local');

/**
 * Creates a storage provider based on configuration
 *
 * Factory function for instantiating storage providers with environment-based config.
 * Supports multiple storage backends (currently: local, can be extended for S3, etc.)
 */

/**
 * Creates a storage provider instance
 * @param {string} type - The type of storage provider ('local')
 * @param {Object} config - Optional configuration object to override defaults
 * @returns {StorageProvider} Storage provider instance
 */
function createStorageProvider(type = null, config = {}) {
  // Use environment variable if type not specified
  const providerType = type || process.env.STORAGE_PROVIDER || 'local';

  console.log(`[StorageFactory] Creating storage provider: ${providerType}`);

  // Build configuration from environment variables and overrides
  const defaultConfig = {
    storagePath: process.env.STORAGE_PATH || '/data/videos',
    ttlHours: parseInt(process.env.STORAGE_TTL_HOURS || '24', 10),
  };

  const finalConfig = {
    ...defaultConfig,
    ...config,
  };

  console.log(`[StorageFactory] Configuration:`, JSON.stringify(finalConfig, null, 2));

  // Create the appropriate provider
  switch (providerType.toLowerCase()) {
    case 'local':
      return new LocalStorageProvider(finalConfig);

    // Future storage providers can be added here:
    // case 's3':
    //   return new S3StorageProvider(finalConfig);
    // case 'gcs':
    //   return new GCSStorageProvider(finalConfig);

    default:
      console.error(`[StorageFactory] Unknown storage provider type: ${providerType}`);
      throw new Error(`Unknown storage provider type: ${providerType}. Supported types: local`);
  }
}

/**
 * Creates a default storage provider using environment configuration
 * @returns {StorageProvider} Storage provider instance
 */
function createDefaultStorageProvider() {
  return createStorageProvider();
}

module.exports = {
  createStorageProvider,
  createDefaultStorageProvider,
};
