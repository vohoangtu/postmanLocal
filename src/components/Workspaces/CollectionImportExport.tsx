/**
 * Collection Import/Export Component
 * Import và export collections trong workspace
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { importCollectionsToWorkspace, exportWorkspaceCollections } from '../../services/importExportService';
import Button from '../UI/Button';
import { Upload, Download, FileJson, FileCode, Loader2 } from 'lucide-react';

export default function CollectionImportExport() {
  const { id: workspaceId } = useParams<{ id: string }>();
  const toast = useToast();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !workspaceId) return;

    setImporting(true);
    try {
      const { collections, errors } = await importCollectionsToWorkspace(workspaceId, file);

      if (collections.length > 0) {
        toast.success(`Successfully imported ${collections.length} collection(s)`);
      }

      if (errors.length > 0) {
        errors.forEach((error) => toast.error(error));
      }

      // Reset file input
      event.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to import collections');
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

      <div className="space-y-4">
        {/* Import Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-gray-300 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Upload size={18} />
            Import Collections
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Import collections from Postman collection (JSON) or OpenAPI specification files
          </p>
          <div className="flex items-center gap-2">
            <label>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importing}
                className="hidden"
              />
              <Button
                variant="primary"
                as="span"
                disabled={importing}
                className="flex items-center gap-2 cursor-pointer"
              >
                {importing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Choose File
                  </>
                )}
              </Button>
            </label>
          </div>
        </div>

        {/* Export Section */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border-2 border-gray-300 dark:border-gray-700">
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
