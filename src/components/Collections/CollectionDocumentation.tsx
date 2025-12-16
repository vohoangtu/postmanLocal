/**
 * Collection Documentation Component
 * Hiển thị documentation cho collection
 */

import { useState, useEffect } from 'react';
import { useCollectionStore } from '../../stores/collectionStore';
import { previewCollectionDocumentation, downloadCollectionDocumentation } from '../../services/apiDocumentationService';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Select from '../UI/Select';
import { FileText, Download, Eye, Loader2, RefreshCw } from 'lucide-react';
import Modal from '../UI/Modal';

interface CollectionDocumentationProps {
  collectionId: string;
}

export default function CollectionDocumentation({ collectionId }: CollectionDocumentationProps) {
  const { collections } = useCollectionStore();
  const toast = useToast();
  const [format, setFormat] = useState<'markdown' | 'html' | 'openapi'>('markdown');
  const [documentation, setDocumentation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const collection = collections.find((c) => c.id === collectionId);

  useEffect(() => {
    if (collectionId) {
      loadDocumentation();
    }
  }, [collectionId, format]);

  const loadDocumentation = async () => {
    setLoading(true);
    try {
      const preview = await previewCollectionDocumentation(collectionId, format);
      setDocumentation(preview.content);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load documentation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCollectionDocumentation(collectionId, format);
      toast.success('Documentation downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download documentation');
    } finally {
      setDownloading(false);
    }
  };

  if (!collection) {
    return (
      <div className="p-4 text-center text-gray-500">
        Collection not found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText size={18} />
          API Documentation
        </h3>
        <div className="flex gap-2">
          <Select
            value={format}
            onChange={(e) => setFormat(e.target.value as 'markdown' | 'html' | 'openapi')}
            options={[
              { value: 'markdown', label: 'Markdown' },
              { value: 'html', label: 'HTML' },
              { value: 'openapi', label: 'OpenAPI' },
            ]}
            className="w-32"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={loadDocumentation}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1"
          >
            <Eye size={14} />
            Preview
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1"
          >
            {downloading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={14} />
                Download
              </>
            )}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading documentation...</div>
      ) : documentation ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-gray-300 dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Format: {format.toUpperCase()} | Auto-updates when collection changes
          </div>
          {format === 'markdown' ? (
            <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
              {documentation}
            </pre>
          ) : format === 'html' ? (
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: documentation }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm font-mono overflow-x-auto">
              {JSON.stringify(JSON.parse(documentation), null, 2)}
            </pre>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No documentation available. Add requests to the collection to generate documentation.
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Documentation Preview - ${collection.name}`}
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {format === 'markdown' ? (
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded border-2 border-gray-300 dark:border-gray-700">
              {documentation || 'Loading preview...'}
            </pre>
          ) : format === 'html' ? (
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: documentation || '' }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded border-2 border-gray-300 dark:border-gray-700">
              {documentation ? JSON.stringify(JSON.parse(documentation), null, 2) : 'Loading preview...'}
            </pre>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
