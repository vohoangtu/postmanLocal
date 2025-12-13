import { useState } from "react";

type AuthType = "none" | "bearer" | "basic" | "apikey" | "oauth2";

interface AuthConfigProps {
  onAuthChange: (auth: any) => void;
}

export default function AuthConfig({ onAuthChange }: AuthConfigProps) {
  const [authType, setAuthType] = useState<AuthType>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyLocation, setApiKeyLocation] = useState<"header" | "query">("header");
  const [apiKeyName, setApiKeyName] = useState("");

  const handleAuthTypeChange = (type: AuthType) => {
    setAuthType(type);
    if (type === "none") {
      onAuthChange(null);
    }
  };

  const updateAuth = () => {
    let auth: any = { type: authType };

    switch (authType) {
      case "bearer":
        auth.token = bearerToken;
        break;
      case "basic":
        auth.username = basicUsername;
        auth.password = basicPassword;
        break;
      case "apikey":
        auth.key = apiKey;
        auth.location = apiKeyLocation;
        auth.name = apiKeyName || "api_key";
        break;
    }

    onAuthChange(auth);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Authentication Type
        </label>
        <select
          value={authType}
          onChange={(e) => handleAuthTypeChange(e.target.value as AuthType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
          <option value="oauth2">OAuth 2.0</option>
        </select>
      </div>

      {authType === "bearer" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Token
          </label>
          <input
            type="text"
            value={bearerToken}
            onChange={(e) => {
              setBearerToken(e.target.value);
              updateAuth();
            }}
            placeholder="Enter bearer token"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {authType === "basic" && (
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={basicUsername}
              onChange={(e) => {
                setBasicUsername(e.target.value);
                updateAuth();
              }}
              placeholder="Username"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={basicPassword}
              onChange={(e) => {
                setBasicPassword(e.target.value);
                updateAuth();
              }}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {authType === "apikey" && (
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                updateAuth();
              }}
              placeholder="API Key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Key Name
            </label>
            <input
              type="text"
              value={apiKeyName}
              onChange={(e) => {
                setApiKeyName(e.target.value);
                updateAuth();
              }}
              placeholder="api_key"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <select
              value={apiKeyLocation}
              onChange={(e) => {
                setApiKeyLocation(e.target.value as "header" | "query");
                updateAuth();
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="header">Header</option>
              <option value="query">Query Parameter</option>
            </select>
          </div>
        </div>
      )}

      {authType === "oauth2" && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
          OAuth 2.0 support coming soon
        </div>
      )}
    </div>
  );
}


