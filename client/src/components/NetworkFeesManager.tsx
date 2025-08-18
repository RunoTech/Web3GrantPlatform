import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Pencil,
  Save,
  X,
  DollarSign,
  Network,
  CheckCircle
} from "lucide-react";

interface NetworkFee {
  id: number;
  network: string;
  tokenSymbol: string;
  tokenAddress: string;
  decimals: number;
  amount: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: number;
}

export default function NetworkFeesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    amount: string;
    tokenAddress: string;
    active: boolean;
  }>({ amount: '', tokenAddress: '', active: true });

  const { data: fees = [], isLoading } = useQuery<NetworkFee[]>({
    queryKey: ["/api/admin/network-fees"],
  });

  const updateFeeMutation = useMutation({
    mutationFn: async (data: { id: number; amount: string; tokenAddress: string; active: boolean }) => {
      return await apiRequest(`/api/admin/network-fees/${data.id}`, {
        method: "PUT",
        body: JSON.stringify({
          amount: data.amount,
          tokenAddress: data.tokenAddress,
          active: data.active
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Network fee updated successfully",
        description: "Changes saved to database",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/network-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/get-fees"] });
      setEditingId(null);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update network fee",
        variant: "destructive",
      });
    },
  });

  const startEdit = (fee: NetworkFee) => {
    setEditingId(fee.id);
    setEditValues({
      amount: fee.amount,
      tokenAddress: fee.tokenAddress,
      active: fee.active
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ amount: '', tokenAddress: '', active: true });
  };

  const saveEdit = (id: number) => {
    if (!editValues.amount || !editValues.tokenAddress) {
      toast({
        title: "Validation Error",
        description: "Amount and token address are required",
        variant: "destructive",
      });
      return;
    }

    updateFeeMutation.mutate({
      id,
      amount: editValues.amount,
      tokenAddress: editValues.tokenAddress,
      active: editValues.active
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Network Activation Fees</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Network Activation Fees</h2>
      </div>

      <div className="space-y-4">
        {fees.map((fee) => (
          <Card key={fee.id} className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  <Badge variant={fee.network === 'ethereum' ? 'default' : 'secondary'}>
                    {fee.network.toUpperCase()}
                  </Badge>
                  <span className="font-medium">{fee.tokenSymbol}</span>
                </div>
                
                {editingId === fee.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={editValues.amount}
                      onChange={(e) => setEditValues(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-24"
                      placeholder="Amount"
                    />
                    <span className="text-sm text-gray-500">{fee.tokenSymbol}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-blue-600">
                      {fee.amount} {fee.tokenSymbol}
                    </span>
                    {fee.active && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingId === fee.id ? (
                  <>
                    <div className="flex items-center gap-2 mr-4">
                      <Label htmlFor={`active-${fee.id}`} className="text-sm">Active</Label>
                      <Switch
                        id={`active-${fee.id}`}
                        checked={editValues.active}
                        onCheckedChange={(checked) => 
                          setEditValues(prev => ({ ...prev, active: checked }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveEdit(fee.id)}
                      disabled={updateFeeMutation.isPending}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={updateFeeMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(fee)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {editingId === fee.id && (
              <div className="mt-4 space-y-3">
                <div>
                  <Label htmlFor={`address-${fee.id}`} className="text-sm font-medium">
                    Token Contract Address
                  </Label>
                  <Input
                    id={`address-${fee.id}`}
                    value={editValues.tokenAddress}
                    onChange={(e) => setEditValues(prev => ({ ...prev, tokenAddress: e.target.value }))}
                    className="font-mono text-sm mt-1"
                    placeholder="0x..."
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(fee.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Network Fee Management</p>
            <p className="text-xs mt-1">
              These fees are charged once when users activate their accounts. 
              Changes will be reflected immediately on the payment page.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}