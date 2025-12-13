import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Folder, History, Settings, X } from "lucide-react";

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  handler: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewRequest: () => void;
  onOpenSettings?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNewRequest,
  onOpenSettings,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = useMemo(
    () => [
      {
        id: "new-request",
        label: "New Request",
        icon: <FileText className="w-4 h-4" />,
        category: "Actions",
        handler: () => {
          onNewRequest();
          onClose();
        },
        keywords: ["new", "create", "request"],
      },
      {
        id: "new-collection",
        label: "New Collection",
        icon: <Folder className="w-4 h-4" />,
        category: "Actions",
        handler: () => {
          onClose();
        },
        keywords: ["collection", "folder"],
      },
      {
        id: "history",
        label: "Open History",
        icon: <History className="w-4 h-4" />,
        category: "Navigation",
        handler: () => {
          onClose();
        },
        keywords: ["history", "recent"],
      },
      {
        id: "settings",
        label: "Open Settings",
        icon: <Settings className="w-4 h-4" />,
        category: "Navigation",
        handler: () => {
          onOpenSettings?.();
          onClose();
        },
        keywords: ["settings", "preferences", "config"],
      },
    ],
    [onNewRequest, onOpenSettings, onClose]
  );

  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;

    const query = searchQuery.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.keywords?.some((keyword) => keyword.includes(query))
    );
  }, [commands, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].handler();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-[20vh]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4"
        >
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No commands found
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={command.handler}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left ${
                      index === selectedIndex
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {command.icon}
                    <div className="flex-1">
                      <div className="font-medium">{command.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {command.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

