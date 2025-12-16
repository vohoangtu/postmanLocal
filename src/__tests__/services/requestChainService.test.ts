import { describe, it, expect, vi } from "vitest";
import { extractData } from "../../services/requestChainService";

describe("requestChainService", () => {
  describe("extractData", () => {
    it("should extract data from JSON response", () => {
      const data = { user: { id: 1, name: "John" } };
      const result = extractData("response_body", "user.name", data);
      expect(result).toBe("John");
    });

    it("should return null for non-existent path", () => {
      const data = { user: { id: 1 } };
      const result = extractData("response_body", "user.name", data);
      expect(result).toBeNull();
    });
  });
});




