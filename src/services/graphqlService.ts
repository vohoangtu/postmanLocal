/**
 * GraphQL Service - Xử lý GraphQL queries, mutations, subscriptions
 */

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse {
  data?: any;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
  extensions?: Record<string, any>;
}

/**
 * Execute GraphQL query/mutation
 */
export async function executeGraphQL(
  url: string,
  request: GraphQLRequest,
  headers: Record<string, string> = {}
): Promise<GraphQLResponse> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        query: request.query,
        variables: request.variables || {},
        operationName: request.operationName,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GraphQLResponse = await response.json();
    return data;
  } catch (error: any) {
    return {
      errors: [
        {
          message: error.message || "Failed to execute GraphQL request",
        },
      ],
    };
  }
}

/**
 * Introspect GraphQL schema
 */
export async function introspectSchema(
  url: string,
  headers: Record<string, string> = {}
): Promise<any> {
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types {
          ...FullType
        }
        directives {
          name
          description
          locations
          args {
            ...InputValue
          }
        }
      }
    }
    fragment FullType on __Type {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }
    fragment InputValue on __InputValue {
      name
      description
      type { ...TypeRef }
      defaultValue
    }
    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await executeGraphQL(url, { query: introspectionQuery }, headers);
  
  if (response.errors) {
    throw new Error(response.errors.map((e) => e.message).join(", "));
  }

  return response.data;
}

/**
 * Validate GraphQL query syntax
 */
export function validateQuery(query: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!query.trim()) {
    errors.push("Query cannot be empty");
    return { valid: false, errors };
  }

  // Basic syntax checks
  const openBraces = (query.match(/\{/g) || []).length;
  const closeBraces = (query.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push("Unmatched braces in query");
  }

  const openParens = (query.match(/\(/g) || []).length;
  const closeParens = (query.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push("Unmatched parentheses in query");
  }

  // Check for required GraphQL keywords
  const hasQuery = query.includes("query") || query.includes("mutation") || query.includes("subscription");
  if (!hasQuery && query.trim().startsWith("{")) {
    // Shorthand query, should be fine
  } else if (!hasQuery) {
    errors.push("Query must contain 'query', 'mutation', or 'subscription' keyword");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract operation name from query
 */
export function extractOperationName(query: string): string | null {
  const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);
  return match ? match[1] : null;
}

/**
 * Format GraphQL query
 */
export function formatQuery(query: string): string {
  // Basic formatting - can be enhanced with a proper formatter
  let formatted = query;
  let indent = 0;
  const lines = query.split("\n");
  const formattedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      formattedLines.push("");
      continue;
    }

    if (trimmed.includes("}")) {
      indent = Math.max(0, indent - 2);
    }

    formattedLines.push(" ".repeat(indent) + trimmed);

    if (trimmed.includes("{")) {
      indent += 2;
    }
  }

  return formattedLines.join("\n");
}





