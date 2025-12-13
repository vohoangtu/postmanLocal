/**
 * Unit tests cho Request Chain Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeChain, ChainStep, ChainExecutionResult } from "../services/requestChainService";
import { executeRequest } from "../services/apiService";

// Mock apiService
vi.mock("../services/apiService", () => ({
  executeRequest: vi.fn(),
}));

const mockedExecuteRequest = vi.mocked(executeRequest);

describe("RequestChainService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeChain", () => {
    it("should execute chain steps sequentially", async () => {
      const steps: ChainStep[] = [
        {
          id: "1",
          name: "Step 1",
          method: "GET",
          url: "https://api.example.com/users",
          headers: {},
        },
        {
          id: "2",
          name: "Step 2",
          method: "GET",
          url: "https://api.example.com/posts",
          headers: {},
        },
      ];

      mockedExecuteRequest
        .mockResolvedValueOnce({
          status: 200,
          status_text: "OK",
          headers: {},
          body: JSON.stringify({ userId: 123 }),
        })
        .mockResolvedValueOnce({
          status: 200,
          status_text: "OK",
          headers: {},
          body: JSON.stringify({ posts: [] }),
        });

      const results = await executeChain(steps);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockedExecuteRequest).toHaveBeenCalledTimes(2);
    });

    it("should extract variables from responses", async () => {
      const steps: ChainStep[] = [
        {
          id: "1",
          name: "Step 1",
          method: "GET",
          url: "https://api.example.com/users",
          headers: {},
          extractVariables: [
            {
              name: "userId",
              path: "userId",
              type: "json",
            },
          ],
        },
        {
          id: "2",
          name: "Step 2",
          method: "GET",
          url: "https://api.example.com/users/{{userId}}",
          headers: {},
        },
      ];

      mockedExecuteRequest
        .mockResolvedValueOnce({
          status: 200,
          status_text: "OK",
          headers: {},
          body: JSON.stringify({ userId: 123 }),
        })
        .mockResolvedValueOnce({
          status: 200,
          status_text: "OK",
          headers: {},
          body: JSON.stringify({ user: { id: 123 } }),
        });

      const results = await executeChain(steps);

      expect(results).toHaveLength(2);
      expect(results[0].variables?.userId).toBe(123);
      // Step 2 should use userId from step 1
      expect(mockedExecuteRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "https://api.example.com/users/123",
        }),
        true,
        300000
      );
    });

    it("should handle errors in chain execution", async () => {
      const steps: ChainStep[] = [
        {
          id: "1",
          name: "Step 1",
          method: "GET",
          url: "https://api.example.com/error",
          headers: {},
        },
      ];

      mockedExecuteRequest.mockRejectedValueOnce(new Error("Network error"));

      const results = await executeChain(steps);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeDefined();
    });

    it("should stop on error if stopOnError is true", async () => {
      const steps: ChainStep[] = [
        {
          id: "1",
          name: "Step 1",
          method: "GET",
          url: "https://api.example.com/error",
          headers: {},
          stopOnError: true,
        },
        {
          id: "2",
          name: "Step 2",
          method: "GET",
          url: "https://api.example.com/success",
          headers: {},
        },
      ];

      mockedExecuteRequest.mockRejectedValueOnce(new Error("Network error"));

      const results = await executeChain(steps);

      expect(results).toHaveLength(1);
      expect(mockedExecuteRequest).toHaveBeenCalledTimes(1);
    });
  });
});
