/**
 * Unit tests cho Sync Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncService } from "../services/syncService";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("SyncService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("login", () => {
    it("should login successfully and store token", async () => {
      const mockResponse = {
        data: {
          token: "test-token",
          user: { id: 1, name: "Test User" },
        },
      };

      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        get: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      } as any);

      const result = await syncService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.token).toBe("test-token");
      expect(localStorage.getItem("auth_token")).toBe("test-token");
    });

    it("should handle login errors", async () => {
      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockRejectedValue(new Error("Invalid credentials")),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      } as any);

      await expect(
        syncService.login({
          email: "test@example.com",
          password: "wrong",
        })
      ).rejects.toThrow();
    });
  });

  describe("register", () => {
    it("should register successfully and store token", async () => {
      const mockResponse = {
        data: {
          token: "new-token",
          user: { id: 2, name: "New User" },
        },
      };

      mockedAxios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      } as any);

      const result = await syncService.register({
        name: "New User",
        email: "new@example.com",
        password: "password123",
      });

      expect(result.token).toBe("new-token");
      expect(localStorage.getItem("auth_token")).toBe("new-token");
    });
  });

  describe("syncCollections", () => {
    it("should sync collections successfully", async () => {
      const collections = [{ id: 1, name: "Test Collection" }];
      const mockResponse = {
        data: { success: true, synced: 1 },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      } as any);

      const result = await syncService.syncCollections(collections);

      expect(mockPost).toHaveBeenCalledWith("/collections/sync", { collections });
      expect(result.data.success).toBe(true);
    });
  });

  describe("syncAll", () => {
    it("should sync all data successfully", async () => {
      const data = {
        collections: [{ id: 1 }],
        environments: [{ id: 1 }],
        schemas: [{ id: 1 }],
      };
      const mockResponse = {
        data: { success: true },
      };

      const mockPost = vi.fn().mockResolvedValue(mockResponse);
      mockedAxios.create.mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      } as any);

      const result = await syncService.syncAll(data);

      expect(mockPost).toHaveBeenCalledWith("/sync", data);
      expect(result.data.success).toBe(true);
    });
  });
});
