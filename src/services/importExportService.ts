/**
 * Import/Export Service
 * Hỗ trợ import/export collections từ Postman format và OpenAPI
 */

import { useCollectionStore, Request, Collection } from "../stores/collectionStore";
import { authService } from "./authService";

// Postman Collection v2.1 format
export interface PostmanCollection {
  info: {
    name: string;
    description?: string;
    schema: string;
  };
  item: PostmanItem[];
  variable?: PostmanVariable[];
}

export interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[]; // For folders
  description?: string;
}

export interface PostmanRequest {
  method: string;
  header?: Array<{ key: string; value: string }>;
  url: PostmanUrl | string;
  body?: {
    mode: string;
    raw?: string;
    formdata?: Array<{ key: string; value: string }>;
    urlencoded?: Array<{ key: string; value: string }>;
  };
}

export interface PostmanUrl {
  raw?: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: Array<{ key: string; value: string; disabled?: boolean }>;
}

export interface PostmanVariable {
  key: string;
  value: string;
}

/**
 * Decode HTML entities trong string
 * Xử lý các entities phổ biến như &quot;, &amp;, &lt;, &gt;, etc.
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  // Sử dụng DOM API nếu có (browser environment)
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  
  // Fallback: manual decode cho các entities phổ biến
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Import Postman Collection
 */
export function importPostmanCollection(
  postmanData: PostmanCollection
): { collection: Collection; requests: Request[]; variables?: PostmanVariable[] } {
  const requests: Request[] = [];

  // Recursive function để parse items (bao gồm folders)
  function parseItems(items: PostmanItem[], folderId?: string): void {
    for (const item of items) {
      if (item.request) {
        // Đây là một request
        let url = typeof item.request.url === "string"
          ? item.request.url
          : item.request.url.raw || item.request.url.host?.join(".") + "/" + item.request.url.path?.join("/") || "";

        // Decode HTML entities trong URL nếu có
        if (url) {
          url = decodeHtmlEntities(url);
        }

        const headers: Record<string, string> = {};
        if (item.request.header) {
          for (const header of item.request.header) {
            // Decode HTML entities trong header values
            headers[header.key] = decodeHtmlEntities(header.value);
          }
        }

        let body: string | undefined;
        if (item.request.body) {
          if (item.request.body.mode === "raw" && item.request.body.raw) {
            // Decode HTML entities trong raw body (quan trọng cho JSON với &quot;)
            body = decodeHtmlEntities(item.request.body.raw);
          } else if (item.request.body.mode === "formdata" && item.request.body.formdata) {
            const formDataObj: Record<string, string> = {};
            item.request.body.formdata.forEach((f) => {
              // Decode HTML entities trong form data values
              formDataObj[decodeHtmlEntities(f.key)] = decodeHtmlEntities(f.value);
            });
            body = JSON.stringify(formDataObj);
          } else if (item.request.body.mode === "urlencoded" && item.request.body.urlencoded) {
            const urlEncodedObj: Record<string, string> = {};
            item.request.body.urlencoded.forEach((f) => {
              // Decode HTML entities trong urlencoded values
              urlEncodedObj[decodeHtmlEntities(f.key)] = decodeHtmlEntities(f.value);
            });
            body = JSON.stringify(urlEncodedObj);
          }
        }

        const queryParams: Array<{ key: string; value: string; enabled: boolean }> = [];
        if (typeof item.request.url !== "string" && item.request.url.query) {
          for (const query of item.request.url.query) {
            // Decode HTML entities trong query params
            queryParams.push({
              key: decodeHtmlEntities(query.key),
              value: decodeHtmlEntities(query.value),
              enabled: !query.disabled,
            });
          }
        }

        requests.push({
          id: `req-${Date.now()}-${Math.random()}`,
          name: item.name,
          method: item.request.method,
          url,
          headers,
          body,
          queryParams,
          folderId,
        });
      } else if (item.item) {
        // Đây là một folder, parse recursively
        const currentFolderId = `folder-${Date.now()}-${Math.random()}`;
        parseItems(item.item, currentFolderId);
      }
    }
  }

  parseItems(postmanData.item);

  const collection: Collection = {
    id: `col-${Date.now()}`,
    name: postmanData.info.name,
    description: postmanData.info.description,
    requests,
  };

  // Trả về cả variables từ Postman collection để có thể tạo environment
  return { 
    collection, 
    requests,
    variables: postmanData.variable || []
  };
}

/**
 * Export Collection to Postman format
 */
