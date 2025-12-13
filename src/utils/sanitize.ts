/**
 * Input Sanitization Utilities
 * Sanitize user input để prevent XSS attacks
 */

/**
 * Sanitize HTML string - remove dangerous tags và attributes
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sanitize string - escape HTML entities
 */
export function sanitizeString(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return str.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitize URL - validate và sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Chỉ allow http, https, ws, wss protocols
    const allowedProtocols = ['http:', 'https:', 'ws:', 'wss:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return null;
    }
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize JSON - validate JSON string
 */
export function sanitizeJson(jsonString: string): any | null {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
}

/**
 * Sanitize email - basic email validation
 */
export function sanitizeEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(email)) {
    return email.toLowerCase().trim();
  }
  return null;
}

/**
 * Sanitize input based on type
 */
export function sanitizeInput(input: string, type: 'string' | 'url' | 'email' | 'json' | 'html'): string | any | null {
  switch (type) {
    case 'string':
      return sanitizeString(input);
    case 'url':
      return sanitizeUrl(input);
    case 'email':
      return sanitizeEmail(input);
    case 'json':
      return sanitizeJson(input);
    case 'html':
      return sanitizeHtml(input);
    default:
      return sanitizeString(input);
  }
}
