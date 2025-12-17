/**
 * Mock Server Config Component
 * Quick config cho mock server trong Request Builder
 */

import { useState, useEffect } from 'react';
import { Server, Play, Square, Settings, ChevronDown } from 'lucide-react';
import { webMockServerService } from '../../services/webMockServerService';
import { useToast } from '../../hooks/useToast';
import Button from '../UI/Button';
import Select from '../UI/Select';
import Tooltip from '../UI/Tooltip';

export interface MockServerConfigProps {
  onServerSelect?: (baseUrl: string) => void;
  selectedServerUrl?: string | null;
}

export default function MockServerConfig({ 
  onServerSelect,
  selectedServerUrl 
}: MockServerConfigProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState(3000);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    checkStatus();
    // Check status mỗi 2 giây khi đang chạy
    const interval = setInterval(() => {
      if (isRunning) {
        checkStatus();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const checkStatus = async () => {
    try {
      const status = await webMockServerService.getMockServerStatus();
      setIsRunning(status.running);
      if (status.port) {
        setPort(status.port);
        // Auto-select mock server nếu đang chạy
        if (status.running && !selectedServerUrl) {
          const mockUrl = `http://localhost:${status.port}`;
          onServerSelect?.(mockUrl);
        }
      }
    } catch (error) {
      // Silently handle errors
      setIsRunning(false);
    }
  };

  const handleToggle = async () => {
    if (isRunning) {
      await handleStop();
    } else {
      await handleStart();
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      // Sử dụng default routes nếu chưa có
      const defaultRoutes = [
        {
          path: '/api/*',
          method: 'GET',
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { message: 'Mock response' },
          delayMs: 0,
        },
      ];
      
      await webMockServerService.startMockServer(port, defaultRoutes);
      setIsRunning(true);
      const mockUrl = `http://localhost:${port}`;
      onServerSelect?.(mockUrl);
      toast.success(`Mock server đã khởi động trên port ${port}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể khởi động mock server';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await webMockServerService.stopMockServer();
      setIsRunning(false);
      if (selectedServerUrl?.includes('localhost')) {
        onServerSelect?.(null);
      }
      toast.success('Mock server đã dừng');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể dừng mock server';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectServer = () => {
    if (isRunning) {
      const mockUrl = `http://localhost:${port}`;
      onServerSelect?.(mockUrl);
      setShowDropdown(false);
    }
  };

  const handleOpenSettings = () => {
    // Navigate to settings - sẽ được implement sau
    setShowDropdown(false);
    toast.info('Mở Settings để cấu hình Mock Server');
  };

  const isUsingMockServer = selectedServerUrl?.includes('localhost') && isRunning;

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Tooltip content={isRunning ? 'Mock Server đang chạy' : 'Mock Server đã dừng'}>
          <Button
            variant={isRunning ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleToggle}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Square size={14} />
                Dừng
              </>
            ) : (
              <>
                <Play size={14} />
                Khởi động
              </>
            )}
          </Button>
        </Tooltip>

        {isRunning && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-1 ${
                isUsingMockServer ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <Server size={14} className={isUsingMockServer ? 'text-blue-600 dark:text-blue-400' : ''} />
              <span className="text-xs">
                {isUsingMockServer ? `localhost:${port}` : `Port ${port}`}
              </span>
              <ChevronDown size={12} />
            </Button>

            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[200px]">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 mb-2">
                    Mock Server
                  </div>
                  
                  <div className="space-y-1">
                    <button
                      onClick={handleSelectServer}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Server size={14} />
                      <span>Sử dụng localhost:{port}</span>
                    </button>
                    
                    <button
                      onClick={handleOpenSettings}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Settings size={14} />
                      <span>Cấu hình đầy đủ</span>
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400">
                      Status: <span className={isRunning ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        {isRunning ? 'Đang chạy' : 'Đã dừng'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isUsingMockServer && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
            <Server size={12} />
            <span>Mock</span>
          </div>
        )}
      </div>

      {/* Click outside để đóng dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
