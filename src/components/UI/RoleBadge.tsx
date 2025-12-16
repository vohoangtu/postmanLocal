/**
 * Role Badge Component
 * Hiển thị user role với màu sắc phù hợp
 */

interface RoleBadgeProps {
  role: 'user' | 'admin' | 'super_admin';
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig = {
    user: {
      label: 'User',
      className: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    },
    admin: {
      label: 'Admin',
      className: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    },
    super_admin: {
      label: 'Super Admin',
      className: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    },
  };

  const config = roleConfig[role] || roleConfig.user;

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
