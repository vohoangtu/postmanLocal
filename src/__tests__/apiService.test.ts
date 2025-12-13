/**
 * Unit tests cho API Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeRequest } from "../services/apiService";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock fetch for web environment
global.fetch = vi.fn();

describe("API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeRequest", () => {
    it("should execute GET request successfully", async () => {
      const mockResponse = {
        status: 200,
        statusText: "OK",
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => '{"message": "success"}',
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await executeRequest({
        method: "GET",
        url: "https://api.example.com/test",
        headers: {},
      });

      expect(result.status).toBe(200);
      expect(result.body).toBe('{"message": "success"}');
    });

    it("should handle request errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await expect(
        executeRequest({
          method: "GET",
          url: "https://api.example.com/test",
          headers: {},
        })
      ).rejects.toThrow();
    });
  });
});
