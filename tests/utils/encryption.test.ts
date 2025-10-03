import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { encrypt, decrypt, generateEncryptionKey, isEncryptionConfigured } from "../../src/utils/encryption";

describe("Encryption Utilities", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    // Set a test encryption key (32 bytes = 64 hex chars)
    process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  });

  describe("encrypt/decrypt", () => {
    test("should encrypt and decrypt string correctly", () => {
      const plaintext = "sensitive_access_token_12345";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    test("should produce different ciphertext for same plaintext", () => {
      const plaintext = "my_secret_token";
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Different ciphertexts (due to random nonce)
      expect(encrypted1).not.toBe(encrypted2);

      // But both decrypt to same plaintext
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    test("should encrypt long strings", () => {
      const longText = "a".repeat(10000);
      const encrypted = encrypt(longText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(longText);
      expect(decrypted.length).toBe(10000);
    });

    test("should encrypt strings with special characters", () => {
      const specialChars = "Hello! 你好 🔐 \n\t\r special@#$%^&*()";
      const encrypted = encrypt(specialChars);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(specialChars);
    });

    test("should encrypt empty-looking strings", () => {
      const emptyLooking = "   ";
      const encrypted = encrypt(emptyLooking);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(emptyLooking);
    });

    test("should throw error when encrypting empty string", () => {
      expect(() => encrypt("")).toThrow("Cannot encrypt empty string");
    });

    test("should throw error when decrypting empty string", () => {
      expect(() => decrypt("")).toThrow("Cannot decrypt empty string");
    });

    test("should throw error when decrypting invalid base64", () => {
      expect(() => decrypt("not-valid-base64!!!")).toThrow("Decryption failed");
    });

    test("should throw error when decrypting truncated data", () => {
      const validEncrypted = encrypt("test");
      const truncated = validEncrypted.substring(0, 10);

      expect(() => decrypt(truncated)).toThrow("Decryption failed");
    });

    test("should throw error when decrypting tampered data", () => {
      const encrypted = encrypt("original_data");
      // Tamper with the encrypted data
      const tampered = encrypted.substring(0, encrypted.length - 5) + "AAAAA";

      expect(() => decrypt(tampered)).toThrow("Decryption failed");
    });

    test("should throw error when decrypting with wrong key", () => {
      const encrypted = encrypt("test_data");

      // Change encryption key
      process.env.ENCRYPTION_KEY = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

      expect(() => decrypt(encrypted)).toThrow("Decryption failed");

      // Restore
      process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    });

    test("should handle OAuth tokens realistically", () => {
      const mockAccessToken = "ya29.a0AfH6SMBx..." + "a".repeat(200);
      const mockRefreshToken = "1//0gQE..." + "b".repeat(150);

      const encryptedAccess = encrypt(mockAccessToken);
      const encryptedRefresh = encrypt(mockRefreshToken);

      expect(decrypt(encryptedAccess)).toBe(mockAccessToken);
      expect(decrypt(encryptedRefresh)).toBe(mockRefreshToken);
    });
  });

  describe("generateEncryptionKey", () => {
    test("should generate 64-character hex string", () => {
      const key = generateEncryptionKey();

      expect(key.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    test("should generate unique keys", () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });

    test("generated key should work for encryption", () => {
      const key = generateEncryptionKey();
      process.env.ENCRYPTION_KEY = key;

      const plaintext = "test_with_generated_key";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe("isEncryptionConfigured", () => {
    test("should return true when ENCRYPTION_KEY is set correctly", () => {
      process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      expect(isEncryptionConfigured()).toBe(true);
    });

    test("should return false when ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(isEncryptionConfigured()).toBe(false);
    });

    test("should return false when ENCRYPTION_KEY is too short", () => {
      process.env.ENCRYPTION_KEY = "tooshort";
      expect(isEncryptionConfigured()).toBe(false);
    });

    test("should return false when ENCRYPTION_KEY is invalid hex", () => {
      process.env.ENCRYPTION_KEY = "z".repeat(64); // Invalid hex
      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe("Error handling", () => {
    test("should throw clear error when ENCRYPTION_KEY missing", () => {
      delete process.env.ENCRYPTION_KEY;

      try {
        encrypt("test");
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("ENCRYPTION_KEY environment variable is required");
        expect((error as Error).message).toContain("openssl rand -hex 32");
      }
    });

    test("should throw clear error when ENCRYPTION_KEY wrong length", () => {
      process.env.ENCRYPTION_KEY = "abc123"; // Too short

      try {
        encrypt("test");
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("must be 64 hex characters");
      }
    });

    test("should not expose sensitive data in decryption errors", () => {
      const encrypted = encrypt("secret_data");
      const tampered = encrypted.substring(0, encrypted.length - 5) + "XXXXX";

      try {
        decrypt(tampered);
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Should not expose the actual data or detailed error
        expect(message).toContain("Decryption failed");
        expect(message).not.toContain("secret_data");
      }
    });
  });

  describe("Integration with real-world scenarios", () => {
    test("should handle Google OAuth access token", () => {
      const realishToken =
        "ya29.a0AfH6SMBxK3..." + // Realistic Google token prefix
        "a".repeat(180) +        // Long token body
        "...end";

      const encrypted = encrypt(realishToken);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(realishToken);
      expect(encrypted).not.toContain(realishToken.substring(20, 40)); // Verify encrypted
    });

    test("should handle Google OAuth refresh token", () => {
      const refreshToken = "1//0gQE..." + "b".repeat(140);

      const encrypted = encrypt(refreshToken);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(refreshToken);
    });

    test("should maintain data integrity after multiple encrypt/decrypt cycles", () => {
      let data = "original_token";

      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt(data);
        data = decrypt(encrypted);
      }

      expect(data).toBe("original_token");
    });
  });

  // Cleanup
  afterEach(() => {
    if (originalKey) {
      process.env.ENCRYPTION_KEY = originalKey;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });
});
