# Security Fixes & Technical Debt - Action Plan

**Generated**: 2025-10-03
**Status**: Planning Phase
**Estimated Effort**: 90-110 hours (2-3 developer weeks)

---

## 🚨 Critical Security Issues (Week 1 - Must Fix Immediately)

### 1. JWT Token Verification Vulnerability
**Priority**: P0 - Critical
**Estimated Effort**: 4 hours
**File**: `src/auth/oauth.ts:132-153`

**Problem**:
```typescript
// Current: No cryptographic signature verification!
async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
  const parts = idToken.split(".");
  // Only checks audience and expiry, NOT signature
}
```

**Impact**: Attackers can forge authentication tokens and impersonate any user.

**Solution**:
```typescript
// Install jose library
// bun add jose

import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs')
);

async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
  try {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: this.clientId,
    });

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      picture: payload.picture as string,
    };
  } catch (error) {
    throw new Error('Invalid ID token');
  }
}
```

**Checklist**:
- [x] Install `jose` library
- [x] Replace manual JWT parsing with `jwtVerify`
- [x] Configure JWKS endpoint for Google's public keys
- [x] Add error handling for invalid signatures
- [x] Add tests for token verification
- [x] Test with valid and invalid tokens
- [x] Update documentation

**Status**: ✅ COMPLETED (2025-10-03)
**Implementation**:
- Installed `jose@6.1.0` library
- Updated `src/auth/oauth.ts:137-158` with cryptographic JWT verification
- Added JWKS remote key set pointing to Google's certificate endpoint
- Implemented proper error handling for signature validation failures
- Updated tests in `tests/auth/oauth.test.ts` with 4 new security test cases:
  - Invalid token signature
  - Malformed token format
  - Expired token
  - Wrong audience claim
- All 10 tests passing

---

### 2. Missing CSRF State Validation
**Priority**: P0 - Critical
**Estimated Effort**: 3 hours
**File**: `src/auth/handlers.ts:77-78`

**Problem**:
```typescript
const _state = url.searchParams.get("state");
// TODO: Validate state parameter for CSRF protection
// In production, compare with stored state
```

**Impact**: OAuth flow vulnerable to CSRF attacks, attackers can link victim's account to attacker's OAuth identity.

**Solution**:
```typescript
// In authorize handler (line 61)
const state = crypto.randomUUID();
const nonce = crypto.randomUUID();

// Store in Redis with 10-minute expiration
await redis.setex(`oauth:state:${state}`, 600, JSON.stringify({
  userId: req.user?.userId,
  nonce,
  createdAt: Date.now()
}));

const authUrl = this.oauth.buildAuthorizationUrl(redirectUri, state);

// In callback handler (line 77)
const state = url.searchParams.get("state");
if (!state) {
  throw new Error("Missing state parameter");
}

const storedState = await redis.get(`oauth:state:${state}`);
if (!storedState) {
  throw new Error("Invalid or expired state parameter");
}

// Delete to prevent reuse
await redis.del(`oauth:state:${state}`);

const stateData = JSON.parse(storedState);
// Validate additional fields like nonce if needed
```

**Checklist**:
- [x] Generate cryptographically secure state parameter
- [x] Store state in Redis with TTL
- [x] Validate state in callback handler
- [x] Delete state after use (prevent replay)
- [x] Add error handling for missing/invalid state
- [x] Add tests for CSRF protection
- [x] Document OAuth security measures

**Status**: ✅ COMPLETED (2025-10-03)
**Implementation**:
- Updated `src/auth/handlers.ts:23-58` to generate and store state in Redis with 10-minute TTL
- Updated `src/auth/handlers.ts:64-102` to validate state in callback handler
- Added `getRedisClient()` method to `SessionManager` for state storage access
- Implemented state deletion after validation to prevent replay attacks
- Added comprehensive error messages for CSRF attack detection
- Created `tests/auth/handlers.test.ts` with 7 CSRF protection tests:
  - State generation and storage
  - Unique state per request
  - Missing state parameter rejection
  - Invalid state parameter rejection
  - Expired state parameter rejection
  - State deletion after use
  - Replay attack prevention
- All 7 tests passing ✅

---

### 3. Session Management Multi-Instance Failure
**Priority**: P0 - Critical
**Estimated Effort**: 2 hours
**File**: `src/auth/session.ts:121-148`

**Problem**:
```typescript
private inMemorySessions: Map<string, SessionData> = new Map();

catch (error) {
  console.warn("⚠️  Saving session in memory as fallback");
  this.inMemorySessions.set(sessionId, sessionData);
}
```

**Impact**:
- Sessions lost on server restart
- Breaks horizontal scaling (each instance has different memory)
- Memory leak potential

