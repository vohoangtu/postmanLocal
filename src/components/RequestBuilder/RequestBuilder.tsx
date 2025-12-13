import { useState, useEffect } from "react";
import AuthConfig from "../Auth/AuthConfig";
import RequestActions from "./RequestActions";
import RequestStatus from "../Loading/RequestStatus";
import SaveRequestModal from "./SaveRequestModal";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";
import { useEnvironmentStore } from "../../stores/environmentStore";
import { useRequestHistoryStore } from "../../stores/requestHistoryStore";
import { useTabStore } from "../../stores/tabStore";
import { useCollectionStore } from "../../stores/collectionStore";
import { saveRequest } from "../../services/storageService";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

interface RequestBuilderProps {
  requestId: string | null;
  onResponse: (response: any) => void;
  tabId?: string;
}

export default function RequestBuilder({ onResponse, tabId }: RequestBuilderProps) {
  const { addToHistory } = useRequestHistoryStore();
  const { getTab, updateTab } = useTabStore();
  const { addRequestToCollection } = useCollectionStore();
  const toast = useToast();
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const tab = tabId ? getTab(tabId) : null;
  
  const [method, setMethod] = useState(tab?.method || "GET");
  const [url, setUrl] = useState(tab?.url || "");
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string; enabled: boolean }>>(
    tab?.requestData?.queryParams || [{ key: "", value: "", enabled: true }]
  );
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>(
    tab?.requestData?.headers || [{ key: "", value: "" }]
  );
  const [bodyType, setBodyType] = useState<"none" | "raw" | "form-data" | "x-www-form-urlencoded">("raw");
  const [body, setBody] = useState(tab?.requestData?.body || "");
  const [formData, setFormData] = useState<Array<{ key: string; value: string }>>([
    { key: "", value: "" }
  ]);
  const [auth, setAuth] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const { getVariable } = useEnvironmentStore();

  useEffect(() => {
    if (tabId && tab) {
      setMethod(tab.method);
      setUrl(tab.url);
      setHeaders(tab.requestData?.headers || [{ key: "", value: "" }]);
      setBody(tab.requestData?.body || "");
    }
  }, [tabId, tab]);

  // Keyboard shortcut: Ctrl+S to save
  useKeyboardShortcuts([
    {
      key: "s",
      ctrl: true,
      handler: () => {
        if (!isSaving) {
          setShowSaveModal(true);
        }
      },
      description: "Save request to collection",
    },
  ]);

  useEffect(() => {
    if (tabId) {
      updateTab(tabId, {
        method,
        url,
        requestData: {
          headers,
          body,
          queryParams,
        },
        isDirty: true,
      });
    }
  }, [method, url, headers, body, queryParams, tabId, updateTab]);

  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = getVariable(key);
      return value || match;
    });
  };

  const buildUrl = () => {
    let finalUrl = replaceVariables(url);
    const enabledParams = queryParams.filter(p => p.enabled && p.key);
    if (enabledParams.length === 0) return finalUrl;
    
    try {
      const urlObj = new URL(finalUrl || "http://example.com");
      enabledParams.forEach(param => {
        urlObj.searchParams.append(replaceVariables(param.key), replaceVariables(param.value));
      });
      return urlObj.toString().replace("http://example.com", finalUrl);
    } catch {
      return finalUrl;
    }
  };

  const buildBody = () => {
    if (method === "GET" || method === "HEAD") return null;
    
    if (bodyType === "raw") {
      return replaceVariables(body);
    } else if (bodyType === "form-data") {
      const form = new FormData();
      formData.forEach(item => {
        if (item.key) form.append(replaceVariables(item.key), replaceVariables(item.value));
      });
      return form.toString();
    } else if (bodyType === "x-www-form-urlencoded") {
      const params = new URLSearchParams();
      formData.forEach(item => {
        if (item.key) params.append(replaceVariables(item.key), replaceVariables(item.value));
      });
      return params.toString();
    }
    return null;
  };

  const handleSend = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    const startTime = Date.now();
    setRequestStatus("sending");

    try {
      const headersMap: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headersMap[replaceVariables(h.key)] = replaceVariables(h.value);
      });

      // Apply authentication
      if (auth) {
        if (auth.type === "bearer" && auth.token) {
          headersMap["Authorization"] = `Bearer ${replaceVariables(auth.token)}`;
        } else if (auth.type === "basic" && auth.username && auth.password) {
          const credentials = btoa(`${replaceVariables(auth.username)}:${replaceVariables(auth.password)}`);
          headersMap["Authorization"] = `Basic ${credentials}`;
        } else if (auth.type === "apikey") {
          if (auth.location === "header") {
            headersMap[replaceVariables(auth.name || "api_key")] = replaceVariables(auth.key);
          }
        }
      }

      let finalUrl = buildUrl();
      
      // Add API key to query if needed
      if (auth?.type === "apikey" && auth.location === "query") {
        const urlObj = new URL(finalUrl || "http://example.com");
        urlObj.searchParams.append(replaceVariables(auth.name || "api_key"), replaceVariables(auth.key));
        finalUrl = urlObj.toString().replace("http://example.com", finalUrl);
      }
      
      const finalBody = buildBody();

      // Use apiService which handles both Tauri and Web
      const { executeRequest } = await import("../../services/apiService");
      const response = await executeRequest({
        method,
        url: finalUrl || "",
        headers: headersMap,
        body: finalBody || undefined,
      });

      const duration = Date.now() - startTime;
      const responseData = {
        status: response.status,
        statusText: response.status_text,
        headers: response.headers,
        body: response.body,
      };

      // Add to history
      addToHistory({
        method,
        url: finalUrl,
        status: response.status,
        statusText: response.status_text,
        duration,
      });

      // Update tab
      if (tabId) {
        updateTab(tabId, {
          response: responseData,
          isDirty: false,
        });
      }

      setRequestStatus("success");
      toast.success(`Request completed in ${duration}ms`);
      onResponse(responseData);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = {
        error: error instanceof Error ? error.message : "Unknown error",
      };

      // Add to history even on error
      const errorUrl = buildUrl();
      addToHistory({
        method,
        url: errorUrl || url,
        duration,
      });

      if (tabId) {
        updateTab(tabId, {
          response: errorResponse,
        });
      }

      setRequestStatus("error");
      toast.error(errorResponse.error || "Request failed");
      onResponse(errorResponse);
    }
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "", enabled: true }]);
  };

  const updateQueryParam = (index: number, field: "key" | "value" | "enabled", value: string | boolean) => {
    const newParams = [...queryParams];
    if (field === "enabled") {
      newParams[index].enabled = value as boolean;
    } else {
      newParams[index][field] = value as string;
    }
    setQueryParams(newParams);
  };

  const addFormDataField = () => {
    setFormData([...formData, { key: "", value: "" }]);
  };

  const updateFormData = (index: number, field: "key" | "value", value: string) => {
    const newFormData = [...formData];
    newFormData[index][field] = value;
    setFormData(newFormData);
  };

  const handleSaveRequest = async (collectionId: string, folderId: string | null, requestName: string) => {
    setIsSaving(true);
    try {
      const headersMap: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key) headersMap[replaceVariables(h.key)] = replaceVariables(h.value);
      });

      const requestData = {
        name: requestName,
        method,
        url: buildUrl(),
        headers: headersMap,
        body: buildBody() || undefined,
        queryParams,
      };

      const savedRequest = await saveRequest(requestData, collectionId, folderId || undefined);

      // Update collection store
      addRequestToCollection(collectionId, {
        id: savedRequest.id,
        name: savedRequest.name,
        method: savedRequest.method,
        url: savedRequest.url,
        headers: savedRequest.headers,
        body: savedRequest.body,
        queryParams: savedRequest.queryParams,
        folderId: folderId || undefined,
      });

      toast.success(`Request "${requestName}" đã được lưu vào collection`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu request");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter request URL"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
          />
          <div className="flex items-center gap-2">
            <RequestStatus status={requestStatus} />
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={requestStatus === "sending"}
              loading={requestStatus === "sending"}
            >
              Send
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowSaveModal(true)}
              disabled={requestStatus === "sending"}
            >
              Save
            </Button>
            {tabId && <RequestActions tabId={tabId} />}
          </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAuth(!showAuth)}
            className={`text-sm px-3 py-1 rounded ${
              auth ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            {auth ? "Auth: " + auth.type : "No Auth"}
          </button>
        </div>
        {showAuth && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
            <AuthConfig onAuthChange={setAuth} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Query Parameters Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Query Parameters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={addQueryParam}
            >
              + Add Query Param
            </Button>
          </div>
          <div className="space-y-2">
            {queryParams.map((param, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={param.enabled}
                  onChange={(e) => updateQueryParam(index, "enabled", e.target.checked)}
                  className="w-4 h-4"
                />
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                  placeholder="Key"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Headers Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Headers</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={addHeader}
            >
              + Add Header
            </Button>
          </div>
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                  placeholder="Key"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Body Section */}
        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Body</h3>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">None</option>
                <option value="raw">raw</option>
                <option value="form-data">form-data</option>
                <option value="x-www-form-urlencoded">x-www-form-urlencoded</option>
              </select>
            </div>
            {bodyType === "raw" && (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request body (JSON, etc.)"
                className="w-full h-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
            )}
            {(bodyType === "form-data" || bodyType === "x-www-form-urlencoded") && (
              <div className="space-y-2">
                {formData.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) => updateFormData(index, "key", e.target.value)}
                      placeholder="Key"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => updateFormData(index, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addFormDataField}
                >
                  + Add Field
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <SaveRequestModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveRequest}
        defaultName={tab?.name || "New Request"}
      />
    </div>
  );
}

