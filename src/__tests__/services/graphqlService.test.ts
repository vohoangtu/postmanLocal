import { describe, it, expect } from "vitest";
import { validateQuery, formatQuery, extractOperationName } from "../../services/graphqlService";

describe("graphqlService", () => {
  describe("validateQuery", () => {
    it("should validate empty query", () => {
      const result = validateQuery("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Query cannot be empty");
    });

    it("should validate query with unmatched braces", () => {
      const result = validateQuery("query { user {");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Unmatched braces in query");
    });

    it("should validate valid query", () => {
      const result = validateQuery("query { user { id name } }");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("extractOperationName", () => {
    it("should extract operation name", () => {
      const name = extractOperationName("query GetUser { user { id } }");
      expect(name).toBe("GetUser");
    });

    it("should return null if no operation name", () => {
      const name = extractOperationName("{ user { id } }");
      expect(name).toBeNull();
    });
  });

  describe("formatQuery", () => {
    it("should format query with indentation", () => {
      const formatted = formatQuery("query{user{id name}}");
      expect(formatted).toContain("query");
      expect(formatted).toContain("user");
    });
  });
});


