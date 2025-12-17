import { useState, useMemo, memo, useCallback } from "react";
import { useRequestHistoryStore, RequestHistoryItem } from "../../stores/requestHistoryStore";
import { useTabStore } from "../../stores/tabStore";
import EmptyState from "../EmptyStates/EmptyState";
import Button from "../UI/Button";
import VirtualList from "../UI/VirtualList";
import { useDebounce } from "../../hooks/useDebounce";
import { History, Search } from "lucide-react";
import HistoryCard from "./HistoryCard";
import PageLayout from "../Layout/PageLayout";
import PageToolbar from "../Layout/PageToolbar";
import Input from "../UI/Input";

function RequestHistory() {
  const { history, clearHistory, removeFromHistory } = useRequestHistoryStore();
  const { addTab } = useTabStore();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredHistory = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return history;
    
    const query = debouncedSearchQuery.toLowerCase();
    return history.filter(
      (item) =>
        item.url.toLowerCase().includes(query) ||
        item.method.toLowerCase().includes(query)
    );
  }, [history, debouncedSearchQuery]);

  const handleOpenInNewTab = useCallback((item: RequestHistoryItem) => {
    addTab({
      name: `${item.method} ${new URL(item.url).pathname}`,
      method: item.method,
      url: item.url,
    });
  }, [addTab]);

  const handleRemove = useCallback((id: string) => {
    removeFromHistory(id);
  }, [removeFromHistory]);

  const renderToolbar = useCallback(() => {
    return (
      <PageToolbar
        leftSection={
          <>
            <History size={20} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Request History
            </h3>
            <div className="flex-1 max-w-md">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                fullWidth
              />
            </div>
          </>
        }
        rightSection={
          history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Clear All
            </Button>
          )
        }
      />
    );
  }, [searchQuery, history.length, clearHistory]);

  return (
    <PageLayout toolbar={renderToolbar()}>
      {filteredHistory.length === 0 ? (
        <EmptyState
          icon={searchQuery ? Search : History}
          title={searchQuery ? "No results found" : "No request history"}
          description={
            searchQuery
              ? "Try adjusting your search query"
              : "Your request history will appear here after you send requests"
          }
          suggestions={
            searchQuery
              ? []
              : [
                  "Send a request to see it in history",
                  "History helps you quickly access recent requests",
                  "Use search to find specific requests",
                ]
          }
        />
      ) : filteredHistory.length > 50 ? (
        // Sử dụng virtual scrolling cho lists lớn
        <VirtualList
          items={filteredHistory}
          itemHeight={120}
          containerHeight={window.innerHeight - 200}
          renderItem={(item, index) => (
            <div className="mb-2">
              <HistoryCard
                key={item.id}
                item={item}
                onOpen={handleOpenInNewTab}
                onRemove={handleRemove}
              />
            </div>
          )}
          overscan={5}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((item) => (
            <HistoryCard
              key={item.id}
              item={item}
              onOpen={handleOpenInNewTab}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </PageLayout>
  );
}

export default memo(RequestHistory);

