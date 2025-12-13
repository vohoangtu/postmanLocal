/**
 * Response Formatters
 * Format response body thành các formats khác nhau
 */

/**
 * Format JSON với indentation
 */
export function formatJSON(json: any, indent: number = 2): string {
  try {
    if (typeof json === 'string') {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, indent);
    }
    return JSON.stringify(json, null, indent);
  } catch (error) {
    return json;
  }
}

/**
 * Format XML
 */
export function formatXML(xml: string): string {
  // Simple XML formatting
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  xml = xml.replace(/>\s+</g, '><');

  for (let i = 0; i < xml.length; i++) {
    const char = xml[i];
    const nextChar = xml[i + 1];

    if (char === '<' && nextChar !== '/') {
      formatted += '\n' + tab.repeat(indent) + char;
      indent++;
    } else if (char === '<' && nextChar === '/') {
      indent--;
      formatted += '\n' + tab.repeat(indent) + char;
    } else if (char === '>') {
      formatted += char;
    } else {
      formatted += char;
    }
  }

  return formatted.trim();
}

/**
 * Format HTML
 */
export function formatHTML(html: string): string {
  // Simple HTML formatting
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  html = html.replace(/>\s+</g, '><');

  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    const nextChar = html[i + 1];
    const prevChar = html[i - 1];

    if (char === '<' && nextChar !== '/') {
      formatted += '\n' + tab.repeat(indent) + char;
      indent++;
    } else if (char === '<' && nextChar === '/') {
      indent = Math.max(0, indent - 1);
      formatted += '\n' + tab.repeat(indent) + char;
    } else if (char === '>') {
      formatted += char;
    } else {
      formatted += char;
    }
  }

  return formatted.trim();
}

/**
 * Minify JSON
 */
export function minifyJSON(json: any): string {
  try {
    if (typeof json === 'string') {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed);
    }
    return JSON.stringify(json);
  } catch (error) {
    return String(json);
  }
}

/**
 * Format response based on content type
 */
export function formatResponse(body: any, contentType?: string): string {
  if (!body) return '';

  const content = typeof body === 'string' ? body : JSON.stringify(body);

  if (contentType?.includes('application/json')) {
    return formatJSON(content);
  } else if (contentType?.includes('application/xml') || contentType?.includes('text/xml')) {
    return formatXML(content);
  } else if (contentType?.includes('text/html')) {
    return formatHTML(content);
  }

  // Try to detect format
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      JSON.parse(content);
      return formatJSON(content);
    } catch {
      return content;
    }
  } else if (content.trim().startsWith('<')) {
    if (content.includes('<?xml') || content.includes('<xml')) {
      return formatXML(content);
    } else {
      return formatHTML(content);
    }
  }

  return content;
}

/**
 * Detect content type từ response
 */
export function detectContentType(body: any, headers?: Record<string, string>): string {
  if (headers?.['content-type']) {
    return headers['content-type'].split(';')[0];
  }

  if (!body) return 'text/plain';

  const content = typeof body === 'string' ? body : JSON.stringify(body);

  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      JSON.parse(content);
      return 'application/json';
    } catch {
      return 'text/plain';
    }
  } else if (content.trim().startsWith('<?xml') || content.trim().startsWith('<xml')) {
    return 'application/xml';
  } else if (content.trim().startsWith('<html') || content.trim().startsWith('<!DOCTYPE')) {
    return 'text/html';
  }

  return 'text/plain';
}
