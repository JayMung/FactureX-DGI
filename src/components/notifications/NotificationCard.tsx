/**
 * NotificationCard — Single notification display item
 * Phase 7
 */
import { formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { Notification } from '@/types/notifications';
import {
  NOTIFICATION_CATEGORY_ICONS,
  NOTIFICATION_PRIORITY_LABELS,
} from '@/types/notifications';

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

export function NotificationCard({
  notification,
  onMarkRead,
  onDismiss,
}: NotificationCardProps) {
  const isUnread = !notification.is_read;
  const icon = NOTIFICATION_CATEGORY_ICONS[notification.category] || '🔔';

  const timeAgo = (() => {
    try {
      const date =
        typeof notification.created_at === 'string'
          ? parseISO(notification.created_at)
          : notification.created_at;
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return '';
    }
  })();

  const handleClick = () => {
    if (isUnread && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.link_url && !notification.is_dismissed) {
      window.location.href = notification.link_url;
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer',
        isUnread ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/20',
        notification.is_dismissed && 'opacity-50'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
    >
      {/* Unread indicator */}
      {isUnread && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <span className="mt-0.5 text-lg shrink-0">{icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className={cn(
              'text-sm truncate',
              isUnread ? 'font-semibold text-foreground' : 'text-foreground/80'
            )}
          >
            {notification.title}
          </p>
          {notification.priority !== 'normal' && (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 py-0 h-4 shrink-0',
                PRIORITY_COLORS[notification.priority]
              )}
            >
              {NOTIFICATION_PRIORITY_LABELS[notification.priority]}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo}</p>
      </div>

      {/* Dismiss button */}
      {!notification.is_dismissed && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(notification.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
