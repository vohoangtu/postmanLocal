/**
 * Base Request Builder Component
 * Component cơ bản chứa tất cả logic chung cho việc build và gửi API requests
 * Được sử dụng bởi cả PublicRequestBuilder và WorkspaceRequestBuilder
 */

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import AuthConfig from "../Auth/AuthConfig";
import RequestActions from "./RequestActions";
import RequestStatus from "../Loading/RequestStatus";
import SaveRequestModal from "./SaveRequestModal";
import GraphQLRequestBuilder from "./GraphQLRequestBuilder";
import WebSocketTester from "../WebSocket/WebSocketTester";
import MockServerConfig from "./MockServerConfig";
import Button from "../UI/Button";
import Select from "../UI/Select";
import { useToast } from "../../hooks/useToast";
import { useEnvironmentStore } from "../../stores/environmentStore";
import { useRequestHistoryStore } from "../../stores/requestHistoryStore";
import { useTabStore } from "../../stores/tabStore";
import Tooltip from "../UI/Tooltip";
import { useCollectionStore } from "../../stores/collectionStore";
import { useAuth } from "../../contexts/AuthContext";
import { saveRequest } from "../../services/storageService";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { Code2, Network, X, Send, Save, Settings, History } from "lucide-react";
import RequestValidator from "./RequestValidator";
import { useFeatureGate } from "../../hooks/useFeatureGate";
import FeatureLockedMessage from "../FeatureGate/FeatureLockedMessage";
import SkeletonLoader from "../UI/SkeletonLoader";
import ErrorRetry from "../Error/ErrorRetry";
import TemplateSelector from "./TemplateSelector";

export interface BaseRequestBuilderProps {
  requestId: string | null;
  onResponse: (response: any) => void;
  tabId?: string;
  onSaveSuccess?: () => void;
  // Props để customize behavior
  enableCollaboration?: boolean; // Cho phép hiển thị collaboration features
  renderCollaborationPanel?: (savedRequestId: string | null, savedCollectionId: string | null) => React.ReactNode;
  // Callback để expose savedRequestId và savedCollectionId
  onRequestSaved?: (requestId: string, collectionId: string) => void;
  // External saved IDs (nếu được quản lý bên ngoài)
  externalSavedRequestId?: string | null;
  externalSavedCollectionId?: string | null;
}

