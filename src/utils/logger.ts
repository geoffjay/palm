/**
 * Secure logging utility that sanitizes sensitive data
 * Prevents accidental exposure of credentials, tokens, and PII in logs
 */

/**
 * Sensitive field names that should be redacted
 * Uses word boundary matching to avoid false positives
 */
const SENSITIVE_PATTERNS = [
  /\bpassword\b/i,
  /\b(access|refresh|id)?token\b/i, // Matches accessToken, refreshToken, idToken, token (but not "tokens")
  /\bclientsecret\b/i,
  /\bapisecret\b/i,
  /\bapikey\b/i,
  /\bsecret\b/i,
  /\bauthorization\b/i,
  /\bcookie\b/i,
  /\bsessionid\b/i,
  /\bcode\b/i, // OAuth authorization codes
  /\bprivatekey\b/i,
  /\bcredential\b/i,
  /\bauth\b/i,
];

/**
 * Check if a key name indicates sensitive data
 */
function isSensitiveKey(key: string): boolean {
  const normalizedKey = key.replace(/[_-]/g, "");
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(normalizedKey));
}

/**
 * Sanitize an object by redacting sensitive fields
 */
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format log arguments for safe output
 */
function formatLogArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (typeof arg === "object" && arg !== null) {
      return sanitize(arg);
    }
    return arg;
  });
}

/**
 * Secure logger that sanitizes sensitive data
 */
export const logger = {
  /**
   * Info level logging
   */
  info(message: string, ...metadata: unknown[]): void {
    const sanitized = formatLogArgs(metadata);
    console.log(message, ...sanitized);
  },

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, ...metadata: unknown[]): void {
    const sanitized = formatLogArgs(metadata);
    if (error instanceof Error) {
      console.error(message, error.message, error.stack, ...sanitized);
    } else {
      console.error(message, error, ...sanitized);
    }
  },

  /**
   * Warning level logging
   */
  warn(message: string, ...metadata: unknown[]): void {
    const sanitized = formatLogArgs(metadata);
    console.warn(message, ...sanitized);
  },

  /**
   * Debug level logging (only in development)
   */
  debug(message: string, ...metadata: unknown[]): void {
    if (process.env.NODE_ENV === "development" || process.env.DEBUG === "true") {
      const sanitized = formatLogArgs(metadata);
      console.debug(message, ...sanitized);
    }
  },

  /**
   * Trace level logging (verbose, only in development)
   */
  trace(message: string, ...metadata: unknown[]): void {
    if (process.env.DEBUG === "true" && process.env.LOG_LEVEL === "trace") {
      const sanitized = formatLogArgs(metadata);
      console.debug("[TRACE]", message, ...sanitized);
    }
  },
};

/**
 * Sanitize a value for logging (utility function)
 * @param value - Value to sanitize
 * @returns Sanitized value safe for logging
 */
export function sanitizeForLogging(value: unknown): unknown {
  return sanitize(value);
}

/**
 * Check if a key should be considered sensitive
 * @param key - Key name to check
 * @returns true if key is sensitive
 */
export function isSensitive(key: string): boolean {
  return isSensitiveKey(key);
}