export function exportToPostmanCollection(collection: Collection): PostmanCollection {
  // Convert requests to Postman items
  const items: PostmanItem[] = collection.requests.map((req) => {
    const url: PostmanUrl = {
      raw: req.url,
    };

    // Parse URL để extract components
    try {
      const urlObj = new URL(req.url);
      url.protocol = urlObj.protocol.replace(":", "");
      url.host = [urlObj.hostname];
      url.path = urlObj.pathname.split("/").filter((p) => p);
    } catch {
      // Invalid URL, use raw
    }

    // Parse query params
    if (req.queryParams && req.queryParams.length > 0) {
      url.query = req.queryParams
        .filter((p) => p.enabled && p.key)
        .map((p) => ({
          key: p.key,
          value: p.value,
          disabled: !p.enabled,
        }));
    }

    const headers: Array<{ key: string; value: string }> = [];
    if (req.headers) {
      for (const [key, value] of Object.entries(req.headers)) {
        headers.push({ key, value });
      }
    }

    let body: PostmanRequest["body"] | undefined;
    if (req.body) {
      try {
        // Try to parse as JSON
        JSON.parse(req.body);
        body = {
          mode: "raw",
          raw: req.body,
        };
      } catch {
        // Not JSON, use raw anyway
        body = {
          mode: "raw",
          raw: req.body,
        };
      }
    }

    return {
      name: req.name,
      request: {
        method: req.method,
        header: headers.length > 0 ? headers : undefined,
        url,
        body,
      },
    };
  });

  return {
    info: {
      name: collection.name,
      description: collection.description,
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: items,
  };
}

/**
 * Export Collection to OpenAPI 3.0
 */
export function exportToOpenAPI(collection: Collection): any {
  const paths: Record<string, any> = {};

  for (const req of collection.requests) {
    try {
      const urlObj = new URL(req.url);
      const path = urlObj.pathname || "/";
      const method = req.method.toLowerCase();

      if (!paths[path]) {
        paths[path] = {};
      }

      const operation: any = {
        summary: req.name,
        description: req.name,
        responses: {
          "200": {
            description: "Successful response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          },
        },
      };

      // Add request body nếu có
      if (req.body && ["post", "put", "patch"].includes(method)) {
        operation.requestBody = {
          content: {
            "application/json": {
              schema: {
                type: "object",
              },
              example: req.body,
            },
          },
        };
      }

      // Add parameters từ query params
      if (req.queryParams && req.queryParams.length > 0) {
        operation.parameters = req.queryParams
          .filter((p) => p.enabled && p.key)
          .map((p) => ({
            name: p.key,
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
          }));
      }

      paths[path][method] = operation;
    } catch {
      // Invalid URL, skip
    }
  }

  return {
    openapi: "3.0.0",
    info: {
      title: collection.name,
      description: collection.description || "",
      version: "1.0.0",
    },
    paths,
  };
}

/**
 * Import OpenAPI to Collection
 */
export function importOpenAPICollection(openApiData: any): { collection: Collection; requests: Request[] } {
  const requests: Request[] = [];

  if (!openApiData.paths) {
    return {
      collection: {
        id: `col-${Date.now()}`,
        name: openApiData.info?.title || "Imported Collection",
        description: openApiData.info?.description,
        requests: [],
      },
      requests: [],
    };
  }

  const baseUrl = openApiData.servers?.[0]?.url || "";

  for (const [path, pathItem] of Object.entries(openApiData.paths)) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      if (!["get", "post", "put", "patch", "delete", "head", "options"].includes(method.toLowerCase())) {
        continue;
      }

      const url = baseUrl + path;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      let body: string | undefined;
      if (operation.requestBody) {
        const content = operation.requestBody.content;
        const jsonContent = content["application/json"];
        if (jsonContent?.example) {
          body = typeof jsonContent.example === "string"
            ? jsonContent.example
            : JSON.stringify(jsonContent.example, null, 2);
        } else if (jsonContent?.schema) {
          body = JSON.stringify({}, null, 2);
        }
      }

      const queryParams: Array<{ key: string; value: string; enabled: boolean }> = [];
      if (operation.parameters) {
        for (const param of operation.parameters) {
          if (param.in === "query") {
            queryParams.push({
              key: param.name,
              value: "",
              enabled: true,
            });
          }
        }
      }

      requests.push({
        id: `req-${Date.now()}-${Math.random()}`,
        name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
        method: method.toUpperCase(),
        url,
        headers,
        body,
        queryParams,
      });
    }
  }

  const collection: Collection = {
    id: `col-${Date.now()}`,
    name: openApiData.info?.title || "Imported Collection",
    description: openApiData.info?.description,
    requests,
  };

  return { collection, requests };
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string = "application/json") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import collections vào workspace từ file
 */