**Solution**:
```typescript
// Remove in-memory fallback entirely
private async ensureRedisConnected(): Promise<void> {
  if (!this.redis || !this.redisHealthy) {
    throw new Error('Session store unavailable - Redis connection required');
  }
}

async createSession(userData: SessionData): Promise<string> {
  await this.ensureRedisConnected();

  const sessionId = crypto.randomUUID();
  const sessionData = { ...userData, createdAt: Date.now() };

  try {
    await this.redis.setex(
      `session:${sessionId}`,
      this.sessionTTL,
      JSON.stringify(sessionData)
    );
    return sessionId;
  } catch (error) {
    // Fail fast - don't accept requests if session store is down
    throw new Error('Failed to create session - service unavailable');
  }
}

// Remove all references to this.inMemorySessions
```

**Checklist**:
- [ ] Remove `inMemorySessions` Map property
- [ ] Add `ensureRedisConnected()` method
- [ ] Call `ensureRedisConnected()` in all session methods
- [ ] Remove all fallback logic to in-memory storage
- [ ] Add health check endpoint for Redis
- [ ] Update error responses to indicate service unavailable
- [ ] Add monitoring/alerting for Redis failures
- [ ] Document Redis as hard dependency

---

### 4. Add Input Validation with Zod
**Priority**: P0 - Critical
**Estimated Effort**: 6 hours
**File**: `src/index.tsx:91,137,187`

**Problem**:
```typescript
const body = await req.json(); // No validation
const { typeName, value, systolic, diastolic, measuredAt, notes } = body;
```

**Impact**: Potential for injection attacks, data corruption, server crashes.

**Solution**:
```typescript
// Install Zod
// bun add zod

// src/validation/schemas.ts
import { z } from 'zod';

export const createMeasurementSchema = z.object({
  typeName: z.string().min(1).max(100),
  value: z.string().optional(),
  systolic: z.number().int().min(40).max(300).optional(),
  diastolic: z.number().int().min(20).max(200).optional(),
  measuredAt: z.string().datetime().or(z.date()),
  notes: z.string().max(1000).optional(),
}).refine(
  data => data.value || (data.systolic && data.diastolic),
  { message: 'Either value or blood pressure readings required' }
);

export const updateUserProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// src/middleware/validation.ts
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (req: Request): Promise<T> => {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors);
      }
      throw error;
    }
  };
}

// Usage in routes
"/api/biometrics/measurements": {
  POST: authMiddleware.requireAuth(async (req: AuthenticatedRequest) => {
    const data = await validateBody(createMeasurementSchema)(req);
    // data is now type-safe and validated
  })
}
```

**Checklist**:
- [ ] Install Zod
- [ ] Create validation schemas for all endpoints
- [ ] Create validation middleware
- [ ] Apply validation to all POST/PUT/PATCH endpoints
- [ ] Add error handling for validation failures
- [ ] Return user-friendly validation error messages
- [ ] Add tests for validation logic
- [ ] Document validation rules

---

### 5. Encrypt OAuth Tokens at Rest
**Priority**: P0 - Critical
**Estimated Effort**: 5 hours
**File**: `db/schema.ts:197-198`

**Problem**:
```typescript
accessToken: text("access_token").notNull(),
refreshToken: text("refresh_token"),
```

**Impact**: Database breach exposes all user OAuth tokens, allowing account takeover.

**Solution**:
```typescript
// Install encryption library
// bun add @noble/ciphers

// src/utils/encryption.ts
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(plaintext: string): string {
  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(ENCRYPTION_KEY, nonce);
  const ciphertext = cipher.encrypt(Buffer.from(plaintext, 'utf8'));

  // Store nonce + ciphertext
  return Buffer.concat([nonce, ciphertext]).toString('base64');
}

export function decrypt(encrypted: string): string {
  const data = Buffer.from(encrypted, 'base64');
  const nonce = data.subarray(0, 24);
  const ciphertext = data.subarray(24);

  const cipher = xchacha20poly1305(ENCRYPTION_KEY, nonce);
  const plaintext = cipher.decrypt(ciphertext);

  return Buffer.from(plaintext).toString('utf8');
}

// Update integration service
import { encrypt, decrypt } from '../utils/encryption';

async storeConnection(connection: DataSourceConnection) {
  return await db.insert(schema.dataSourceConnections).values({
    ...connection,
    accessToken: encrypt(connection.accessToken),
    refreshToken: connection.refreshToken ? encrypt(connection.refreshToken) : null,
  });
}

async getConnection(connectionId: number) {
  const conn = await db.query.dataSourceConnections.findFirst({
    where: eq(schema.dataSourceConnections.id, connectionId)
  });

  if (!conn) return null;

  return {
    ...conn,
    accessToken: decrypt(conn.accessToken),
    refreshToken: conn.refreshToken ? decrypt(conn.refreshToken) : null,
  };
}
```

