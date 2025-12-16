import { Users, Lock } from "lucide-react";

interface CollectionPermissionBadgeProps {
  isShared: boolean;
  permission?: "read" | "write" | "admin";
  className?: string;
}

export default function CollectionPermissionBadge({
  isShared,
  permission,
  className = "",
}: CollectionPermissionBadgeProps) {
  if (!isShared) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 ${className}`}
        title="Private collection"
      >
        <Lock size={12} />
        Private
      </span>
    );
  }

  const getPermissionColor = () => {
    switch (permission) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "write":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "read":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getPermissionColor()} ${className}`}
      title={`Shared - ${permission || "read"} permission`}
    >
      <Users size={12} />
      Shared {permission && `(${permission})`}
    </span>
  );
}




