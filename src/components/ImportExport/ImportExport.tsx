import { useState } from "react";
import { useCollectionStore } from "../../stores/collectionStore";
import Button from "../UI/Button";

export default function ImportExport() {
  const { collections } = useCollectionStore();
  const [importType, setImportType] = useState<"postman" | "openapi" | "curl">("postman");

  const handleExport = (format: "postman" | "openapi") => {
    if (format === "postman") {
      const postmanCollection = {
        info: {
          name: "PostmanLocal Export",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: collections.map((collection) => ({
          name: collection.name,
          item: collection.requests.map((req) => ({
            name: req.name,
            request: {
              method: req.method,
              header: [],
              url: {
                raw: req.url,
                host: [new URL(req.url).hostname],
                path: [new URL(req.url).pathname],
              },
            },
          })),
        })),
      };

      const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `postmanlocal-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (importType === "postman" && data.item) {
          // Import Postman collection
          const importedCollections = data.item.map((item: any) => ({
            id: Date.now().toString() + Math.random(),
            name: item.name,
            description: "",
            requests: item.item?.map((req: any) => ({
              id: Date.now().toString() + Math.random(),
              name: req.name,
              method: req.request?.method || "GET",
              url: req.request?.url?.raw || "",
            })) || [],
          }));

          // Add to collections store
          // This would need to be implemented in the store
          alert(`Imported ${importedCollections.length} collections`);
        }
      } catch (error) {
        alert("Failed to import file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Export</h3>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport("postman")}
          >
            Export as Postman
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleExport("openapi")}
            className="bg-green-600 hover:bg-green-700"
          >
            Export as OpenAPI
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Import</h3>
        <select
          value={importType}
          onChange={(e) => setImportType(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="postman">Postman Collection</option>
          <option value="openapi">OpenAPI/Swagger</option>
          <option value="curl">cURL Commands</option>
        </select>
        <input
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleImport}
          className="w-full text-sm text-gray-700 dark:text-gray-300"
        />
      </div>
    </div>
  );
}

