import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Bell, AlertTriangle, XCircle, CheckCircle, Shield, Ban } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

type MessageType = "info" | "warning" | "error" | "success" | "security" | "ban";

const MESSAGE_TYPE_OPTIONS: { value: MessageType; label: string; icon: typeof Bell; color: string }[] = [
  { value: "info", label: "Bilgi", icon: Bell, color: "text-blue-600" },
  { value: "warning", label: "Uyarı", icon: AlertTriangle, color: "text-yellow-600" },
  { value: "error", label: "Hata", icon: XCircle, color: "text-red-600" },
  { value: "success", label: "Başarılı", icon: CheckCircle, color: "text-green-600" },
  { value: "security", label: "Güvenlik", icon: Shield, color: "text-orange-600" },
  { value: "ban", label: "Ban/Yasaklama", icon: Ban, color: "text-red-700" },
];

export default function SendMessagePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [message, setMessage] = useState("");

  // Fetch all accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery<any[]>({
    queryKey: ["/api/youhonor/accounts"],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/youhonor/send-system-message", {
        userId: parseInt(selectedUserId),
        message,
        messageType,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Sistem mesajı başarıyla gönderildi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/system-messages"] });
      setSelectedUserId("");
      setMessage("");
      setMessageType("info");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !message.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen kullanıcı ve mesaj seçin",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate();
  };

  const selectedMessageTypeInfo = MESSAGE_TYPE_OPTIONS.find(opt => opt.value === messageType);
  const IconComponent = selectedMessageTypeInfo?.icon || Bell;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setLocation("/youhonor")}
          className="mb-4"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dashboard'a Dön
        </Button>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Send className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sistem Mesajı Gönder</h1>
            <p className="text-muted-foreground">Kullanıcılara özel bildirim gönder</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Mesaj</CardTitle>
          <CardDescription>
            Kullanıcılara güvenlik uyarısı, ban bildirimi veya önemli duyurular gönderin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="user-select">Kullanıcı Seçin</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select" data-testid="select-user">
                  <SelectValue placeholder="Bir kullanıcı seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {accountsLoading && (
                    <SelectItem value="loading" disabled>
                      Yükleniyor...
                    </SelectItem>
                  )}
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.wallet} {account.active ? "✓" : "✗"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {accounts?.length || 0} kayıtlı kullanıcı
              </p>
            </div>

            {/* Message Type */}
            <div className="space-y-2">
              <Label htmlFor="message-type">Mesaj Tipi</Label>
              <Select value={messageType} onValueChange={(val) => setMessageType(val as MessageType)}>
                <SelectTrigger id="message-type" data-testid="select-message-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${option.color}`} />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Message Preview */}
            <div className={`p-4 rounded-lg border-2 flex items-start space-x-3 ${
              messageType === 'ban' || messageType === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
              messageType === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
              messageType === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
              messageType === 'security' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
              'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <IconComponent className={`w-5 h-5 mt-0.5 ${selectedMessageTypeInfo?.color}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Önizleme</p>
                <p className="text-sm text-muted-foreground">
                  {message || "Mesaj buraya yazılacak..."}
                </p>
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-2">
              <Label htmlFor="message-content">Mesaj İçeriği</Label>
              <Textarea
                id="message-content"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Kullanıcıya gönderilecek mesajı buraya yazın..."
                className="min-h-[150px]"
                data-testid="textarea-message"
              />
              <p className="text-sm text-muted-foreground">
                {message.length} karakter
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedUserId("");
                  setMessage("");
                  setMessageType("info");
                }}
                data-testid="button-clear"
              >
                Temizle
              </Button>
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !selectedUserId || !message.trim()}
                data-testid="button-send"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMessageMutation.isPending ? "Gönderiliyor..." : "Mesajı Gönder"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
