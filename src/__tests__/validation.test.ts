/**
 * Unit tests cho validation utilities
 */

import { describe, it, expect } from "vitest";
import {
  validateUrl,
  validateJson,
  validateEmail,
  validateRequired,
  validateHttpMethod,
  validatePort,
} from "../utils/validation";

describe("Validation Utilities", () => {
  describe("validateUrl", () => {
    it("should validate valid HTTP URLs", () => {
      expect(validateUrl("http://example.com")).toEqual({ valid: true });
      expect(validateUrl("https://example.com")).toEqual({ valid: true });
    });

    it("should reject invalid URLs", () => {
      const result = validateUrl("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should reject empty URLs", () => {
      const result = validateUrl("");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateJson", () => {
    it("should validate valid JSON", () => {
      const result = validateJson('{"key": "value"}');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ key: "value" });
    });

    it("should reject invalid JSON", () => {
      const result = validateJson('{"key": "value"');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should accept empty string", () => {
      const result = validateJson("");
      expect(result.valid).toBe(true);
    });
  });

  describe("validateEmail", () => {
    it("should validate valid emails", () => {
      expect(validateEmail("test@example.com")).toEqual({ valid: true });
      expect(validateEmail("user.name+tag@example.co.uk")).toEqual({ valid: true });
    });

    it("should reject invalid emails", () => {
      expect(validateEmail("not-an-email").valid).toBe(false);
      expect(validateEmail("@example.com").valid).toBe(false);
      expect(validateEmail("test@").valid).toBe(false);
    });
  });

  describe("validateRequired", () => {
    it("should validate non-empty values", () => {
      expect(validateRequired("value", "Field")).toEqual({ valid: true });
      expect(validateRequired(123, "Field")).toEqual({ valid: true });
      expect(validateRequired(true, "Field")).toEqual({ valid: true });
    });

    it("should reject empty values", () => {
      expect(validateRequired("", "Field").valid).toBe(false);
      expect(validateRequired(null, "Field").valid).toBe(false);
      expect(validateRequired(undefined, "Field").valid).toBe(false);
    });
  });

  describe("validateHttpMethod", () => {
    it("should validate valid HTTP methods", () => {
      expect(validateHttpMethod("GET")).toEqual({ valid: true });
      expect(validateHttpMethod("POST")).toEqual({ valid: true });
      expect(validateHttpMethod("PUT")).toEqual({ valid: true });
    });

    it("should reject invalid methods", () => {
      expect(validateHttpMethod("INVALID").valid).toBe(false);
    });
  });

  describe("validatePort", () => {
    it("should validate valid ports", () => {
      expect(validatePort(80)).toEqual({ valid: true });
      expect(validatePort(3000)).toEqual({ valid: true });
      expect(validatePort(65535)).toEqual({ valid: true });
    });

    it("should reject invalid ports", () => {
      expect(validatePort(0).valid).toBe(false);
      expect(validatePort(65536).valid).toBe(false);
      expect(validatePort(-1).valid).toBe(false);
    });
  });
});
