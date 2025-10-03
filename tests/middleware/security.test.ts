import { describe, expect, test } from "bun:test";
import { securityHeaders, getSecurityHeadersConfig } from "../../src/middleware/security";

describe("Security Headers", () => {
  describe("securityHeaders", () => {
    test("should add X-Frame-Options header", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      expect(secured.headers.get("X-Frame-Options")).toBe("DENY");
    });

    test("should add X-Content-Type-Options header", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      expect(secured.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    test("should add X-XSS-Protection header", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      expect(secured.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });

    test("should add Referrer-Policy header", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      expect(secured.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    });

    test("should add Permissions-Policy header", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      const policy = secured.headers.get("Permissions-Policy");
      expect(policy).toContain("geolocation=()");
      expect(policy).toContain("microphone=()");
      expect(policy).toContain("camera=()");
    });

    test("should add Content-Security-Policy header", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      const csp = secured.headers.get("Content-Security-Policy");
      expect(csp).toBeTruthy();
      expect(csp).toContain("default-src 'self'");
    });

    test("should not add HSTS in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const response = new Response("test");
      const secured = securityHeaders(response);

      expect(secured.headers.get("Strict-Transport-Security")).toBeNull();

      process.env.NODE_ENV = originalEnv;
    });

    test("should add HSTS in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const response = new Response("test");
      const secured = securityHeaders(response);

      const hsts = secured.headers.get("Strict-Transport-Security");
      expect(hsts).toBeTruthy();
      expect(hsts).toContain("max-age=31536000");
      expect(hsts).toContain("includeSubDomains");

      process.env.NODE_ENV = originalEnv;
    });

    test("should preserve response status and body", async () => {
      const response = new Response(JSON.stringify({ data: "test" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });

      const secured = securityHeaders(response);

      expect(secured.status).toBe(201);
      expect(secured.headers.get("Content-Type")).toBe("application/json");
      const body = await secured.json();
      expect(body.data).toBe("test");
    });

    test("should preserve existing headers", () => {
      const response = new Response("test", {
        headers: {
          "Custom-Header": "custom-value",
          "Content-Type": "text/plain",
        },
      });

      const secured = securityHeaders(response);

      expect(secured.headers.get("Custom-Header")).toBe("custom-value");
      expect(secured.headers.get("Content-Type")).toBe("text/plain");
      expect(secured.headers.get("X-Frame-Options")).toBe("DENY");
    });

    test("should allow Google OAuth in CSP connect-src", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      const csp = secured.headers.get("Content-Security-Policy");
      expect(csp).toContain("https://accounts.google.com");
      expect(csp).toContain("https://www.googleapis.com");
    });

    test("should allow inline scripts for React (unsafe-inline)", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      const csp = secured.headers.get("Content-Security-Policy");
      expect(csp).toContain("script-src");
      expect(csp).toContain("'unsafe-inline'");
    });

    test("should allow inline styles for styled-components", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      const csp = secured.headers.get("Content-Security-Policy");
      expect(csp).toContain("style-src");
      expect(csp).toContain("'unsafe-inline'");
    });

    test("should set frame-ancestors to none", () => {
      const response = new Response("test");
      const secured = securityHeaders(response);

      const csp = secured.headers.get("Content-Security-Policy");
      expect(csp).toContain("frame-ancestors 'none'");
    });

    test("should accept custom CSP configuration", () => {
      const response = new Response("test");
      const secured = securityHeaders(response, {
        customCSP: {
          "default-src": "'self'",
          "script-src": "'self' 'nonce-abc123'",
        },
      });

      const csp = secured.headers.get("Content-Security-Policy");
      expect(csp).toBe("default-src 'self'; script-src 'self' 'nonce-abc123'");
    });

    test("should enable HSTS when explicitly configured", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const response = new Response("test");
      const secured = securityHeaders(response, { enableHSTS: true });

      const hsts = secured.headers.get("Strict-Transport-Security");
      expect(hsts).toBeTruthy();

      process.env.NODE_ENV = originalEnv;
    });

    test("should support strict CSP mode", () => {
      const response = new Response("test");
      const secured = securityHeaders(response, { strictCSP: true });

      const csp = secured.headers.get("Content-Security-Policy");
      // Strict mode shouldn't include unsafe-inline or unsafe-eval
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
    });
  });

  describe("getSecurityHeadersConfig", () => {
    test("should return current configuration", () => {
      const config = getSecurityHeadersConfig();
      expect(config).toHaveProperty("enableHSTS");
      expect(config).toHaveProperty("strictCSP");
    });

    test("should enable HSTS in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const config = getSecurityHeadersConfig();
      expect(config.enableHSTS).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    test("should disable HSTS in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const config = getSecurityHeadersConfig();
      expect(config.enableHSTS).toBe(false);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