export default function BaseRequestBuilder({ 
  onResponse, 
  tabId, 
  onSaveSuccess,
  enableCollaboration = false,
  renderCollaborationPanel,
  onRequestSaved,
  externalSavedRequestId,
  externalSavedCollectionId
}: BaseRequestBuilderProps) {
  const { addToHistory } = useRequestHistoryStore();
  const { getTab, updateTab, closeTab } = useTabStore();
  const { addRequestToCollection, triggerReload, defaultCollectionId } = useCollectionStore();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [requestStatus, setRequestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
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
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [requestType, setRequestType] = useState<"rest" | "graphql" | "websocket">("rest");
  // Sử dụng external IDs nếu có, nếu không thì dùng internal state
  const [internalSavedRequestId, setInternalSavedRequestId] = useState<string | null>(null);
  const [internalSavedCollectionId, setInternalSavedCollectionId] = useState<string | null>(null);
  const [mockServerBaseUrl, setMockServerBaseUrl] = useState<string | null>(null);
  
  const savedRequestId = externalSavedRequestId !== undefined ? externalSavedRequestId : internalSavedRequestId;
  const savedCollectionId = externalSavedCollectionId !== undefined ? externalSavedCollectionId : internalSavedCollectionId;
  const { replaceVariables, activeEnvironment, environments, workspaceEnvironments, workspaceId, setActiveEnvironment } = useEnvironmentStore();
  
  // Feature gates
  const graphqlGate = useFeatureGate("graphql");
  const websocketGate = useFeatureGate("websocket");

  const handleRequestTypeChange = (type: "rest" | "graphql" | "websocket") => {
    if (type === "graphql" && !graphqlGate.allowed) {
      toast.error("Bạn cần hoàn thành hướng dẫn để sử dụng GraphQL");
      return;
    }
    if (type === "websocket" && !websocketGate.allowed) {
      toast.error("Bạn cần hoàn thành hướng dẫn để sử dụng WebSocket");
      return;
    }
    setRequestType(type);
  };

  // Track previous tabId để detect khi tab thay đổi
  const prevTabIdRef = useRef<string | undefined>(tabId);
  
  // Load data từ tab khi tabId thay đổi
  useEffect(() => {
    // Chỉ load khi tabId thực sự thay đổi
    if (prevTabIdRef.current === tabId) {
      return;
    }
    prevTabIdRef.current = tabId;

    if (!tabId) {
      // Reset state nếu không có tabId
      setMethod("GET");
      setUrl("");
      setHeaders([{ key: "", value: "" }]);
      setBody("");
      setQueryParams([{ key: "", value: "", enabled: true }]);
      isInitialLoad.current = true;
      return;
    }

    // Hàm load data từ tab với retry logic
    const loadTabData = (retryCount = 0) => {
      const currentTab = getTab(tabId);
      if (!currentTab) {
        // Nếu đây là lần đầu (retryCount = 0), set default values ngay lập tức
        // để form hiển thị ngay, sau đó retry để load data từ tab
        if (retryCount === 0) {
          setIsLoadingTab(true);
          isInitialLoad.current = true;
          setMethod("GET");
          setUrl("");
          setHeaders([{ key: "", value: "" }]);
          setBody("");
          setQueryParams([{ key: "", value: "", enabled: true }]);
          setTimeout(() => {
            isInitialLoad.current = false;
            setIsLoadingTab(false);
          }, 0);
        }
        
        // Retry tối đa 5 lần nếu tab chưa có
        if (retryCount < 5) {
          setTimeout(() => loadTabData(retryCount + 1), 100);
        } else {
          setIsLoadingTab(false);
        }
        return;
      }

      setIsLoadingTab(true);

      // Set flag để skip update trong lần đầu
      isInitialLoad.current = true;

      // Deep copy để tránh reference sharing và đảm bảo data được load đúng
      setMethod(currentTab.method || "GET");
      setUrl(currentTab.url || "");
      
      // Deep copy headers
      const headersCopy = currentTab.requestData?.headers && Array.isArray(currentTab.requestData.headers)
        ? currentTab.requestData.headers.map((h: any) => ({ 
            key: String(h.key || ''), 
            value: String(h.value || '') 
          }))
        : [{ key: "", value: "" }];
      setHeaders(headersCopy);
      
      // Deep copy body
      setBody(currentTab.requestData?.body ? String(currentTab.requestData.body) : "");
      
      // Deep copy queryParams
      if (currentTab.requestData?.queryParams && Array.isArray(currentTab.requestData.queryParams)) {
        const queryParamsCopy = currentTab.requestData.queryParams.map((qp: any) => ({
          key: String(qp.key || ''),
          value: String(qp.value || ''),
          enabled: qp.enabled !== undefined ? Boolean(qp.enabled) : true,
        }));
        setQueryParams(queryParamsCopy);
      } else {
        setQueryParams([{ key: "", value: "", enabled: true }]);
      }

      // Reset các state khác khi chuyển tab
      setRequestStatus("idle");
      setShowSaveModal(false);
      if (externalSavedRequestId === undefined) {
        setInternalSavedRequestId(null);
      }
      if (externalSavedCollectionId === undefined) {
        setInternalSavedCollectionId(null);
      }

      // Reset flag sau một tick để cho phép update tiếp theo
      setTimeout(() => {
        isInitialLoad.current = false;
        setIsLoadingTab(false);
      }, 0);
    };

    loadTabData();
  }, [tabId, getTab]);

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

  // Update tab khi state thay đổi (nhưng không update khi đang load từ tab)
  const isInitialLoad = useRef(false);
  
  useEffect(() => {
    if (!tabId) return;
    
    // Skip update khi đang load từ tab
    if (isInitialLoad.current) {
      return;
    }

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
  }, [method, url, headers, body, queryParams, tabId, updateTab]);

  const buildUrl = () => {
    let finalUrl = replaceVariables(url);
    
    // Nếu đang dùng mock server, thay thế base URL
    if (mockServerBaseUrl && finalUrl) {
      try {
        const urlObj = new URL(finalUrl);
        const mockUrlObj = new URL(mockServerBaseUrl);
        // Giữ path và query từ URL gốc, chỉ thay base
        finalUrl = `${mockUrlObj.protocol}//${mockUrlObj.host}${urlObj.pathname}${urlObj.search}`;
      } catch {
        // Nếu URL không hợp lệ, giữ nguyên
      }
    }
    
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
      const params = new URLSearchParams();
      formData.forEach(item => {
        if (item.key) {
          params.append(replaceVariables(item.key), replaceVariables(item.value));
        }
      });
      return params.toString();
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
      const errorMsg = errorResponse.error || "Request failed";
      toast.error(errorMsg);
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
      // Đảm bảo collectionId luôn có giá trị - sử dụng default nếu không có
      const finalCollectionId = collectionId || defaultCollectionId;
      if (!finalCollectionId) {
        toast.error("Vui lòng chọn collection hoặc tạo collection mới");
        setIsSaving(false);
        return;
      }

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

      const savedRequest = await saveRequest(requestData, finalCollectionId, folderId || undefined);

      // Lưu requestId và collectionId để hiển thị comments/annotations
      if (savedRequest?.id) {
        const requestIdStr = savedRequest.id.toString();
        if (externalSavedRequestId === undefined) {
          setInternalSavedRequestId(requestIdStr);
        }
        if (externalSavedCollectionId === undefined) {
          setInternalSavedCollectionId(collectionId);
        }
        // Gọi callback để expose IDs
        if (onRequestSaved) {
          onRequestSaved(requestIdStr, collectionId);
        }
      }

      // Update collection store
      addRequestToCollection(finalCollectionId, {
        id: savedRequest.id,
        name: savedRequest.name,
        method: savedRequest.method,
        url: savedRequest.url,
        headers: savedRequest.headers,
        body: savedRequest.body,
        queryParams: savedRequest.queryParams,
        folderId: folderId || undefined,
      });

      // Nếu đã đăng nhập, trigger reload collections để sync với backend
      if (isAuthenticated) {
        triggerReload();
      }

      toast.success(`Request "${requestName}" đã được lưu vào collection${isAuthenticated ? ' và đồng bộ với server' : ''}`);
      
      // Gọi callback nếu có
      if (onSaveSuccess) {
        onSaveSuccess();
      }
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
    if (!websocketGate.allowed) {
      return (
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
          <FeatureLockedMessage feature="websocket" reason={websocketGate.reason} />
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-800">
                <button
                  onClick={() => handleRequestTypeChange("rest")}
                  className="h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  REST
                </button>
                <button
                  onClick={() => handleRequestTypeChange("graphql")}
                  className="h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={!graphqlGate.allowed}
                  title={!graphqlGate.allowed ? graphqlGate.reason : undefined}
                >
                  <Code2 size={16} />
                  GraphQL
                </button>
                <button
                  onClick={() => handleRequestTypeChange("websocket")}
                  className="h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 bg-blue-600 text-white"
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
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
    if (!graphqlGate.allowed) {
      return (
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
          <FeatureLockedMessage feature="graphql" reason={graphqlGate.reason} />
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-800">
                <button
                  onClick={() => handleRequestTypeChange("rest")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center ${
                    (requestType as string) === "rest"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  REST
                </button>
                <button
                  onClick={() => handleRequestTypeChange("graphql")}
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
                  onClick={() => handleRequestTypeChange("websocket")}
                  className={`h-9 px-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    (requestType as string) === "websocket"
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  disabled={!websocketGate.allowed}
                  title={!websocketGate.allowed ? websocketGate.reason : undefined}
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
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

  // Hiển thị skeleton loader khi đang load tab data
  if (isLoadingTab && tabId) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="p-3 border-b-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
          <SkeletonLoader type="request-builder" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
      {/* Header với close button */}
      <div className="p-3 border-b-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        <div className="flex items-center justify-between gap-3 mb-2">
          {/* Request Type Selector */}
          <div className="flex items-center gap-2">
            {/* Method Selector */}
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
              <option>HEAD</option>
              <option>OPTIONS</option>
            </select>

            {/* Environment Selector */}
            <Select
              value={activeEnvironment || ""}
              onChange={(e) => setActiveEnvironment(e.target.value || null)}
              options={[
                { value: "", label: "No Environment" },
                // Ưu tiên workspace environments nếu có
                ...(workspaceId && workspaceEnvironments.length > 0
                  ? workspaceEnvironments.map((env) => ({
                      value: env.id,
                      label: env.name,
                    }))
                  : environments.map((env) => ({
                      value: env.id,
                      label: env.name,
                    }))),
              ]}
              className="w-48"
            />

            {/* URL Input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter request URL or paste from clipboard"
              className="flex-1 min-w-[300px] px-4 py-1.5 text-sm border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
            />
            
            {/* Mock Server Config */}
            <MockServerConfig
              onServerSelect={(baseUrl) => {
                setMockServerBaseUrl(baseUrl);
                if (baseUrl && url) {
                  // Auto-update URL nếu chưa có base URL
                  try {
                    const currentUrl = new URL(url);
                    const mockUrl = new URL(baseUrl);
                    const newUrl = `${mockUrl.protocol}//${mockUrl.host}${currentUrl.pathname}${currentUrl.search}`;
                    setUrl(newUrl);
                  } catch {
                    // Nếu URL không hợp lệ, chỉ set base URL
                  }
                }
              }}
              selectedServerUrl={mockServerBaseUrl}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Template Selector - chỉ hiển thị khi chưa có URL hoặc request mới */}
            {(!url || url.trim() === '') && (
              <TemplateSelector
                onSelectTemplate={(template) => {
                  setMethod(template.method);
                  setUrl(template.url);
                  if (template.headers) {
                    setHeaders(template.headers);
                  }
                  if (template.body) {
                    setBody(template.body);
                    setBodyType('raw');
                  }
                  if (template.queryParams) {
                    setQueryParams(template.queryParams);
                  }
                }}
              />
            )}
            <Tooltip content="Request History">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                className={showHistorySidebar ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              >
                <History size={16} />
              </Button>
            </Tooltip>
            <RequestStatus status={requestStatus} />
            {requestStatus === "error" && (
              <ErrorRetry
                onRetry={handleSend}
                variant="inline"
                className="mr-2"
              />
            )}
            <Tooltip content="Send request (Ctrl+Enter)">
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={requestStatus === "sending"}
                loading={requestStatus === "sending"}
                className="flex items-center gap-1.5"
                data-onboarding="send-button"
              >
                <Send size={14} />
                Send
              </Button>
            </Tooltip>
            <Tooltip content="Save request (Ctrl+S)">
              <Button
                variant="secondary"
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
        <div className="flex items-center gap-2 pt-2 border-t-2 border-gray-300 dark:border-gray-700">
          <button
            onClick={() => setShowAuth(!showAuth)}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium ${
              auth
                ? "bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-500 dark:border-green-600 shadow-sm"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-400 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600"
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

      {/* Collaboration Panel - chỉ render nếu enableCollaboration = true */}
      {enableCollaboration && renderCollaborationPanel && renderCollaborationPanel(savedRequestId, savedCollectionId)}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/30 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {/* Query Parameters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
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

        {/* Request Validator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 shadow-sm">
          <RequestValidator
            method={method}
            url={buildUrl()}
            headers={headers}
            body={buildBody()}
            queryParams={queryParams}
          />
        </div>

        {/* Headers Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
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
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  placeholder="Header value"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Request Body</h3>
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
              <div className="w-full h-64 border border-gray-400 dark:border-gray-600 rounded-md overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={body}
                  onChange={(value) => setBody(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    tabSize: 2,
                    insertSpaces: true,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>
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
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => updateFormData(index, "value", e.target.value)}
                      placeholder="Field value"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-sm"
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

      <SaveRequestModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveRequest}
        defaultName={tab?.name || "New Request"}
      />
    </div>
  );
}
