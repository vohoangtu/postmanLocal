import { useState, useEffect } from "react";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";
import {
  OAuth2Config,
  OAuth2Flow,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  getClientCredentialsToken,
  generatePKCE,
  generateState,
  refreshToken,
  isTokenExpired,
} from "../../services/oauth2Service";
import { ExternalLink, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface OAuth2ConfigProps {
  onAuthChange: (auth: any) => void;
  initialConfig?: Partial<OAuth2Config>;
}

export default function OAuth2ConfigComponent({ onAuthChange, initialConfig }: OAuth2ConfigProps) {
  const [flow, setFlow] = useState<OAuth2Flow>(initialConfig?.flow || "authorization_code");
  const [authorizationUrl, setAuthorizationUrl] = useState(initialConfig?.authorizationUrl || "");
  const [tokenUrl, setTokenUrl] = useState(initialConfig?.tokenUrl || "");
  const [clientId, setClientId] = useState(initialConfig?.clientId || "");
  const [clientSecret, setClientSecret] = useState(initialConfig?.clientSecret || "");
  const [redirectUri, setRedirectUri] = useState(initialConfig?.redirectUri || "http://localhost:3000/callback");
  const [scope, setScope] = useState(initialConfig?.scope || "");
  const [state, setState] = useState<string>("");
  const [codeVerifier, setCodeVerifier] = useState<string>("");
  const [codeChallenge, setCodeChallenge] = useState<string>("");
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (flow === "pkce") {
      generatePKCE().then((result) => {
        setCodeVerifier(result.verifier);
        setCodeChallenge(result.challenge);
      });
    }
    const newState = generateState();
    setState(newState);
  }, [flow]);

  useEffect(() => {
    if (token) {
      onAuthChange({
        type: "oauth2",
        flow,
        token: token.access_token,
        tokenType: token.token_type || "Bearer",
        refreshToken: token.refresh_token,
        expiresAt: token.expires_at,
      });
    }
  }, [token, flow, onAuthChange]);

  const handleAuthorize = () => {
    if (!authorizationUrl || !clientId || !redirectUri) {
      toast.error("Please fill in all required fields");
      return;
    }

    const config: OAuth2Config = {
      flow,
      authorizationUrl,
      tokenUrl,
      clientId,
      clientSecret: clientSecret || undefined,
      redirectUri,
      scope: scope || undefined,
      state,
      codeVerifier: codeVerifier || undefined,
      codeChallenge: codeChallenge || undefined,
      codeChallengeMethod: flow === "pkce" ? "S256" : undefined,
    };

    const authUrl = buildAuthorizationUrl(config);
    
    // Open authorization URL in new window
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      authUrl,
      "OAuth2 Authorization",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for redirect
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        return;
      }

      try {
        const url = popup?.location.href;
        if (url && url.includes(redirectUri)) {
          clearInterval(checkPopup);
          popup?.close();

          const urlObj = new URL(url);
          const code = urlObj.searchParams.get("code");
          const error = urlObj.searchParams.get("error");
          const returnedState = urlObj.searchParams.get("state");

          if (error) {
            toast.error(`Authorization failed: ${error}`);
            return;
          }

          if (returnedState !== state) {
            toast.error("State mismatch. Possible CSRF attack.");
            return;
          }

          if (code) {
            handleExchangeCode(code, config);
          } else if (flow === "implicit") {
            // Implicit flow returns token in URL fragment
            const fragment = urlObj.hash.substring(1);
            const params = new URLSearchParams(fragment);
            const accessToken = params.get("access_token");
            if (accessToken) {
              setToken({
                access_token: accessToken,
                token_type: params.get("token_type") || "Bearer",
                expires_in: params.get("expires_in") ? parseInt(params.get("expires_in")!) : undefined,
              });
              toast.success("Authorization successful");
            }
          }
        }
      } catch (e) {
        // Cross-origin error, ignore
      }
    }, 100);
  };

  const handleExchangeCode = async (code: string, config: OAuth2Config) => {
    setLoading(true);
    try {
      const newToken = await exchangeCodeForToken(code, config);
      setToken(newToken);
      toast.success("Token obtained successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to exchange code for token");
    } finally {
      setLoading(false);
    }
  };

  const handleClientCredentials = async () => {
    if (!tokenUrl || !clientId) {
      toast.error("Please fill in token URL and client ID");
      return;
    }

    setLoading(true);
    try {
      const config: OAuth2Config = {
        flow: "client_credentials",
        authorizationUrl: "",
        tokenUrl,
        clientId,
        clientSecret: clientSecret || undefined,
        redirectUri: "",
        scope: scope || undefined,
      };

      const newToken = await getClientCredentialsToken(config);
      setToken(newToken);
      toast.success("Token obtained successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to get client credentials token");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!token?.refresh_token || !tokenUrl) {
      toast.error("No refresh token available");
      return;
    }

    setLoading(true);
    try {
      const config: OAuth2Config = {
        flow,
        authorizationUrl,
        tokenUrl,
        clientId,
        clientSecret: clientSecret || undefined,
        redirectUri,
      };

      const newToken = await refreshToken(token.refresh_token, config);
      setToken(newToken);
      toast.success("Token refreshed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to refresh token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          OAuth 2.0 Flow
        </label>
        <select
          value={flow}
          onChange={(e) => setFlow(e.target.value as OAuth2Flow)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="authorization_code">Authorization Code</option>
          <option value="client_credentials">Client Credentials</option>
          <option value="implicit">Implicit</option>
          <option value="pkce">PKCE</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Authorization URL
        </label>
        <input
          type="text"
          value={authorizationUrl}
          onChange={(e) => setAuthorizationUrl(e.target.value)}
          placeholder="https://example.com/oauth/authorize"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Token URL
        </label>
        <input
          type="text"
          value={tokenUrl}
          onChange={(e) => setTokenUrl(e.target.value)}
          placeholder="https://example.com/oauth/token"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Client ID *
        </label>
        <input
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Your client ID"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Client Secret
        </label>
        <input
          type="password"
          value={clientSecret}
          onChange={(e) => setClientSecret(e.target.value)}
          placeholder="Your client secret (optional for PKCE)"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {(flow === "authorization_code" || flow === "implicit" || flow === "pkce") && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Redirect URI
          </label>
          <input
            type="text"
            value={redirectUri}
            onChange={(e) => setRedirectUri(e.target.value)}
            placeholder="http://localhost:3000/callback"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Scope (optional)
        </label>
        <input
          type="text"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="read write"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {flow === "pkce" && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
            PKCE Code Verifier and Challenge generated automatically
          </p>
          <div className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">
            Challenge: {codeChallenge.substring(0, 20)}...
          </div>
        </div>
      )}

      {token && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isTokenExpired(token) ? (
                <XCircle size={16} className="text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Token {isTokenExpired(token) ? "Expired" : "Active"}
              </span>
            </div>
            {token.refresh_token && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                loading={loading}
              >
                <RefreshCw size={14} className="mr-1" />
                Refresh
              </Button>
            )}
          </div>
          {token.expires_at && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Expires: {token.expires_at.toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {flow === "client_credentials" ? (
          <Button
            variant="primary"
            onClick={handleClientCredentials}
            disabled={loading || !tokenUrl || !clientId}
            loading={loading}
            className="flex-1"
          >
            Get Token
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleAuthorize}
            disabled={loading || !authorizationUrl || !clientId || !redirectUri}
            loading={loading}
            className="flex-1"
          >
            <ExternalLink size={14} className="mr-1" />
            Authorize
          </Button>
        )}
      </div>
    </div>
  );
}

