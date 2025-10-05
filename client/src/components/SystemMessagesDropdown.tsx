import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, X, AlertTriangle, XCircle, CheckCircle, Shield, Ban, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface SystemMessage {
  id: number;
  userId: number;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  createdBy: number | null;
}

const MESSAGE_TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bgColor: string }> = {
  info: { icon: Info, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
  warning: { icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800" },
  error: { icon: XCircle, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  success: { icon: CheckCircle, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" },
  security: { icon: Shield, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" },
  ban: { icon: Ban, color: "text-red-700 dark:text-red-400", bgColor: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700" },
};

export default function SystemMessagesDropdown() {
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/system-messages/unread-count"],
    refetchInterval: 30000,
  });

  const { data: messages, isLoading } = useQuery<SystemMessage[]>({
    queryKey: ["/api/system-messages"],
    refetchInterval: 60000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId: number) => apiRequest("PUT", `/api/system-messages/${messageId}/mark-read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-messages/unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) => apiRequest("DELETE", `/api/system-messages/${messageId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system-messages/unread-count"] });
    },
  });

  const handleMarkAsRead = (messageId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate(messageId);
  };

  const handleDelete = (messageId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(messageId);
  };

  const unreadMessages = messages?.filter(m => !m.isRead) || [];
  const hasUnread = (unreadCount?.count || 0) > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-system-messages"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount?.count || 0}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Sistem Mesajları</h3>
          <p className="text-sm text-muted-foreground">
            {unreadMessages.length > 0 ? `${unreadMessages.length} okunmamış mesaj` : "Yeni mesaj yok"}
          </p>
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2">Yükleniyor...</p>
            </div>
          ) : messages && messages.length > 0 ? (
            <div className="divide-y divide-border">
              {messages.map((message) => {
                const config = MESSAGE_TYPE_CONFIG[message.messageType] || MESSAGE_TYPE_CONFIG.info;
                const IconComponent = config.icon;

                return (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${!message.isRead ? "bg-muted/30" : ""}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${config.bgColor} border`}>
                        <IconComponent className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: tr })}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {!message.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => handleMarkAsRead(message.id, e)}
                              disabled={markAsReadMutation.isPending}
                              data-testid={`button-mark-read-${message.id}`}
                            >
                              Okundu işaretle
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={(e) => handleDelete(message.id, e)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${message.id}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz sistem mesajı yok</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
