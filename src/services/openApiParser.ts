/**
 * OpenAPI 3.0 Schema Parser
 * Parse OpenAPI schema và generate mock routes
 */

import { MockRoute } from "./mockServerService";

export interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: {
    [path: string]: {
      [method: string]: {
        summary?: string;
        description?: string;
        operationId?: string;
        responses?: {
          [statusCode: string]: {
            description?: string;
            content?: {
              [contentType: string]: {
                schema?: any;
                example?: any;
                examples?: { [key: string]: any };
              };
            };
          };
        };
      };
    };
  };
  components?: {
    schemas?: {
      [name: string]: any;
    };
  };
}

/**
 * Parse OpenAPI schema và generate mock routes
 */
export function parseOpenAPISchema(schema: OpenAPISchema): MockRoute[] {
  const routes: MockRoute[] = [];

  if (!schema.paths) {
    return routes;
  }

  // Duyệt qua tất cả paths
  for (const [path, pathItem] of Object.entries(schema.paths)) {
    // Duyệt qua tất cả methods trong path
    for (const [method, operation] of Object.entries(pathItem)) {
      // Chỉ xử lý các HTTP methods hợp lệ
      const httpMethod = method.toUpperCase();
      if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(httpMethod)) {
        continue;
      }

      // Tìm response mặc định (200 hoặc first success response)
      let statusCode = 200;
      let responseBody: any = {};
      let contentType = "application/json";

      if (operation.responses) {
        // Ưu tiên 200, sau đó là 201, sau đó là bất kỳ 2xx nào
        const successStatus = Object.keys(operation.responses).find(
          (s) => s.startsWith("2") || s === "default"
        ) || "200";

        statusCode = parseInt(successStatus) || 200;
        const response = operation.responses[successStatus] || operation.responses["200"];

        if (response?.content) {
          // Lấy content type đầu tiên (thường là application/json)
          contentType = Object.keys(response.content)[0] || "application/json";
          const content = response.content[contentType];

          // Ưu tiên example, sau đó là examples, sau đó generate từ schema
          if (content.example) {
            responseBody = content.example;
          } else if (content.examples && Object.keys(content.examples).length > 0) {
            responseBody = Object.values(content.examples)[0];
          } else if (content.schema) {
            responseBody = generateExampleFromSchema(content.schema, schema.components?.schemas);
          }
        } else {
          // Nếu không có content, tạo response mặc định
          responseBody = {
            message: operation.summary || `${httpMethod} ${path} response`,
            data: null,
          };
        }
      } else {
        // Nếu không có responses, tạo response mặc định
        responseBody = {
          message: operation.summary || `${httpMethod} ${path} response`,
          data: null,
        };
      }

      // Tạo route
      routes.push({
        path: path,
        method: httpMethod,
        status: statusCode,
        headers: {
          "Content-Type": contentType,
        },
        body: responseBody,
        delayMs: 0,
      });
    }
  }

  return routes;
}

/**
 * Generate example value từ JSON schema
 */
function generateExampleFromSchema(
  schema: any,
  components?: { [name: string]: any }
): any {
  if (!schema) {
    return null;
  }

  // Nếu có $ref, resolve reference
  if (schema.$ref) {
    const refPath = schema.$ref.replace("#/components/schemas/", "");
    if (components && components[refPath]) {
      return generateExampleFromSchema(components[refPath], components);
    }
    return null;
  }

  // Xử lý các loại schema
  const type = schema.type || (schema.oneOf ? "oneOf" : null);

  switch (type) {
    case "object":
      const obj: any = {};
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          obj[key] = generateExampleFromSchema(propSchema as any, components);
        }
      }
      return obj;

    case "array":
      const items = schema.items
        ? generateExampleFromSchema(schema.items, components)
        : null;
      return items !== null ? [items] : [];

    case "string":
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      if (schema.format === "date") {
        return new Date().toISOString().split("T")[0];
      }
      if (schema.format === "date-time") {
        return new Date().toISOString();
      }
      if (schema.format === "email") {
        return "example@example.com";
      }
      if (schema.format === "uri") {
        return "https://example.com";
      }
      return schema.example || "string";

    case "number":
    case "integer":
      if (schema.enum && schema.enum.length > 0) {
        return schema.enum[0];
      }
      return schema.example !== undefined ? schema.example : (type === "integer" ? 0 : 0.0);

    case "boolean":
      return schema.example !== undefined ? schema.example : false;

    case "null":
      return null;

    case "oneOf":
    case "anyOf":
      if (schema.oneOf && schema.oneOf.length > 0) {
        return generateExampleFromSchema(schema.oneOf[0], components);
      }
      if (schema.anyOf && schema.anyOf.length > 0) {
        return generateExampleFromSchema(schema.anyOf[0], components);
      }
      return null;

    default:
      return schema.example !== undefined ? schema.example : null;
  }
}

/**
 * Validate OpenAPI schema
 */
export function validateOpenAPISchema(schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema) {
    errors.push("Schema không được để trống");
    return { valid: false, errors };
  }

  if (!schema.openapi && !schema.swagger) {
    errors.push("Schema phải là OpenAPI 3.0 hoặc Swagger 2.0");
  }

  if (schema.openapi && !schema.openapi.startsWith("3.")) {
    errors.push(`OpenAPI version ${schema.openapi} không được hỗ trợ. Chỉ hỗ trợ OpenAPI 3.x`);
  }

  if (!schema.paths || Object.keys(schema.paths).length === 0) {
    errors.push("Schema phải có ít nhất một path");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
