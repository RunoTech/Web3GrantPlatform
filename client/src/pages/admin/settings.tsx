import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Save, Plus, Trash2, Edit3, Database, ArrowLeft } from "lucide-react";

interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  dataType: string;
  updatedAt: string;
  updatedBy?: number;
}

export default function AdminSettingsPage() {
  const [, setLocation] = useLocation();
  const { data: categorizedSettings, isLoading } = useAdminSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest("PUT", `/api/youhonor/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings-map"] });
      toast({
        title: "Başarılı",
        description: "Ayar güncellendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ayar güncellenirken hata oluştu",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: string, value: string) => {
    setEditingSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSetting = (key: string) => {
    const newValue = editingSettings[key];
    if (newValue !== undefined) {
      updateSettingMutation.mutate({ key, value: newValue });
      setEditingSettings(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const renderSettingInput = (setting: PlatformSetting) => {
    const currentValue = editingSettings[setting.key] ?? setting.value;
    const isEditing = setting.key in editingSettings;

    switch (setting.dataType) {
      case 'textarea':
        return (
          <div className="space-y-2">
            <Textarea
              value={currentValue}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="min-h-[80px]"
              placeholder={setting.description}
            />
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting(setting.key)}
                  disabled={updateSettingMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Kaydet
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingSettings(prev => {
                    const { [setting.key]: removed, ...rest } = prev;
                    return rest;
                  })}
                >
                  İptal
                </Button>
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <select
              value={currentValue}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className="px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
            {isEditing && (
              <Button
                size="sm"
                onClick={() => handleSaveSetting(setting.key)}
                disabled={updateSettingMutation.isPending}
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder={setting.description}
            />
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting(setting.key)}
                  disabled={updateSettingMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Kaydet
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingSettings(prev => {
                    const { [setting.key]: removed, ...rest } = prev;
                    return rest;
                  })}
                >
                  İptal
                </Button>
              </div>
            )}
          </div>
        );

      default: // text, email, url
        return (
          <div className="space-y-2">
            <Input
              type={setting.dataType === 'email' ? 'email' : setting.dataType === 'url' ? 'url' : 'text'}
              value={currentValue}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              placeholder={setting.description}
            />
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting(setting.key)}
                  disabled={updateSettingMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Kaydet
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingSettings(prev => {
                    const { [setting.key]: removed, ...rest } = prev;
                    return rest;
                  })}
                >
                  İptal
                </Button>
              </div>
            )}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Platform Ayarları</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/youhonor")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Platform Settings</h1>
              <p className="text-sm text-muted-foreground">Configure platform behavior and appearance</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 space-y-6">

      <Tabs defaultValue="general" className="bg-muted/40 rounded-lg space-y-4">
        <TabsList className="bg-transparent grid w-full grid-cols-8">
          <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Genel</TabsTrigger>
          <TabsTrigger value="homepage" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Ana Sayfa</TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Özellikler</TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Fiyatlar</TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Ödeme</TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-background data-[state=active]:text-foreground">İletişim</TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Sosyal</TabsTrigger>
          <TabsTrigger value="blockchain" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Blockchain</TabsTrigger>
        </TabsList>

        {Object.entries(categorizedSettings || {}).map(([category, settings]) => (
          <TabsContent key={category} value={category} className="bg-card text-card-foreground border border-border rounded-xl space-y-4">
            <div className="grid gap-4 p-4">
              {settings.map((setting: PlatformSetting) => (
                <Card key={setting.id} className="rounded-xl border border-border bg-card text-card-foreground">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium text-foreground">
                        {setting.key}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSettingChange(setting.key, setting.value)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {renderSettingInput(setting)}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Son güncelleme: {new Date(setting.updatedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      </div>
    </div>
  );
}