**Checklist**:
- [ ] Install encryption library
- [ ] Generate ENCRYPTION_KEY and add to `.env`
- [ ] Create encryption utility functions
- [ ] Update all token storage to encrypt
- [ ] Update all token retrieval to decrypt
- [ ] Add key rotation mechanism
- [ ] Test encryption/decryption
- [ ] Document key management process
- [ ] Add monitoring for decryption failures

---

### 6. Implement Redis-Based Rate Limiting
**Priority**: P0 - Critical
**Estimated Effort**: 4 hours
**File**: `src/auth/middleware.ts:135-179`

**Problem**:
```typescript
const requests = new Map<string, { count: number; resetTime: number }>();
```

**Impact**:
- Rate limits don't work across multiple server instances
- Memory-based tracking lost on restart
- Can't defend against distributed attacks

**Solution**:
```typescript
// Install rate limiting library
// bun add @upstash/ratelimit @upstash/redis

// src/middleware/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Different rate limits for different endpoint categories
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "ratelimit:auth",
});

export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  analytics: true,
  prefix: "ratelimit:api",
});

export const strictRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "ratelimit:strict",
});

// Middleware function
export function rateLimitMiddleware(limiter: Ratelimit) {
  return async (req: Request): Promise<Response | null> => {
    const identifier = getClientIdentifier(req);
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          limit,
          remaining: 0,
          reset: new Date(reset).toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Continue to handler
  };
}

function getClientIdentifier(req: Request): string {
  // Use authenticated user ID if available
  const userId = (req as any).user?.userId;
  if (userId) return `user:${userId}`;

  // Fall back to IP address (with proper proxy handling)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || req.headers.get("cf-connecting-ip") || "unknown";
  return `ip:${ip}`;
}

// Usage in routes
import { authRateLimit, apiRateLimit, rateLimitMiddleware } from "./middleware/rateLimit";

routes: {
  "/auth/google": {
    GET: async (req) => {
      const rateLimitResponse = await rateLimitMiddleware(authRateLimit)(req);
      if (rateLimitResponse) return rateLimitResponse;
      // Continue with auth flow
    }
  },
  "/api/biometrics/measurements": {
    GET: async (req) => {
      const rateLimitResponse = await rateLimitMiddleware(apiRateLimit)(req);
      if (rateLimitResponse) return rateLimitResponse;
      // Continue with handler
    }
  }
}
```

**Checklist**:
- [ ] Install `@upstash/ratelimit` and `@upstash/redis`
- [ ] Configure Redis connection (can use existing Redis)
- [ ] Create rate limit middleware
- [ ] Define rate limit tiers (auth, API, strict)
- [ ] Apply rate limiting to all public endpoints
- [ ] Add rate limit headers to responses
- [ ] Test rate limiting behavior
- [ ] Add monitoring for rate limit hits
- [ ] Document rate limit policies

---

## 🔒 Additional Security Enhancements (Week 1)

### 7. Add Security Headers
**Priority**: P1 - High
**Estimated Effort**: 2 hours

**Solution**:
```typescript
// src/middleware/security.ts
export function securityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Prevent clickjacking
  headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  headers.set("X-XSS-Protection", "1; mode=block");

  // HSTS - force HTTPS
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  // Content Security Policy
  headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Adjust for React
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://accounts.google.com https://www.googleapis.com",
    "frame-ancestors 'none'",
  ].join("; "));

  // Referrer policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Apply to all responses in index.tsx
async fetch(req) {
  const response = await handleRequest(req);
  return securityHeaders(response);
}
```

**Checklist**:
- [ ] Create security headers middleware
- [ ] Apply to all responses
- [ ] Test CSP doesn't break frontend
- [ ] Adjust CSP for third-party integrations
- [ ] Test HSTS in production
- [ ] Validate headers with securityheaders.com

---

### 8. Remove Sensitive Data from Logs
**Priority**: P1 - High
**Estimated Effort**: 2 hours
**Files**: `src/integrations/googleFit.ts:40-45,189,248-249`

**Problem**:
```typescript
clientIdPrefix: this.clientId?.substring(0, 10) + "...",
console.log("🔄 Attempting token exchange with code:", code.substring(0, 20) + "...");
tokenPrefix: connection.accessToken?.substring(0, 20) + "...",
```

