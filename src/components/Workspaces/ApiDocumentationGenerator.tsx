/**
 * API Documentation Generator
 * Generate và export API documentation cho workspace
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useToast } from '../../hooks/useToast';
import { downloadWorkspaceDocumentation, previewCollectionDocumentation } from '../../services/apiDocumentationService';
import Button from '../UI/Button';
import Select from '../UI/Select';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import Modal from '../UI/Modal';

export default function ApiDocumentationGenerator() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceStore();
  const toast = useToast();
  const [format, setFormat] = useState<'markdown' | 'html' | 'openapi'>('markdown');
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    if (!workspaceId) return;

    setDownloading(true);
    try {
      await downloadWorkspaceDocumentation(workspaceId, format);
      toast.success('Documentation downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download documentation');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!workspaceId) return;

    setPreviewing(true);
    try {
      // For workspace, we'll generate a sample preview
      // In a real implementation, you might want to preview the first collection
      const content = `# ${currentWorkspace?.name || 'Workspace'} API Documentation\n\n`;
      setPreviewContent(content + 'Preview functionality - full documentation will be generated on download.');
      setShowPreview(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to preview documentation');
    } finally {
      setPreviewing(false);
    }
  };

  if (!currentWorkspace || !currentWorkspace.is_team) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          This workspace is not a team workspace.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          API Documentation Generator
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate comprehensive API documentation for all collections in this workspace
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-300 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText size={18} />
            Export Format
          </h3>
          <div className="space-y-3">
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'markdown' | 'html' | 'openapi')}
              options={[
                { value: 'markdown', label: 'Markdown (.md)' },
                { value: 'html', label: 'HTML (.html)' },
                { value: 'openapi', label: 'OpenAPI 3.0 (.json)' },
              ]}
              fullWidth
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handlePreview}
                disabled={previewing}
                className="flex items-center gap-2"
              >
                {previewing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Previewing...
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    Preview
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Documentation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-300 dark:border-blue-700">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Documentation Includes:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>All API requests from collections in this workspace</li>
            <li>Request methods, URLs, and parameters</li>
            <li>Headers and request bodies</li>
            <li>Query parameters with descriptions</li>
            <li>Formatted and ready to share with your team</li>
          </ul>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewContent(null);
        }}
        title="Documentation Preview"
        size="lg"
      >
        <div className="max-h-96 overflow-y-auto">
          {format === 'markdown' ? (
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-700">
              {previewContent || 'Loading preview...'}
            </pre>
          ) : format === 'html' ? (
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewContent || '' }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-700">
              {previewContent ? JSON.stringify(JSON.parse(previewContent), null, 2) : 'Loading preview...'}
            </pre>
          )}
        </div>
      </Modal>
    </div>
  );
}
