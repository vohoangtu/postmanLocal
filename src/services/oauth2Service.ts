/**
 * OAuth 2.0 Service - Xử lý OAuth 2.0 flows
 */

export type OAuth2Flow = "authorization_code" | "client_credentials" | "implicit" | "pkce";

export interface OAuth2Config {
  flow: OAuth2Flow;
  authorizationUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  codeVerifier?: string; // For PKCE
  codeChallenge?: string; // For PKCE
  codeChallengeMethod?: "plain" | "S256";
}

export interface OAuth2Token {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  expires_at?: Date;
}

/**
 * Generate PKCE code verifier and challenge
 */
export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  // Generate random string
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Generate challenge (SHA256 hash of verifier, base64url encoded)
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  
  return { verifier, challenge };
}

/**
 * Generate state parameter for CSRF protection
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Build authorization URL
 */
export function buildAuthorizationUrl(config: OAuth2Config): string {
  const params = new URLSearchParams({
    response_type: config.flow === "implicit" ? "token" : "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
  });

  if (config.scope) {
    params.append("scope", config.scope);
  }

  if (config.state) {
    params.append("state", config.state);
  }

  if (config.flow === "pkce" && config.codeChallenge) {
    params.append("code_challenge", config.codeChallenge);
    params.append("code_challenge_method", config.codeChallengeMethod || "S256");
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  config: OAuth2Config
): Promise<OAuth2Token> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    body.append("client_secret", config.clientSecret);
  }

  if (config.flow === "pkce" && config.codeVerifier) {
    body.append("code_verifier", config.codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const token: OAuth2Token = await response.json();
  
  // Calculate expiration time
  if (token.expires_in) {
    token.expires_at = new Date(Date.now() + token.expires_in * 1000);
  }

  return token;
}

/**
 * Get client credentials token
 */
export async function getClientCredentialsToken(
  config: OAuth2Config
): Promise<OAuth2Token> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    body.append("client_secret", config.clientSecret);
  }

  if (config.scope) {
    body.append("scope", config.scope);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Client credentials failed: ${error}`);
  }

  const token: OAuth2Token = await response.json();
  
  if (token.expires_in) {
    token.expires_at = new Date(Date.now() + token.expires_in * 1000);
  }

  return token;
}

/**
 * Refresh access token
 */
export async function refreshToken(
  refreshToken: string,
  config: OAuth2Config
): Promise<OAuth2Token> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });

  if (config.clientSecret) {
    body.append("client_secret", config.clientSecret);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const token: OAuth2Token = await response.json();
  
  if (token.expires_in) {
    token.expires_at = new Date(Date.now() + token.expires_in * 1000);
  }

  return token;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: OAuth2Token): boolean {
  if (!token.expires_at) return false;
  return new Date() >= token.expires_at;
}

