/**
 * Status Badge Component
 * Hiển thị account status (active, locked)
 */

interface StatusBadgeProps {
  locked: boolean;
}

export default function StatusBadge({ locked }: StatusBadgeProps) {
  if (locked) {
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
        Locked
      </span>
    );
  }

  return (
    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
      Active
    </span>
  );
}
