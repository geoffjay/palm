/**
 * Security headers middleware for HTTP response hardening
 * Implements OWASP security header recommendations
 */

export interface SecurityHeadersConfig {
  /**
   * Enable HSTS (HTTP Strict Transport Security)
   * Only enable in production with valid SSL certificate
   */
  enableHSTS?: boolean;

  /**
   * Custom Content Security Policy directives
   */
  customCSP?: Record<string, string>;

  /**
   * Enable strict CSP (may require frontend adjustments)
   */
  strictCSP?: boolean;
}

/**
 * Apply security headers to HTTP response
 */
export function securityHeaders(
  response: Response,
  config: SecurityHeadersConfig = {},
): Response {
  const headers = new Headers(response.headers);

  // X-Frame-Options: Prevent clickjacking attacks
  // DENY = page cannot be displayed in a frame/iframe
  headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options: Prevent MIME sniffing
  // nosniff = browser must respect Content-Type header
  headers.set("X-Content-Type-Options", "nosniff");

  // X-XSS-Protection: Enable browser XSS filtering
  // 1; mode=block = enable XSS filter and block page if attack detected
  headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy: Control referrer information
  // strict-origin-when-cross-origin = send full URL for same-origin, origin only for cross-origin HTTPS
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy: Control browser features
  // Disable geolocation, microphone, camera by default
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // HSTS: Force HTTPS (only in production with valid certificate)
  if (config.enableHSTS || process.env.NODE_ENV === "production") {
    // max-age=31536000 = 1 year
    // includeSubDomains = apply to all subdomains
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Content-Security-Policy: Prevent XSS, clickjacking, and other injection attacks
  const cspDirectives = config.customCSP || buildDefaultCSP(config.strictCSP);
  const cspString = Object.entries(cspDirectives)
    .map(([key, value]) => `${key} ${value}`)
    .join("; ");
  headers.set("Content-Security-Policy", cspString);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Build default Content Security Policy
 */
function buildDefaultCSP(strict = false): Record<string, string> {
  if (strict) {
    // Strict CSP - may require frontend code changes
    return {
      "default-src": "'self'",
      "script-src": "'self'",
      "style-src": "'self'",
      "img-src": "'self' data: https:",
      "font-src": "'self' data:",
      "connect-src": "'self' https://accounts.google.com https://www.googleapis.com",
      "frame-ancestors": "'none'",
      "form-action": "'self'",
      "base-uri": "'self'",
      "object-src": "'none'",
    };
  }

  // Relaxed CSP for React apps with inline styles/scripts
  return {
    "default-src": "'self'",
    // React requires 'unsafe-inline' and 'unsafe-eval' for development
    // In production, consider using nonces or hashes for inline scripts
    "script-src": "'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' data: https:",
    "font-src": "'self' data:",
    // Allow connections to Google OAuth and APIs
    "connect-src": "'self' https://accounts.google.com https://www.googleapis.com https://www.google-analytics.com",
    "frame-ancestors": "'none'",
    "form-action": "'self'",
    "base-uri": "'self'",
    "object-src": "'none'",
  };
}

/**
 * Create security headers middleware for route handlers
 */
export function withSecurityHeaders(
  handler: (req: Request) => Promise<Response>,
  config?: SecurityHeadersConfig,
) {
  return async (req: Request): Promise<Response> => {
    const response = await handler(req);
    return securityHeaders(response, config);
  };
}

/**
 * Get current security header configuration for debugging
 */
export function getSecurityHeadersConfig(): SecurityHeadersConfig {
  return {
    enableHSTS: process.env.NODE_ENV === "production",
    strictCSP: process.env.STRICT_CSP === "true",
  };
}
