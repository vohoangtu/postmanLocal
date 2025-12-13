/**
 * Validation utilities cho forms, URLs, JSON, và schemas
 */

/**
 * Validate URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) {
    return { valid: false, error: "URL không được để trống" };
  }

  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "URL phải sử dụng HTTP hoặc HTTPS" };
    }
    return { valid: true };
  } catch {
    // Nếu không phải absolute URL, kiểm tra xem có phải relative path không
    if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
      return { valid: true };
    }
    return { valid: false, error: "URL không hợp lệ" };
  }
}

/**
 * Validate JSON string
 */
export function validateJson(jsonString: string): { valid: boolean; error?: string; data?: any } {
  if (!jsonString.trim()) {
    return { valid: true, data: null };
  }

  try {
    const parsed = JSON.parse(jsonString);
    return { valid: true, data: parsed };
  } catch (error: any) {
    return {
      valid: false,
      error: `JSON không hợp lệ: ${error.message}`,
    };
  }
}

/**
 * Validate GraphQL query syntax
 */
export function validateGraphQLQuery(query: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!query.trim()) {
    errors.push("Query không được để trống");
    return { valid: false, errors };
  }

  // Kiểm tra balanced braces
  const openBraces = (query.match(/\{/g) || []).length;
  const closeBraces = (query.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push("Số lượng dấu ngoặc nhọn không khớp");
  }

  // Kiểm tra balanced parentheses
  const openParens = (query.match(/\(/g) || []).length;
  const closeParens = (query.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push("Số lượng dấu ngoặc đơn không khớp");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email.trim()) {
    return { valid: false, error: "Email không được để trống" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Email không hợp lệ" };
  }

  return { valid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === "") {
    return { valid: false, error: `${fieldName} không được để trống` };
  }

  if (typeof value === "string" && !value.trim()) {
    return { valid: false, error: `${fieldName} không được để trống` };
  }

  return { valid: true };
}

/**
 * Validate HTTP method
 */
export function validateHttpMethod(method: string): { valid: boolean; error?: string } {
  const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
  if (!validMethods.includes(method.toUpperCase())) {
    return {
      valid: false,
      error: `Method không hợp lệ. Chỉ chấp nhận: ${validMethods.join(", ")}`,
    };
  }
  return { valid: true };
}

/**
 * Validate port number
 */
export function validatePort(port: number | string): { valid: boolean; error?: string } {
  const portNum = typeof port === "string" ? parseInt(port, 10) : port;

  if (isNaN(portNum)) {
    return { valid: false, error: "Port phải là số" };
  }

  if (portNum < 1 || portNum > 65535) {
    return { valid: false, error: "Port phải nằm trong khoảng 1-65535" };
  }

  return { valid: true };
}

/**
 * Validate JSON Schema (basic validation)
 */
export function validateJsonSchema(schema: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema || typeof schema !== "object") {
    errors.push("Schema phải là một object");
    return { valid: false, errors };
  }

  // Kiểm tra các trường bắt buộc của JSON Schema
  if (schema.type && !["string", "number", "integer", "boolean", "object", "array", "null"].includes(schema.type)) {
    errors.push(`Type không hợp lệ: ${schema.type}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate form với multiple fields
 */
export interface FormValidationRule {
  field: string;
  validator: (value: any) => { valid: boolean; error?: string };
  required?: boolean;
}

export function validateForm(
  data: Record<string, any>,
  rules: FormValidationRule[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const rule of rules) {
    const value = data[rule.field];

    // Check required
    if (rule.required) {
      const requiredValidation = validateRequired(value, rule.field);
      if (!requiredValidation.valid) {
        errors[rule.field] = requiredValidation.error || "";
        continue;
      }
    }

    // Skip validation nếu field không required và empty
    if (!rule.required && (value === null || value === undefined || value === "")) {
      continue;
    }

    // Run custom validator
    const validation = rule.validator(value);
    if (!validation.valid) {
      errors[rule.field] = validation.error || "";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
