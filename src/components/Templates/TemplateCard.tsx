/**
 * Template Card Component
 * Component card để hiển thị template với icon, badges, tags và actions
 */

import { memo } from 'react';
import { FileCode, Folder, Tag, Eye } from 'lucide-react';
import Button from '../UI/Button';
import { cn } from '../../utils/cn';
import { Template } from '../../stores/templateStore';

export interface TemplateCardProps {
  template: Template;
  onUse?: (templateId: string) => void;
  onPreview?: (templateId: string) => void;
  className?: string;
}

function TemplateCard({
  template,
  onUse,
  onPreview,
  className,
}: TemplateCardProps) {
  return (
    <div
      className={cn(
        'group relative',
        'bg-white dark:bg-gray-800',
        'border-2 rounded-lg',
        'p-4',
        'transition-all duration-200',
        'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600',
        'border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Icon và Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'flex-shrink-0',
          'w-10 h-10',
          'rounded-lg',
          'flex items-center justify-center',
          'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
          'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60',
          'transition-colors'
        )}>
          <FileCode size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'text-base font-semibold',
            'text-gray-900 dark:text-white',
            'truncate',
            'mb-1'
          )}>
            {template.name || 'Unnamed Template'}
          </h3>

          {/* Category Badge */}
          {template.template_category && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                <Folder size={12} />
                {template.template_category}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className={cn(
          'text-sm text-gray-600 dark:text-gray-400',
          'line-clamp-2',
          'mb-3'
        )}>
          {template.description}
        </p>
      )}

      {/* Tags */}
      {template.template_tags && template.template_tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <Tag size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          {template.template_tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-xs text-gray-500 dark:text-gray-400 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
            >
              {tag}
            </span>
          ))}
          {template.template_tags.length > 3 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{template.template_tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer với actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 gap-2">
        {template.user && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
            by {template.user.name}
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {onPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(template.id);
              }}
              className="flex items-center gap-1"
            >
              <Eye size={14} />
              Preview
            </Button>
          )}
          {onUse && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUse(template.id);
              }}
            >
              Use
            </Button>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <div className={cn(
        'absolute inset-0 rounded-lg',
        'pointer-events-none',
        'transition-opacity duration-200',
        'opacity-0 group-hover:opacity-100',
        'bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10'
      )} />
    </div>
  );
}

export default memo(TemplateCard);
