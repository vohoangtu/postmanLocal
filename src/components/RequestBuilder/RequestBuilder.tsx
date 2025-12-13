import { useState, useEffect } from "react";
import AuthConfig from "../Auth/AuthConfig";
import RequestActions from "./RequestActions";
import RequestStatus from "../Loading/RequestStatus";
import SaveRequestModal from "./SaveRequestModal";
import GraphQLRequestBuilder from "./GraphQLRequestBuilder";
import WebSocketTester from "../WebSocket/WebSocketTester";
import Button from "../UI/Button";
import TabButton from "../UI/TabButton";
import { useToast } from "../../hooks/useToast";
import { useEnvironmentStore } from "../../stores/environmentStore";
import { useRequestHistoryStore } from "../../stores/requestHistoryStore";
import { useTabStore } from "../../stores/tabStore";
import { usePanelStore } from "../../stores/panelStore";
import Tooltip from "../UI/Tooltip";
import { useCollectionStore } from "../../stores/collectionStore";
import { saveRequest } from "../../services/storageService";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { Code2, Network, MessageSquare, StickyNote, X, Send, Save, Settings } from "lucide-react";
import CommentsPanel from "../Comments/CommentsPanel";
import AnnotationEditor from "../Annotations/AnnotationEditor";
import ComponentErrorBoundary from "../Error/ComponentErrorBoundary";

interface RequestBuilderProps {
  requestId: string | null;
  onResponse: (response: any) => void;
  tabId?: string;
}

