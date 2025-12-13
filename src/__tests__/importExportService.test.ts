/**
 * Unit tests cho Import/Export Service
 */

import { describe, it, expect, vi } from "vitest";
import {
  importPostmanCollection,
  exportToPostmanCollection,
  exportToOpenAPI,
  importOpenAPICollection,
} from "../services/importExportService";

describe("ImportExportService", () => {
  describe("importPostmanCollection", () => {
    it("should import valid Postman collection v2.1", () => {
      const postmanCollection = {
        info: {
          name: "Test Collection",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: [
          {
            name: "Get Users",
            request: {
              method: "GET",
              url: {
                raw: "https://api.example.com/users",
              },
              header: [
                {
                  key: "Content-Type",
                  value: "application/json",
                },
              ],
            },
          },
        ],
      };

      const result = importPostmanCollection(postmanCollection);

      expect(result).toBeDefined();
      expect(result.name).toBe("Test Collection");
      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].method).toBe("GET");
      expect(result.requests[0].url).toBe("https://api.example.com/users");
    });

    it("should handle empty collection", () => {
      const postmanCollection = {
        info: {
          name: "Empty Collection",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: [],
      };

      const result = importPostmanCollection(postmanCollection);

      expect(result).toBeDefined();
      expect(result.name).toBe("Empty Collection");
      expect(result.requests).toHaveLength(0);
    });

    it("should handle folders in collection", () => {
      const postmanCollection = {
        info: {
          name: "Collection with Folders",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: [
          {
            name: "Folder 1",
            item: [
              {
                name: "Request in Folder",
                request: {
                  method: "POST",
                  url: {
                    raw: "https://api.example.com/users",
                  },
                },
              },
            ],
          },
        ],
      };

      const result = importPostmanCollection(postmanCollection);

      expect(result.requests).toHaveLength(1);
      expect(result.requests[0].name).toBe("Request in Folder");
    });
  });

  describe("exportToPostmanCollection", () => {
    it("should export collection to Postman format", () => {
      const collection = {
        id: "1",
        name: "Test Collection",
        description: "Test description",
        requests: [
          {
            id: "req1",
            name: "Get Users",
            method: "GET",
            url: "https://api.example.com/users",
            headers: {
              "Content-Type": "application/json",
            },
            body: null,
          },
        ],
      };

      const result = exportToPostmanCollection(collection);

      expect(result.info.name).toBe("Test Collection");
      expect(result.info.schema).toContain("v2.1.0");
      expect(result.item).toHaveLength(1);
      expect(result.item[0].request.method).toBe("GET");
    });
  });

  describe("exportToOpenAPI", () => {
    it("should export collection to OpenAPI 3.0 format", () => {
      const collection = {
        id: "1",
        name: "Test API",
        description: "Test API description",
        requests: [
          {
            id: "req1",
            name: "Get Users",
            method: "GET",
            url: "https://api.example.com/users",
            headers: {},
            body: null,
          },
        ],
      };

      const result = exportToOpenAPI(collection);

      expect(result.openapi).toBe("3.0.0");
      expect(result.info.title).toBe("Test API");
      expect(result.paths).toBeDefined();
      expect(result.paths["/users"]).toBeDefined();
      expect(result.paths["/users"].get).toBeDefined();
    });
  });

  describe("importOpenAPICollection", () => {
    it("should import valid OpenAPI 3.0 schema", () => {
      const openApiSchema = {
        openapi: "3.0.0",
        info: {
          title: "Test API",
          version: "1.0.0",
        },
        paths: {
          "/users": {
            get: {
              summary: "Get users",
              responses: {
                "200": {
                  description: "Success",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = importOpenAPICollection(openApiSchema);

      expect(result).toBeDefined();
      expect(result.name).toBe("Test API");
      expect(result.requests.length).toBeGreaterThan(0);
      expect(result.requests[0].method).toBe("GET");
    });

    it("should handle OpenAPI schema without paths", () => {
      const openApiSchema = {
        openapi: "3.0.0",
        info: {
          title: "Empty API",
          version: "1.0.0",
        },
        paths: {},
      };

      const result = importOpenAPICollection(openApiSchema);

      expect(result).toBeDefined();
      expect(result.name).toBe("Empty API");
      expect(result.requests).toHaveLength(0);
    });
  });
});
