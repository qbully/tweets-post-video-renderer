/**
 * Storage utilities for managing video files
 *
 * Provides a flexible storage abstraction layer with support for:
 * - Local filesystem storage (Railway volumes)
 * - Automatic file expiration based on TTL
 * - Metadata management
 * - Easy extensibility for cloud storage providers
 */

const { StorageProvider } = require('./base');
const { LocalStorageProvider } = require('./local');
const { createStorageProvider, createDefaultStorageProvider } = require('./factory');

module.exports = {
  // Base class
  StorageProvider,

  // Implementations
  LocalStorageProvider,

  // Factory functions
  createStorageProvider,
  createDefaultStorageProvider,
};