export async function importCollectionsToWorkspace(
  workspaceId: string,
  file: File
): Promise<{ collections: Collection[]; errors: string[] }> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  const fileContent = await file.text();
  const errors: string[] = [];
  const collections: Collection[] = [];

  try {
    let parsedData: any;
    
    // Detect format
    if (file.name.endsWith('.json')) {
      parsedData = JSON.parse(fileContent);
    } else {
      throw new Error('Unsupported file format. Please use JSON files.');
    }

    // Check if it's Postman collection format
    if (parsedData.info && parsedData.item) {
      const { collection, requests } = importPostmanCollection(parsedData);
      
      // Create collection in workspace via API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: collection.name,
            description: collection.description,
            workspace_id: workspaceId,
            data: { requests },
          }),
        }
      );

      if (response.ok) {
        const createdCollection = await response.json();
        collections.push({
          id: createdCollection.id.toString(),
          name: createdCollection.name,
          description: createdCollection.description,
          requests,
          workspace_id: workspaceId,
        });
      } else {
        const error = await response.json();
        errors.push(`Failed to import "${collection.name}": ${error.message || 'Unknown error'}`);
      }
    } 
    // Check if it's OpenAPI format
    else if (parsedData.openapi || parsedData.swagger) {
      const { collection, requests } = importOpenAPICollection(parsedData);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: collection.name,
            description: collection.description,
            workspace_id: workspaceId,
            data: { requests },
          }),
        }
      );

      if (response.ok) {
        const createdCollection = await response.json();
        collections.push({
          id: createdCollection.id.toString(),
          name: createdCollection.name,
          description: createdCollection.description,
          requests,
          workspace_id: workspaceId,
        });
      } else {
        const error = await response.json();
        errors.push(`Failed to import "${collection.name}": ${error.message || 'Unknown error'}`);
      }
    }
    // Check if it's array of collections (bulk import)
    else if (Array.isArray(parsedData)) {
      for (const collectionData of parsedData) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: collectionData.name || 'Imported Collection',
                description: collectionData.description,
                workspace_id: workspaceId,
                data: collectionData.data || { requests: collectionData.requests || [] },
              }),
            }
          );

          if (response.ok) {
            const createdCollection = await response.json();
            collections.push({
              id: createdCollection.id.toString(),
              name: createdCollection.name,
              description: createdCollection.description,
              requests: collectionData.requests || [],
              workspace_id: workspaceId,
            });
          } else {
            const error = await response.json();
            errors.push(`Failed to import "${collectionData.name}": ${error.message || 'Unknown error'}`);
          }
        } catch (error: any) {
          errors.push(`Error importing collection: ${error.message}`);
        }
      }
    } else {
      throw new Error('Unsupported file format');
    }
  } catch (error: any) {
    errors.push(`Failed to parse file: ${error.message}`);
  }

  return { collections, errors };
}

/**
 * Export collections từ workspace
 */
export async function exportWorkspaceCollections(
  workspaceId: string,
  format: 'postman' | 'openapi' | 'json' = 'json'
): Promise<void> {
  const token = await authService.getAccessToken();
  if (!token) {
    throw new Error('Chưa đăng nhập');
  }

  // Load collections from workspace
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/collections?workspace_id=${workspaceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to load collections');
  }

  const collections = await response.json();
  const collectionsList = Array.isArray(collections) ? collections : (collections.data || []);

  if (collectionsList.length === 0) {
    throw new Error('No collections found in workspace');
  }

  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === 'postman') {
    // Export as Postman collection (combine all collections)
    const postmanCollection = {
      info: {
        name: `Workspace Collections Export`,
        description: `Exported from workspace`,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: collectionsList.flatMap((col: Collection) => {
        const postman = exportToPostmanCollection({
          id: col.id.toString(),
          name: col.name,
          description: col.description,
          requests: col.requests || [],
        });
        return postman.item;
      }),
    };
    content = JSON.stringify(postmanCollection, null, 2);
    filename = `workspace-collections-${workspaceId}-${Date.now()}.json`;
    mimeType = 'application/json';
  } else if (format === 'openapi') {
    // Export as OpenAPI (combine all collections)
    const openApi = {
      openapi: '3.0.0',
      info: {
        title: 'Workspace Collections',
        description: 'Exported from workspace',
        version: '1.0.0',
      },
      paths: {},
    };

    for (const col of collectionsList) {
      const openApiCollection = exportToOpenAPI({
        id: col.id.toString(),
        name: col.name,
        description: col.description,
        requests: col.requests || [],
      });
      Object.assign(openApi.paths, openApiCollection.paths);
    }

    content = JSON.stringify(openApi, null, 2);
    filename = `workspace-collections-${workspaceId}-${Date.now()}.json`;
    mimeType = 'application/json';
  } else {
    // Export as JSON array
    content = JSON.stringify(collectionsList, null, 2);
    filename = `workspace-collections-${workspaceId}-${Date.now()}.json`;
    mimeType = 'application/json';
  }

  downloadFile(content, filename, mimeType);
}
