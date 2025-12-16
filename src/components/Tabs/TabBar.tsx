import { useTabStore } from "../../stores/tabStore";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Tooltip from "../UI/Tooltip";
import { useState, useRef, useEffect } from "react";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, closeAllTabs } = useTabStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Kiểm tra khả năng scroll
  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Auto-scroll to active tab khi tab được activate
  useEffect(() => {
    if (!scrollContainerRef.current || !activeTabId) return;

    const activeTabElement = scrollContainerRef.current.querySelector(
      `[data-tab-id="${activeTabId}"]`
    ) as HTMLElement;

    if (activeTabElement) {
      activeTabElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeTabId]);

  // Check scrollability khi tabs thay đổi hoặc window resize
  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollability);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScrollability);
      }
    };
  }, [tabs]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: "smooth",
      });
    }
  };

  if (tabs.length === 0) return null;

  return (
    <div className="relative flex items-center bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 shadow-md">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 z-10 h-full px-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center shadow-sm"
          aria-label="Scroll left"
        >
          <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-center flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          paddingLeft: canScrollLeft ? "32px" : "0",
          paddingRight: canScrollRight ? "32px" : "0",
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            className={`group flex items-center gap-2 px-3 py-2 border-r border-gray-300 dark:border-gray-700 cursor-pointer min-w-[180px] max-w-[250px] transition-all flex-shrink-0 ${
              activeTabId === tab.id
                ? "bg-white dark:bg-gray-900 border-b-2 border-blue-600 shadow-md font-medium"
                : "bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              tab.method === "GET"
                ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                : tab.method === "POST"
                ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30"
                : tab.method === "PUT"
                ? "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30"
                : tab.method === "DELETE"
                ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
                : tab.method === "PATCH"
                ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30"
                : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
            }`}
          >
            {tab.method}
          </span>
          <span className="flex-1 text-xs text-gray-800 dark:text-gray-200 truncate">
            {tab.name}
          </span>
          {tab.isDirty && (
            <Tooltip content="Unsaved changes">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
            </Tooltip>
          )}
          <Tooltip content="Close tab (Ctrl+W)">
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded p-0.5 transition-opacity flex-shrink-0"
            >
              <X size={14} className="text-gray-600 dark:text-gray-400" />
            </button>
          </Tooltip>
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 z-10 h-full px-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center shadow-sm"
          aria-label="Scroll right"
        >
          <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Close All Button */}
      {tabs.length > 1 && (
        <div className="flex items-center border-l border-gray-200 dark:border-gray-700 px-2">
          <Tooltip content="Đóng tất cả tabs (giữ lại tab đang active)">
            <button
              onClick={closeAllTabs}
              className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-1 font-medium"
              aria-label="Close all tabs"
            >
              <X size={14} />
              <span className="hidden sm:inline">Close All</span>
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

