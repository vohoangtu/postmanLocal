import { LucideIcon } from "lucide-react";
import Button from "../UI/Button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: string[];
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  suggestions,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in ${className}`}>
      {Icon && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-full animate-scale-in">
          <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">{description}</p>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          className="mb-6"
        >
          {action.label}
        </Button>
      )}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 w-full max-w-md">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
            Quick suggestions:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2 text-left">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

