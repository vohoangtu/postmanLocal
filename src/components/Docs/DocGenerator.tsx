import { useState } from "react";
import { useSchemaStore } from "../../stores/schemaStore";

export default function DocGenerator() {
  const { selectedSchema, getSchema } = useSchemaStore();
  const [generatedDoc, setGeneratedDoc] = useState("");
  const [docFormat, setDocFormat] = useState<"html" | "markdown">("markdown");

  const generateDocumentation = () => {
    if (!selectedSchema) {
      alert("Please select a schema first");
      return;
    }

    const schema = getSchema(selectedSchema);
    if (!schema) return;

    const schemaData = schema.schemaData as any;

    if (docFormat === "markdown") {
      let markdown = `# ${schemaData?.info?.title || schema.name}\n\n`;
      markdown += `**Version:** ${schemaData?.info?.version || "1.0.0"}\n\n`;
      
      if (schemaData?.info?.description) {
        markdown += `${schemaData.info.description}\n\n`;
      }

      markdown += `## Endpoints\n\n`;

      if (schemaData?.paths) {
        for (const [path, methods] of Object.entries(schemaData.paths)) {
          if (methods && typeof methods === "object") {
            const methodsObj = methods as Record<string, any>;
            for (const [method, details] of Object.entries(methodsObj)) {
              markdown += `### ${method.toUpperCase()} ${path}\n\n`;
              
              if (details && typeof details === "object") {
                const detailsObj = details as Record<string, any>;
                
                if (detailsObj.summary) {
                  markdown += `**Summary:** ${detailsObj.summary}\n\n`;
                }
                
                if (detailsObj.parameters && Array.isArray(detailsObj.parameters)) {
                  markdown += `**Parameters:**\n\n`;
                  for (const param of detailsObj.parameters) {
                    if (param && typeof param === "object") {
                      const paramObj = param as Record<string, any>;
                      const name = paramObj.name || "";
                      const paramType = paramObj.schema?.type || "string";
                      markdown += `- \`${name}\` (${paramType})\n`;
                    }
                  }
                  markdown += "\n";
                }

                if (detailsObj.responses && typeof detailsObj.responses === "object") {
                  markdown += `**Responses:**\n\n`;
                  const responsesObj = detailsObj.responses as Record<string, any>;
                  for (const [status, response] of Object.entries(responsesObj)) {
                    const responseObj = response as Record<string, any>;
                    const description = responseObj.description || "";
                    markdown += `- **${status}**: ${description}\n`;
                  }
                  markdown += "\n";
                }
              }
            }
          }
        }
      }

      setGeneratedDoc(markdown);
    } else {
      // HTML format
      let html = `<!DOCTYPE html>
<html>
<head>
  <title>${schemaData?.info?.title || schema.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h3 { color: #888; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${schemaData?.info?.title || schema.name}</h1>
  <p><strong>Version:</strong> ${schemaData?.info?.version || "1.0.0"}</p>
  ${schemaData?.info?.description ? `<p>${schemaData.info.description}</p>` : ""}
  <h2>Endpoints</h2>
`;

      if (schemaData?.paths) {
        for (const [path, methods] of Object.entries(schemaData.paths)) {
          if (methods && typeof methods === "object") {
            const methodsObj = methods as Record<string, any>;
            for (const [method, details] of Object.entries(methodsObj)) {
              html += `<h3>${method.toUpperCase()} ${path}</h3>`;
              
              if (details && typeof details === "object") {
                const detailsObj = details as Record<string, any>;
                if (detailsObj.summary) {
                  html += `<p><strong>Summary:</strong> ${detailsObj.summary}</p>`;
                }
              }
            }
          }
        }
      }

      html += `</body></html>`;
      setGeneratedDoc(html);
    }
  };

  const exportDoc = () => {
    if (!generatedDoc) {
      alert("Please generate documentation first");
      return;
    }

    const blob = new Blob([generatedDoc], {
      type: docFormat === "html" ? "text/html" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-docs.${docFormat === "html" ? "html" : "md"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Documentation Generator
          </h3>
          <div className="flex gap-2">
            <select
              value={docFormat}
              onChange={(e) => setDocFormat(e.target.value as "html" | "markdown")}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
            <button
              onClick={generateDocumentation}
              disabled={!selectedSchema}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              Generate
            </button>
            {generatedDoc && (
              <button
                onClick={exportDoc}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {generatedDoc ? (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
            {docFormat === "html" ? (
              <iframe
                srcDoc={generatedDoc}
                className="w-full h-full min-h-[600px] border border-gray-300 dark:border-gray-600 rounded"
                title="Generated Documentation"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-white">
                {generatedDoc}
              </pre>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a schema and click Generate to create documentation
          </div>
        )}
      </div>
    </div>
  );
}
