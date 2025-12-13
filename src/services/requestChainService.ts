/**
 * Request Chaining Service - Chain multiple requests với data flow
 */

import { executeRequest } from "./apiService";

export interface ChainStep {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  extractors: DataExtractor[];
  condition?: Condition;
}

export interface DataExtractor {
  id: string;
  source: "response_body" | "response_header" | "response_status";
  path: string; // JSONPath hoặc XPath
  targetVariable: string;
}

export interface Condition {
  type: "always" | "status_code" | "response_contains";
  value?: any;
}

export interface ChainExecutionResult {
  stepId: string;
  success: boolean;
  response?: any;
  error?: string;
  extractedData?: Record<string, any>;
}

/**
 * Extract data từ response sử dụng JSONPath hoặc XPath
 */
function extractData(source: string, path: string, data: any): any {
  if (source === "response_body") {
    try {
      const json = typeof data === "string" ? JSON.parse(data) : data;
      return extractJSONPath(json, path);
    } catch {
      // Not JSON, try simple property access
      return extractSimplePath(data, path);
    }
  } else if (source === "response_header") {
    return data[path] || null;
  } else if (source === "response_status") {
    return data;
  }
  return null;
}

/**
 * Simple JSONPath-like extraction
 */
function extractJSONPath(obj: any, path: string): any {
  if (!path) return obj;
  
  const parts = path.split(".");
  let current = obj;
  
  for (const part of parts) {
    if (part.includes("[")) {
      const [key, indexStr] = part.split("[");
      const index = parseInt(indexStr.replace("]", ""));
      current = current?.[key]?.[index];
    } else {
      current = current?.[part];
    }
    
    if (current === undefined || current === null) {
      return null;
    }
  }
  
  return current;
}

/**
 * Simple path extraction for non-JSON
 */
function extractSimplePath(data: any, path: string): any {
  if (typeof data === "object" && data !== null) {
    return extractJSONPath(data, path);
  }
  return null;
}

/**
 * Evaluate condition
 */
function evaluateCondition(condition: Condition, response: any): boolean {
  if (condition.type === "always") {
    return true;
  }
  
  if (condition.type === "status_code") {
    return response.status === condition.value;
  }
  
  if (condition.type === "response_contains") {
    const body = typeof response.body === "string" ? response.body : JSON.stringify(response.body);
    return body.includes(condition.value);
  }
  
  return true;
}

/**
 * Replace variables trong string
 */
function replaceVariables(text: string, variables: Record<string, any>): string {
  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, String(value));
  });
  return result;
}

/**
 * Execute request chain
 */
export async function executeChain(
  steps: ChainStep[],
  initialVariables: Record<string, any> = {}
): Promise<ChainExecutionResult[]> {
  const results: ChainExecutionResult[] = [];
  let variables = { ...initialVariables };

  for (const step of steps) {
    // Check condition
    if (step.condition && results.length > 0) {
      const lastResult = results[results.length - 1];
      if (!lastResult.response || !evaluateCondition(step.condition, lastResult.response)) {
        results.push({
          stepId: step.id,
          success: false,
          error: "Condition not met, skipping step",
        });
        continue;
      }
    }

    try {
      // Replace variables trong step
      const url = replaceVariables(step.url, variables);
      const headers = Object.fromEntries(
        Object.entries(step.headers).map(([k, v]) => [k, replaceVariables(v, variables)])
      );
      const body = step.body ? replaceVariables(step.body, variables) : undefined;

      // Execute request
      const response = await executeRequest({
        method: step.method,
        url,
        headers,
        body,
      });

      // Extract data
      const extractedData: Record<string, any> = {};
      step.extractors.forEach((extractor) => {
        const value = extractData(
          extractor.source,
          extractor.path,
          extractor.source === "response_body"
            ? response.body
            : extractor.source === "response_header"
            ? response.headers
            : response.status
        );
        extractedData[extractor.targetVariable] = value;
        variables[extractor.targetVariable] = value;
      });

      results.push({
        stepId: step.id,
        success: response.status >= 200 && response.status < 300,
        response,
        extractedData,
      });
    } catch (error: any) {
      results.push({
        stepId: step.id,
        success: false,
        error: error.message || "Request failed",
      });
    }
  }

  return results;
}


