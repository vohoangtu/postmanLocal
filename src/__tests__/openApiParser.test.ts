/**
 * Unit tests cho OpenAPI Parser
 */

import { describe, it, expect } from "vitest";
import { parseOpenAPISchema, validateOpenAPISchema } from "../services/openApiParser";

describe("OpenAPI Parser", () => {
  describe("validateOpenAPISchema", () => {
    it("should validate valid OpenAPI 3.0 schema", () => {
      const schema = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/users": {
            get: {
              responses: {
                "200": {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = validateOpenAPISchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid schema", () => {
      const result = validateOpenAPISchema(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject schema without paths", () => {
      const schema = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
      };

      const result = validateOpenAPISchema(schema);
      expect(result.valid).toBe(false);
    });
  });

  describe("parseOpenAPISchema", () => {
    it("should parse OpenAPI schema and generate routes", () => {
      const schema = {
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
        paths: {
          "/users": {
            get: {
              summary: "Get users",
              responses: {
                "200": {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: { type: "object" },
                      example: { users: [] },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const routes = parseOpenAPISchema(schema);
      expect(routes).toHaveLength(1);
      expect(routes[0].path).toBe("/users");
      expect(routes[0].method).toBe("GET");
      expect(routes[0].status).toBe(200);
    });
  });
});
