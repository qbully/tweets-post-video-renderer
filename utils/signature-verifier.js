const crypto = require('crypto');

/**
 * HMAC-SHA256 Signature Verifier Middleware
 *
 * Secures API endpoints by verifying HMAC signatures in request headers.
 * Prevents replay attacks using timestamp validation.
 *
 * Required Environment Variables:
 * - HMAC_SECRET: Secret key for HMAC signature generation/validation
 *
 * Required Request Headers:
 * - X-Signature: Hex-encoded HMAC-SHA256 signature
 * - X-Timestamp: Unix timestamp (seconds since epoch)
 *
 * Signature Format: HMAC-SHA256(timestamp:jsonBody, secret)
 */

// Constants
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes
const SIGNATURE_HEADER = 'x-signature';
const TIMESTAMP_HEADER = 'x-timestamp';

/**
 * Generates an HMAC-SHA256 signature for a given timestamp and body
 *
 * @param {number|string} timestamp - Unix timestamp in seconds
 * @param {Object|string} body - Request body (object will be stringified)
 * @param {string} secret - HMAC secret key
 * @returns {string} Hex-encoded HMAC signature
 *
 * @example
 * const signature = generateSignature(1234567890, { foo: 'bar' }, 'my-secret');
 */
function generateSignature(timestamp, body, secret) {
  if (!secret) {
    throw new Error('Secret key is required for signature generation');
  }

  // Ensure timestamp is a string
  const timestampStr = String(timestamp);

  // Stringify body if it's an object
  const bodyStr = typeof body === 'object' ? JSON.stringify(body) : String(body);

  // Create message: timestamp:jsonBody
  const message = `${timestampStr}:${bodyStr}`;

  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);

  return hmac.digest('hex');
}

/**
 * Timing-safe string comparison to prevent timing attacks
 *
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {boolean} True if strings are equal
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Strings must be same length for timing-safe comparison
  if (a.length !== b.length) {
    return false;
  }

  // Convert strings to buffers for crypto.timingSafeEqual
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  try {
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch (error) {
    // Should not happen if lengths are equal, but handle gracefully
    return false;
  }
}

/**
 * Validates that a timestamp is within the acceptable time window
 *
 * @param {number|string} timestamp - Unix timestamp in seconds
 * @returns {Object} Validation result with isValid and error properties
 */
function validateTimestamp(timestamp) {
  const timestampNum = Number(timestamp);

  // Check if timestamp is a valid number
  if (isNaN(timestampNum) || timestampNum <= 0) {
    return {
      isValid: false,
      error: 'Invalid timestamp format'
    };
  }

  // Convert to milliseconds and get current time
  const timestampMs = timestampNum * 1000;
  const currentTimeMs = Date.now();
  const timeDifference = Math.abs(currentTimeMs - timestampMs);

  // Check if timestamp is within acceptable window
  if (timeDifference > TIMESTAMP_TOLERANCE_MS) {
    const minutesOff = Math.round(timeDifference / 60000);
    return {
      isValid: false,
      error: `Timestamp expired or invalid. Off by ${minutesOff} minute(s). Max tolerance: 5 minutes`
    };
  }

  return { isValid: true };
}

/**
 * Express middleware for HMAC signature verification
 *
 * Validates HMAC-SHA256 signatures and timestamps to secure API endpoints.
 * Returns 401 Unauthorized with descriptive error messages on failure.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @example
 * // Apply to specific route
 * app.post('/api/secure-endpoint', verifySignature, (req, res) => {
 *   res.json({ message: 'Authenticated!' });
 * });
 *
 * // Apply to all routes
 * app.use(verifySignature);
 */
function verifySignature(req, res, next) {
  const startTime = Date.now();

  try {
    // Get HMAC secret from environment
    const secret = process.env.HMAC_SECRET;

    if (!secret) {
      console.error('[HMAC] HMAC_SECRET environment variable not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'HMAC authentication not properly configured'
      });
    }

    // Extract headers (case-insensitive)
    const signature = req.headers[SIGNATURE_HEADER];
    const timestamp = req.headers[TIMESTAMP_HEADER];

    // Validate required headers presence
    if (!signature) {
      console.warn('[HMAC] Missing X-Signature header', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        error: 'Missing authentication header',
        message: 'X-Signature header is required'
      });
    }

    if (!timestamp) {
      console.warn('[HMAC] Missing X-Timestamp header', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        error: 'Missing authentication header',
        message: 'X-Timestamp header is required'
      });
    }

    // Validate timestamp
    const timestampValidation = validateTimestamp(timestamp);
    if (!timestampValidation.isValid) {
      console.warn('[HMAC] Invalid or expired timestamp', {
        timestamp,
        error: timestampValidation.error,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({
        error: 'Invalid timestamp',
        message: timestampValidation.error
      });
    }

    // Get request body (ensure it's available)
    const body = req.body || {};

    // Generate expected signature
    let expectedSignature;
    try {
      expectedSignature = generateSignature(timestamp, body, secret);
    } catch (error) {
      console.error('[HMAC] Error generating signature', {
        error: error.message,
        timestamp,
        ip: req.ip,
        path: req.path
      });
      return res.status(500).json({
        error: 'Signature verification error',
        message: 'Failed to process signature'
      });
    }

    // Perform timing-safe signature comparison
    const isValid = timingSafeEqual(signature.toLowerCase(), expectedSignature.toLowerCase());

    if (!isValid) {
      console.warn('[HMAC] Signature verification failed', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp,
        receivedSignatureLength: signature.length,
        expectedSignatureLength: expectedSignature.length
      });
      return res.status(401).json({
        error: 'Invalid signature',
        message: 'HMAC signature verification failed'
      });
    }

    // Signature verified successfully
    const verificationTime = Date.now() - startTime;
    console.info('[HMAC] Signature verified successfully', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      verificationTimeMs: verificationTime
    });

    // Add verification metadata to request object for downstream use
    req.hmacVerified = true;
    req.hmacTimestamp = Number(timestamp);

    // Continue to next middleware
    next();

  } catch (error) {
    // Catch any unexpected errors
    console.error('[HMAC] Unexpected error during signature verification', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during authentication'
    });
  }
}

// Exports
module.exports = {
  verifySignature,
  generateSignature
};