**Solution**:
```typescript
// src/utils/logger.ts
export const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    console.log(message, sanitize(metadata));
  },
  error: (message: string, error?: Error, metadata?: Record<string, any>) => {
    console.error(message, error, sanitize(metadata));
  },
  debug: (message: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, sanitize(metadata));
    }
  },
};

function sanitize(obj?: Record<string, any>): Record<string, any> | undefined {
  if (!obj) return obj;

  const sensitiveKeys = [
    'password', 'token', 'accessToken', 'refreshToken',
    'clientSecret', 'apiKey', 'authorization', 'code'
  ];

  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Replace all console.log with logger
logger.info("Token exchange initiated", { userId });
// Never log tokens, codes, or credentials
```

**Checklist**:
- [ ] Create logging utility with sanitization
- [ ] Replace all `console.log` with logger
- [ ] Remove all partial token/code logging
- [ ] Add log level configuration
- [ ] Test sensitive data is redacted
- [ ] Document logging policy

---

### 9. Session Fixation Protection
**Priority**: P1 - High
**Estimated Effort**: 1 hour
**File**: `src/auth/handlers.ts:102-110`

**Solution**:
```typescript
// After successful OAuth authentication
async handleCallback(req: Request): Promise<Response> {
  // ... OAuth validation ...

  // Regenerate session ID after authentication
  const oldSessionId = this.sessionManager.extractSessionId(req);
  if (oldSessionId) {
    // Delete old session
    await this.sessionManager.deleteSession(oldSessionId);
  }

  // Create new session with authenticated user
  const sessionId = await this.sessionManager.createSession({
    userId: userInfo.id,
    email: userInfo.email,
    // ... other session data
  });

  // Set new session cookie
  const redirectUrl = new URL("/", req.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectUrl.toString(),
      "Set-Cookie": this.sessionManager.createSessionCookie(sessionId),
    },
  });
}
```

**Checklist**:
- [ ] Delete old session on authentication
- [ ] Generate new session ID
- [ ] Set new session cookie
- [ ] Test session fixation attack prevention
- [ ] Document session regeneration

---

## 📋 Security Testing Checklist

### Automated Security Tests
- [ ] Add JWT signature verification tests
- [ ] Add CSRF protection tests
- [ ] Add input validation tests
- [ ] Add rate limiting tests
- [ ] Add session management tests
- [ ] Add encryption/decryption tests

### Manual Security Testing
- [ ] Attempt to forge JWT tokens
- [ ] Test CSRF attack scenarios
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts
- [ ] Test rate limiting bypasses
- [ ] Test session fixation attacks
- [ ] Test session replay attacks

### Security Scanning Tools
- [ ] Run OWASP ZAP scan
- [ ] Run npm audit / bun audit
- [ ] Run Snyk security scan
- [ ] Review dependency vulnerabilities
- [ ] Run static code analysis (ESLint security plugin)

---

## 🚀 Deployment Checklist

Before deploying to production:

### Environment Variables
- [ ] Generate strong `ENCRYPTION_KEY` (64 hex chars)
- [ ] Set `SESSION_SECRET` (32+ random chars)
- [ ] Configure `REDIS_URL` for production Redis
- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS` for CORS

### Infrastructure
- [ ] Redis cluster configured with persistence
- [ ] Database backups enabled
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] DDoS protection enabled (Cloudflare, etc.)
- [ ] Monitoring and alerting configured

### Security Hardening
- [ ] Disable debug mode in production
- [ ] Remove development dependencies
- [ ] Enable audit logging
- [ ] Configure security headers
- [ ] Enable HTTPS-only
- [ ] Review and rotate secrets

---

## 📊 Progress Tracking

### Week 1 Status
- [x] Task 1: JWT Verification (4h) ✅ COMPLETED
- [x] Task 2: CSRF Validation (3h) ✅ COMPLETED
- [ ] Task 3: Session Management (2h)
- [ ] Task 4: Input Validation (6h)
- [ ] Task 5: Token Encryption (5h)
- [ ] Task 6: Rate Limiting (4h)
- [ ] Task 7: Security Headers (2h)
- [ ] Task 8: Log Sanitization (2h)
- [ ] Task 9: Session Fixation (1h)

**Total**: 29 hours

### Definition of Done
Each task is complete when:
- [ ] Code implemented and reviewed
- [ ] Unit tests added and passing
- [ ] Integration tests added and passing
- [ ] Security tests added and passing
- [ ] Documentation updated
- [ ] Code reviewed by security-focused developer
- [ ] Tested in staging environment
- [ ] Approved for production deployment

---

## 📚 Additional Resources

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Redis Security](https://redis.io/topics/security)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Next Review**: After Week 1 completion