export default function RequestBuilder({ onResponse, tabId }: RequestBuilderProps) {
  const { addToHistory } = useRequestHistoryStore();
  const { getTab, updateTab, closeTab } = useTabStore();
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
  const [requestType, setRequestType] = useState<"rest" | "graphql" | "websocket">("rest");
  const { activeCollaborationTab, setActiveCollaborationTab } = usePanelStore();
  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);
  const [savedCollectionId, setSavedCollectionId] = useState<string | null>(null);
  const { replaceVariables } = useEnvironmentStore();

  useEffect(() => {
    if (tabId && tab) {
      setMethod(tab.method);
      setUrl(tab.url);
      setHeaders(tab.requestData?.headers || [{ key: "", value: "" }]);
      setBody(tab.requestData?.body || "");
    }
  }, [tabId, tab]);

  // Keyboard shortcuts
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
    {
      key: "w",
      ctrl: true,
      handler: () => {
        if (tabId) {
          closeTab(tabId);
        }
      },
      description: "Close current request",
    },
    {
      key: "Enter",
      ctrl: true,
      handler: () => {
        if (requestStatus !== "sending") {
          handleSend();
        }
      },
      description: "Send request",
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

  // const replaceVariables = (text: string): string => {
  //   return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  //     const value = getVariable(key);
  //     return value || match;
  //   });
  // };

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
    if (!url || !url.trim()) {
      toast.error("Vui lòng nhập URL");
      return;
    }

    // Validate URL format
    try {
      new URL(replaceVariables(url));
    } catch {
      toast.error("URL không hợp lệ. Vui lòng kiểm tra lại.");
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
        } else if (auth.type === "oauth2" && auth.token) {
          const tokenType = auth.tokenType || "Bearer";
          headersMap["Authorization"] = `${tokenType} ${auth.token}`;
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

      // Lưu requestId và collectionId để hiển thị comments/annotations
      if (savedRequest?.id) {
        setSavedRequestId(savedRequest.id.toString());
        setSavedCollectionId(collectionId);
      }

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

  // Convert headers array to object for GraphQL
  const headersObject = headers.reduce((acc, h) => {
    if (h.key) acc[h.key] = h.value;
    return acc;
  }, {} as Record<string, string>);

  // Handle GraphQL response
  const handleGraphQLResponse = (response: any) => {
    onResponse({
      status: response.errors ? 200 : 200, // GraphQL always returns 200
      statusText: response.errors ? "GraphQL Error" : "OK",
      headers: {},
      body: JSON.stringify(response, null, 2),
      responseTime: 0,
    });
    setRequestStatus(response.errors ? "error" : "success");
  };

  // Render WebSocket tester if WebSocket is selected
  if (requestType === "websocket") {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-800">
                <button
                  onClick={() => setRequestType("rest")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center ${
                    (requestType as string) === "rest"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  REST
                </button>
                <button
                  onClick={() => setRequestType("graphql")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    (requestType as string) === "graphql"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Code2 size={16} />
                  GraphQL
                </button>
                <button
                  onClick={() => setRequestType("websocket")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    (requestType as string) === "websocket"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Network size={16} />
                  WebSocket
                </button>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="WebSocket URL (ws:// or wss://)"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveModal(true)}
                >
                  Save
                </Button>
                {tabId && <RequestActions tabId={tabId} />}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <WebSocketTester
            url={url}
            headers={headersObject}
          />
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

  // Render GraphQL builder if GraphQL is selected
  if (requestType === "graphql") {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-800">
                <button
                  onClick={() => setRequestType("rest")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center ${
                    (requestType as string) === "rest"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  REST
                </button>
                <button
                  onClick={() => setRequestType("graphql")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    (requestType as string) === "graphql"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Code2 size={16} />
                  GraphQL
                </button>
                <button
                  onClick={() => setRequestType("websocket")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    (requestType as string) === "websocket"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Network size={16} />
                  WebSocket
                </button>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="GraphQL endpoint URL"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveModal(true)}
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
        <div className="flex-1 overflow-hidden">
          <GraphQLRequestBuilder
            url={url}
            headers={headersObject}
            onResponse={handleGraphQLResponse}
          />
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

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      {/* Header với close button */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between gap-3">
          {/* Request Type Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-800">
              <TabButton
                variant="filled"
                active={requestType === "rest"}
                onClick={() => setRequestType("rest")}
                showIndicator={false}
              >
                REST
              </TabButton>
              <TabButton
                variant="filled"
                active={requestType === "graphql"}
                onClick={() => setRequestType("graphql")}
                icon={Code2}
                showIndicator={false}
              >
                GraphQL
              </TabButton>
              <TabButton
                variant="filled"
                active={requestType === "websocket"}
                onClick={() => setRequestType("websocket")}
                icon={Network}
                showIndicator={false}
              >
                WebSocket
              </TabButton>
            </div>

            {/* Method Selector */}
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
              <option>HEAD</option>
              <option>OPTIONS</option>
            </select>

            {/* URL Input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL or paste from clipboard"
              className="flex-1 min-w-[300px] px-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <RequestStatus status={requestStatus} />
            <Tooltip content="Send request (Ctrl+Enter)">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={requestStatus === "sending"}
                loading={requestStatus === "sending"}
                className="flex items-center gap-1.5"
              >
                <Send size={14} />
                Send
              </Button>
            </Tooltip>
            <Tooltip content="Save request (Ctrl+S)">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSaveModal(true)}
                disabled={requestStatus === "sending"}
                className="flex items-center gap-1.5"
              >
                <Save size={14} />
                Save
              </Button>
            </Tooltip>
            {tabId && <RequestActions tabId={tabId} />}
            {tabId && (
              <Tooltip content="Close request (Ctrl+W)">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => closeTab(tabId)}
                  className="hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Close request"
                >
                  <X size={18} />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
        {/* Auth Section */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAuth(!showAuth)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              auth
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <Settings size={12} />
            {auth ? `Auth: ${auth.type}` : "No Auth"}
          </button>
          {tab && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {tab.name || "Untitled Request"}
            </span>
          )}
        </div>
        {showAuth && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
            <AuthConfig onAuthChange={setAuth} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {/* Query Parameters Section */}
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Query Parameters
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                ({queryParams.filter((p) => p.key && p.enabled).length} active)
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={addQueryParam}
              className="text-xs"
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
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  title={param.enabled ? "Disable parameter" : "Enable parameter"}
                />
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                  placeholder="Parameter name"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                  placeholder="Parameter value"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newParams = queryParams.filter((_, i) => i !== index);
                    setQueryParams(newParams.length > 0 ? newParams : [{ key: "", value: "", enabled: true }]);
                  }}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Headers Section */}
        <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Headers
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                ({headers.filter((h) => h.key).length} set)
              </span>
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={addHeader}
              className="text-xs"
            >
              + Add Header
            </Button>
          </div>
          <div className="space-y-2">
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                  placeholder="Header name (e.g., Content-Type)"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  placeholder="Header value"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHeaders = headers.filter((_, i) => i !== index);
                    setHeaders(newHeaders.length > 0 ? newHeaders : [{ key: "", value: "" }]);
                  }}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Body Section */}
        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Request Body</h3>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as any)}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
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
                placeholder="Request body (JSON, XML, etc.)"
                className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
            )}
            {(bodyType === "form-data" || bodyType === "x-www-form-urlencoded") && (
              <div className="space-y-2">
                {formData.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) => updateFormData(index, "key", e.target.value)}
                      placeholder="Field name"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => updateFormData(index, "value", e.target.value)}
                      placeholder="Field value"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newFormData = formData.filter((_, i) => i !== index);
                        setFormData(newFormData.length > 0 ? newFormData : [{ key: "", value: "" }]);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addFormDataField}
                  className="text-xs"
                >
                  + Add Field
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collaboration Tabs - Comments & Annotations */}
      {(savedRequestId || savedCollectionId) && (
        <ComponentErrorBoundary componentName="Collaboration Panel">
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <TabButton
                active={activeCollaborationTab === "comments"}
                onClick={() => setActiveCollaborationTab(activeCollaborationTab === "comments" ? null : "comments")}
                icon={MessageSquare}
              >
                Comments
              </TabButton>
              {savedRequestId && (
                <TabButton
                  active={activeCollaborationTab === "annotations"}
                  onClick={() => setActiveCollaborationTab(activeCollaborationTab === "annotations" ? null : "annotations")}
                  icon={StickyNote}
                >
                  Annotations
                </TabButton>
              )}
            </div>
            {activeCollaborationTab === "comments" && savedCollectionId && (
              <div className="p-4 max-h-64 overflow-y-auto">
                <ComponentErrorBoundary componentName="Comments Panel">
                  <CommentsPanel collectionId={savedCollectionId} />
                </ComponentErrorBoundary>
              </div>
            )}
            {activeCollaborationTab === "annotations" && savedRequestId && (
              <div className="p-4 max-h-64 overflow-y-auto">
                <ComponentErrorBoundary componentName="Annotations Panel">
                  <AnnotationEditor requestId={savedRequestId} />
                </ComponentErrorBoundary>
              </div>
            )}
          </div>
        </ComponentErrorBoundary>
      )}

      <SaveRequestModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveRequest}
        defaultName={tab?.name || "New Request"}
      />
    </div>
  );
}

