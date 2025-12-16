import { useState } from "react";
import { useCollectionStore } from "../../stores/collectionStore";
import { useAuth } from "../../contexts/AuthContext";
import { authService } from "../../services/authService";
import Button from "../UI/Button";
import { useToast } from "../../hooks/useToast";
import {
  importPostmanCollection,
  exportToPostmanCollection,
  exportToOpenAPI,
  importOpenAPICollection,
  downloadFile,
} from "../../services/importExportService";
import { handleError } from "../../services/errorLogger";

interface ImportExportProps {
  onImportSuccess?: () => void; // Callback để reload collections sau khi import thành công
}

export default function ImportExport({ onImportSuccess }: ImportExportProps = {}) {
  const { collections, addCollection, triggerReload } = useCollectionStore();
  const { isAuthenticated } = useAuth();
  const [importType, setImportType] = useState<"postman" | "openapi">("postman");
  const toast = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const handleExport = (format: "postman" | "openapi", collectionId?: string) => {
    try {
      const collection = collectionId
        ? collections.find((c) => c.id === collectionId)
        : collections[0];

      if (!collection) {
        toast.error("Không tìm thấy collection để export");
        return;
      }

      if (format === "postman") {
        const postmanCollection = exportToPostmanCollection(collection);
        downloadFile(
          JSON.stringify(postmanCollection, null, 2),
          `${collection.name}-postman.json`,
          "application/json"
        );
        toast.success(`Đã export collection "${collection.name}" sang Postman format`);
      } else if (format === "openapi") {
        const openApi = exportToOpenAPI(collection);
        downloadFile(
          JSON.stringify(openApi, null, 2),
          `${collection.name}-openapi.json`,
          "application/json"
        );
        toast.success(`Đã export collection "${collection.name}" sang OpenAPI format`);
      }
    } catch (error) {
      const errorMessage = handleError(error, "Export Collection");
      toast.error(errorMessage);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let data: any;

        // Parse JSON hoặc YAML
        if (file.name.endsWith(".json")) {
          data = JSON.parse(content);
        } else if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
          // YAML parsing - cần thư viện yaml parser
          toast.error("YAML import chưa được hỗ trợ. Vui lòng sử dụng file JSON.");
          return;
        } else {
          toast.error("Định dạng file không được hỗ trợ. Vui lòng sử dụng file JSON.");
          return;
        }

        if (importType === "postman") {
          // Kiểm tra xem có phải Postman collection không
          if (!data.item && !data.info) {
            toast.error("File không phải là Postman Collection hợp lệ");
            return;
          }

          const { collection, requests, variables } = importPostmanCollection(data);
          
          // Kiểm tra và thông báo về environment variables nếu có
          if (variables && variables.length > 0) {
            const variableNames = variables.map(v => v.key).join(', ');
            toast.success(
              `Đã import collection với ${requests.length} requests. ` +
              `Collection có ${variables.length} environment variables: ${variableNames}. ` +
              `Vui lòng tạo environment và thêm các variables này để sử dụng.`,
              { duration: 6000 }
            );
          }
          
          // Nếu đã đăng nhập, lưu vào backend API
          if (isAuthenticated) {
            try {
              const token = await authService.getAccessToken();
              console.log('Import: isAuthenticated =', isAuthenticated, ', token =', token ? 'exists' : 'null');
              if (token) {
                const response = await fetch(`${API_BASE_URL}/collections`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: collection.name,
                    description: collection.description || null,
                    data: {
                      requests: requests,
                    },
                  }),
                });
                console.log('Import response:', response.status, response.statusText);

                if (response.ok) {
                  const createdCollection = await response.json();
                  
                  // Parse requests từ createdCollection.data nếu có
                  let parsedRequests = requests; // Mặc định dùng requests từ import
                  if (createdCollection.data) {
                    if (typeof createdCollection.data === 'string') {
                      try {
                        const parsed = JSON.parse(createdCollection.data);
                        parsedRequests = parsed?.requests || requests;
                      } catch (e) {
                        console.error('Error parsing created collection data:', e);
                      }
                    } else if (createdCollection.data.requests && Array.isArray(createdCollection.data.requests)) {
                      parsedRequests = createdCollection.data.requests;
                    }
                  }
                  
                  const savedCollection = {
                    id: createdCollection.id?.toString() || createdCollection.id,
                    name: createdCollection.name,
                    description: createdCollection.description || "",
                    requests: parsedRequests,
                    is_shared: createdCollection.is_shared || false,
                    permission: createdCollection.permission,
                    workspace_id: createdCollection.workspace_id?.toString(),
                    is_default: createdCollection.is_default || false,
                  };
                  addCollection(savedCollection);
                  
                  // Đợi một chút để đảm bảo backend đã lưu xong, sau đó reload
                  setTimeout(() => {
                    triggerReload();
                  }, 500);
                  
                  onImportSuccess?.();
                  
                  toast.success(`Đã import và lưu collection "${collection.name}" với ${parsedRequests.length} requests vào server`);
                  return;
                } else if (response.status === 401) {
                  toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                  // Fallback to local storage
                } else {
                  // Lấy error message chi tiết
                  let errorMessage = "Failed to save imported collection to server";
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                  } catch (e) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                  }
                  console.error("Import error:", {
                    status: response.status,
                    statusText: response.statusText,
                    message: errorMessage,
                  });
                  toast.error(errorMessage);
                  // Không return, sẽ fallback về localStorage
                }
              }
            } catch (error: any) {
              console.error("Error saving imported collection:", error);
              const errorMessage = error?.message || "Network error or server unavailable";
              toast.error(`Không thể lưu vào server: ${errorMessage}. Collection sẽ được lưu tạm thời.`);
              // Không return, sẽ fallback về localStorage
            }
          }

          // Fallback: lưu local
          addCollection(collection);
          
          // Lưu vào localStorage
          const collectionsJson = localStorage.getItem('postmanlocal_collections');
          const existingCollections = collectionsJson ? JSON.parse(collectionsJson) : [];
          existingCollections.push(collection);
          localStorage.setItem('postmanlocal_collections', JSON.stringify(existingCollections));
          
          toast.success(`Đã import collection "${collection.name}" với ${requests.length} requests`);
        } else if (importType === "openapi") {
          // Kiểm tra xem có phải OpenAPI không
          if (!data.paths && !data.openapi) {
            toast.error("File không phải là OpenAPI/Swagger hợp lệ");
            return;
          }

          const { collection, requests } = importOpenAPICollection(data);
          
          // Nếu đã đăng nhập, lưu vào backend API
          if (isAuthenticated) {
            try {
              const token = await authService.getAccessToken();
              if (!token) {
                toast.error("Token không tồn tại. Vui lòng đăng nhập lại.");
                // Fallback to local storage
              } else {
                const response = await fetch(`${API_BASE_URL}/collections`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: collection.name,
                    description: collection.description || null,
                    data: {
                      requests: requests,
                    },
                  }),
                });

                if (response.ok) {
                  const createdCollection = await response.json();
                  
                  // Parse requests từ createdCollection.data nếu có
                  let parsedRequests = requests; // Mặc định dùng requests từ import
                  if (createdCollection.data) {
                    if (typeof createdCollection.data === 'string') {
                      try {
                        const parsed = JSON.parse(createdCollection.data);
                        parsedRequests = parsed?.requests || requests;
                      } catch (e) {
                        console.error('Error parsing created collection data:', e);
                      }
                    } else if (createdCollection.data.requests && Array.isArray(createdCollection.data.requests)) {
                      parsedRequests = createdCollection.data.requests;
                    }
                  }
                  
                  const savedCollection = {
                    id: createdCollection.id?.toString() || createdCollection.id,
                    name: createdCollection.name,
                    description: createdCollection.description || "",
                    requests: parsedRequests,
                    is_shared: createdCollection.is_shared || false,
                    permission: createdCollection.permission,
                    workspace_id: createdCollection.workspace_id?.toString(),
                    is_default: createdCollection.is_default || false,
                  };
                  addCollection(savedCollection);
                  
                  // Đợi một chút để đảm bảo backend đã lưu xong, sau đó reload
                  setTimeout(() => {
                    triggerReload();
                  }, 500);
                  
                  onImportSuccess?.();
                  
                  toast.success(`Đã import và lưu collection "${collection.name}" với ${parsedRequests.length} requests vào server`);
                  return;
                } else if (response.status === 401) {
                  toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                  // Fallback to local storage
                } else {
                  // Lấy error message chi tiết
                  let errorMessage = "Failed to save imported collection to server";
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                  } catch (e) {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                  }
                  console.error("Import error:", {
                    status: response.status,
                    statusText: response.statusText,
                    message: errorMessage,
                  });
                  toast.error(errorMessage);
                  // Không return, sẽ fallback về localStorage
                }
              }
            } catch (error: any) {
              console.error("Error saving imported collection:", error);
              const errorMessage = error?.message || "Network error or server unavailable";
              toast.error(`Không thể lưu vào server: ${errorMessage}. Collection sẽ được lưu tạm thời.`);
              // Không return, sẽ fallback về localStorage
            }
          }

          // Fallback: lưu local
          addCollection(collection);
          
          // Lưu vào localStorage
          const collectionsJson = localStorage.getItem('postmanlocal_collections');
          const existingCollections = collectionsJson ? JSON.parse(collectionsJson) : [];
          existingCollections.push(collection);
          localStorage.setItem('postmanlocal_collections', JSON.stringify(existingCollections));
          
          toast.success(`Đã import collection "${collection.name}" với ${requests.length} requests`);
        }

        // Reset file input
        event.target.value = "";
      } catch (error) {
        const errorMessage = handleError(error, "Import Collection");
        toast.error(errorMessage);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Export Collection
        </h3>
        {collections.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có collection nào để export
          </p>
        ) : (
          <div className="space-y-3">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {collection.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {collection.requests.length} requests
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport("postman", collection.id)}
                  >
                    Export Postman
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExport("openapi", collection.id)}
                  >
                    Export OpenAPI
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Import Collection</h3>
        <div className="space-y-3">
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="postman">Postman Collection (JSON)</option>
            <option value="openapi">OpenAPI/Swagger (JSON)</option>
          </select>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Chọn file để import
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hỗ trợ import từ Postman Collection v2.1 và OpenAPI 3.0
          </p>
        </div>
      </div>
    </div>
  );
}

