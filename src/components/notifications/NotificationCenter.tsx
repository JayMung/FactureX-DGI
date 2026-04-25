/**
 * NotificationCenter — Bell dropdown with notifications list
 * Phase 7: Replaces the placeholder bell icon in Header
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Settings, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationCard } from './NotificationCard';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
    loadMore,
    hasMore,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Handle scroll to bottom for infinite load
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (!el || !hasMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // Reset scroll position when opening
  useEffect(() => {
    if (open && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [open]);

  // Filter out dismissed notifications
  const activeNotifications = notifications.filter((n) => !n.is_dismissed);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tout lire
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setOpen(false);
                navigate('/settings/notifications');
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Notifications list */}
        <ScrollArea className="max-h-[400px]">
          <div ref={scrollAreaRef} onScroll={handleScroll} className="h-full">
          {loading && activeNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Vous serez notifié lors des activités importantes
              </p>
            </div>
          ) : (
            <>
              {activeNotifications.map((notif, index) => (
                <div key={notif.id}>
                  <NotificationCard
                    notification={notif}
                    onMarkRead={markAsRead}
                    onDismiss={dismiss}
                  />
                  {index < activeNotifications.length - 1 && (
                    <Separator className="mx-4 w-auto" />
                  )}
                </div>
              ))}
              {hasMore && (
                <div className="flex justify-center py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Voir plus
                  </Button>
                </div>
              )}
            </>
          )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
