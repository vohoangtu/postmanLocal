/**
 * Collection Import/Export Component
 * Import và export collections trong workspace
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { useCollectionStore } from '../../stores/collectionStore';
import { importCollectionsToWorkspace, exportWorkspaceCollections } from '../../services/importExportService';
import Button from '../UI/Button';
import ErrorMessage from '../Error/ErrorMessage';
import { Upload, Download, FileJson, FileCode, Loader2 } from 'lucide-react';

interface CollectionImportExportProps {
  onImportSuccess?: () => void;
}

export default function CollectionImportExport({ onImportSuccess }: CollectionImportExportProps = {}) {
  const { id: workspaceId } = useParams<{ id: string }>();
  const toast = useToast();
  const { triggerReload } = useCollectionStore();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file?.name, 'Workspace ID:', workspaceId);
    
    if (!file) {
      setError('Vui lòng chọn file');
      return;
    }
    
    if (!workspaceId) {
      setError('Workspace ID không hợp lệ');
      return;
    }

    setImporting(true);
    setError(null);
    try {
      console.log('Starting import...');
      const { collections, errors } = await importCollectionsToWorkspace(workspaceId, file);
      console.log('Import result:', { collections: collections.length, errors: errors.length });

      if (collections.length > 0) {
        toast.success(`Đã import thành công ${collections.length} collection(s)`);
        // Trigger reload collections trong store
        triggerReload();
        // Callback để parent component refresh
        if (onImportSuccess) {
          onImportSuccess();
        }
      }

      if (errors.length > 0) {
        const errorMessage = errors.join('; ');
        setError(errorMessage);
        errors.forEach((error) => toast.error(error));
      }

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error.message || 'Không thể import collections';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'postman' | 'openapi' | 'json') => {
    if (!workspaceId) return;

    setExporting(true);
    try {
      await exportWorkspaceCollections(workspaceId, format);
      toast.success('Collections exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export collections');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Import/Export Collections
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Import collections from Postman or OpenAPI files, or export all workspace collections
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error} 
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      <div className="space-y-4">
        {/* Import Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-300 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Upload size={18} />
            Import Collections
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Import collections from Postman collection (JSON) or OpenAPI specification files
          </p>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
              id="collection-import-input"
            />
            <Button
              variant="primary"
              type="button"
              disabled={importing}
              className="flex items-center gap-2 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const input = document.getElementById('collection-import-input') as HTMLInputElement;
                if (input && !importing) {
                  input.click();
                }
              }}
            >
              {importing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang import...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Chọn File
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Export Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-300 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Download size={18} />
            Export Collections
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Export all collections from this workspace in different formats
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileJson size={16} />
                  Export as JSON
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('postman')}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileCode size={16} />
                  Export as Postman
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleExport('openapi')}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileCode size={16} />
                  Export as OpenAPI
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
