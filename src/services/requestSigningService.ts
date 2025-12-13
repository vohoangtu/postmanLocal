/**
 * Request Signing Service
 * Sign API requests với HMAC để prevent tampering
 */

/**
 * Generate HMAC signature cho request
 */
export async function signRequest(
  method: string,
  url: string,
  body: string | null,
  secret: string,
  timestamp: number = Date.now()
): Promise<string> {
  const message = `${method}\n${url}\n${body || ''}\n${timestamp}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Verify request signature
 */
export async function verifyRequest(
  method: string,
  url: string,
  body: string | null,
  signature: string,
  timestamp: number,
  secret: string,
  maxAge: number = 300000 // 5 minutes
): Promise<boolean> {
  // Check timestamp để prevent replay attacks
  const now = Date.now();
  if (Math.abs(now - timestamp) > maxAge) {
    return false;
  }

  const expectedSignature = await signRequest(method, url, body, secret, timestamp);
  return signature === expectedSignature;
}

/**
 * Add signature to request headers
 */
export async function addRequestSignature(
  request: Request,
  secret: string
): Promise<Request> {
  const timestamp = Date.now();
  const url = new URL(request.url);
  const body = request.body ? await request.clone().text() : null;
  
  const signature = await signRequest(
    request.method,
    url.pathname + url.search,
    body,
    secret,
    timestamp
  );

  // Tạo request mới với signature headers
  const headers = new Headers(request.headers);
  headers.set('X-Request-Signature', signature);
  headers.set('X-Request-Timestamp', timestamp.toString());

  return new Request(request.url, {
    method: request.method,
    headers: headers,
    body: request.body,
  });
}
