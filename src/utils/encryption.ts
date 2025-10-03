/**
 * Encryption utilities using XChaCha20-Poly1305 authenticated encryption
 *
 * XChaCha20-Poly1305 provides:
 * - Authenticated encryption (detects tampering)
 * - Extended nonce size (192 bits) for better security
 * - Fast performance
 * - No padding oracle vulnerabilities
 */

import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { randomBytes } from "crypto";

/**
 * Get encryption key from environment variable
 * Key must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is required. " +
      "Generate one with: openssl rand -hex 32"
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
      `Current length: ${key.length}. Generate with: openssl rand -hex 32`
    );
  }

  // Validate hex format
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "ENCRYPTION_KEY must be valid hex characters (0-9, a-f). " +
      "Generate with: openssl rand -hex 32"
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt a string using XChaCha20-Poly1305
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded string containing nonce + ciphertext + authentication tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty string");
  }

  try {
    const key = getEncryptionKey();
    const nonce = randomBytes(24); // XChaCha20 uses 24-byte nonce

    const cipher = xchacha20poly1305(key, nonce);
    const plaintextBytes = Buffer.from(plaintext, "utf8");
    const ciphertext = cipher.encrypt(plaintextBytes);

    // Combine nonce + ciphertext (authentication tag is included in ciphertext)
    const combined = Buffer.concat([nonce, Buffer.from(ciphertext)]);

    return combined.toString("base64");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
    throw new Error("Encryption failed");
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 * @param encrypted - Base64-encoded string from encrypt()
 * @returns Decrypted plaintext string
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) {
    throw new Error("Cannot decrypt empty string");
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encrypted, "base64");

    if (combined.length < 24) {
      throw new Error("Invalid encrypted data: too short");
    }

    // Extract nonce (first 24 bytes) and ciphertext (remaining bytes)
    const nonce = combined.subarray(0, 24);
    const ciphertext = combined.subarray(24);

    const cipher = xchacha20poly1305(key, nonce);
    const plaintextBytes = cipher.decrypt(ciphertext);

    return Buffer.from(plaintextBytes).toString("utf8");
  } catch (error) {
    if (error instanceof Error) {
      // Don't expose detailed error info that could help attackers
      if (error.message.includes("ENCRYPTION_KEY")) {
        throw error; // Configuration errors are OK to expose
      }
      throw new Error("Decryption failed: invalid or corrupted data");
    }
    throw new Error("Decryption failed");
  }
}

/**
 * Generate a new encryption key (for initial setup)
 * @returns 64-character hex string suitable for ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Check if encryption is properly configured
 * @returns true if ENCRYPTION_KEY is set and valid
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
