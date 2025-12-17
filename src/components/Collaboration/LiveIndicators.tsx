import { useState, useEffect } from "react";
import { usePresenceChannel } from "../../hooks/useWebSocket";
import { Users, Circle } from "lucide-react";

interface LiveIndicatorsProps {
  workspaceId: string;
  collectionId?: string;
}

interface OnlineUser {
  id: string;
  name?: string;
  email?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
}

export default function LiveIndicators({ workspaceId, collectionId }: LiveIndicatorsProps) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [editingUsers, setEditingUsers] = useState<Map<string, OnlineUser>>(new Map());

  const { connected } = usePresenceChannel(
    `workspace.${workspaceId}`,
    {
      here: (users) => {
        setOnlineUsers(users);
      },
      joining: (user) => {
        setOnlineUsers((prev) => [...prev, user]);
      },
      leaving: (user) => {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
        setEditingUsers((prev) => {
          const next = new Map(prev);
          next.delete(user.id);
          return next;
        });
      },
    },
    !!workspaceId
  );

  // Listen for user activity events
  useEffect(() => {
    if (!connected || !workspaceId) return;

    const unsubscribe = websocketService.subscribe(
      `workspace.${workspaceId}`,
      "user.activity",
      (data: any) => {
        if (data.action === "editing" && data.entity_id === collectionId) {
          setEditingUsers((prev) => {
            const next = new Map(prev);
            next.set(data.user_id, {
              id: data.user_id,
              action: data.action,
              entityType: data.entity_type,
              entityId: data.entity_id,
            });
            return next;
          });
        } else {
          setEditingUsers((prev) => {
            const next = new Map(prev);
            next.delete(data.user_id);
            return next;
          });
        }
      }
    );

    return unsubscribe;
  }, [connected, workspaceId, collectionId]);

  if (!connected || onlineUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <Users size={14} className="text-gray-600 dark:text-gray-400" />
      <div className="flex items-center gap-1">
        {onlineUsers.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className="relative"
            title={user.name || user.email || "User"}
          >
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {editingUsers.has(user.id) && (
              <Circle
                size={8}
                className="absolute -bottom-0 -right-0 text-green-500 fill-green-500"
              />
            )}
          </div>
        ))}
        {onlineUsers.length > 3 && (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            +{onlineUsers.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

// Import websocketService
import { websocketService } from "../../services/websocketService";





