import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

const campaignFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  campaignType: z.enum(["DONATE", "FUND"]),
  creatorType: z.enum(["company", "citizen", "association", "foundation"]),
  ownerWallet: z.string().min(42, "Invalid wallet address"),
  goalAmount: z.string().min(1, "Goal amount is required"),
  targetDate: z.string(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  approved: z.boolean().default(true),
  creditCardEnabled: z.boolean().default(false),
  imageUrl: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

interface CampaignFormProps {
  campaignId?: string;
}

export default function CampaignForm({ campaignId }: CampaignFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = !!campaignId;

  const { data: campaigns, isLoading } = useQuery<any[]>({
    queryKey: ["/api/youhonor/campaigns"],
    enabled: isEdit,
  });

  const campaign = isEdit && campaigns ? campaigns.find((c: any) => c.id === parseInt(campaignId!)) : null;

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: campaign?.title || "",
      description: campaign?.description || "",
      campaignType: campaign?.campaignType || "DONATE",
      creatorType: campaign?.creatorType || "citizen",
      ownerWallet: campaign?.ownerWallet || "",
      goalAmount: campaign?.goalAmount || "",
      targetDate: campaign?.targetDate ? new Date(campaign.targetDate).toISOString().split('T')[0] : "",
      featured: campaign?.featured || false,
      active: campaign?.active !== undefined ? campaign.active : true,
      approved: campaign?.approved !== undefined ? campaign.approved : true,
      creditCardEnabled: campaign?.creditCardEnabled || false,
      imageUrl: campaign?.imageUrl || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const url = isEdit 
        ? `/api/youhonor/campaigns/${campaignId}` 
        : "/api/youhonor/campaigns";
      const method = isEdit ? "PUT" : "POST";
      
      return apiRequest(url, method, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Campaign ${isEdit ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/youhonor/campaigns"] });
      setLocation("/youhonor/campaigns");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save campaign",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    mutation.mutate(data);
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => setLocation("/youhonor/campaigns")}
        className="mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Campaign" : "Create New Campaign"}</CardTitle>
          <CardDescription>
            {isEdit ? "Update campaign details" : "Add a new campaign to the platform"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign title" {...field} data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter campaign description"
                        className="min-h-[120px]"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="campaignType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-campaign-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DONATE">DONATE</SelectItem>
                          <SelectItem value="FUND">FUND</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creatorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Creator Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-creator-type">
                            <SelectValue placeholder="Select creator type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="citizen">Citizen</SelectItem>
                          <SelectItem value="association">Association</SelectItem>
                          <SelectItem value="foundation">Foundation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ownerWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} data-testid="input-wallet" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="goalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Amount (USDT)</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" {...field} data-testid="input-goal-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-target-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} data-testid="input-image-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <FormLabel>Featured Campaign</FormLabel>
                        <p className="text-sm text-muted-foreground">Display on homepage</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-featured"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creditCardEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <FormLabel>Credit Card Enabled</FormLabel>
                        <p className="text-sm text-muted-foreground">Accept card payments</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-credit-card"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <FormLabel>Active</FormLabel>
                        <p className="text-sm text-muted-foreground">Campaign is active</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="approved"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between border rounded-lg p-4">
                      <div>
                        <FormLabel>Approved</FormLabel>
                        <p className="text-sm text-muted-foreground">Campaign is approved</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-approved"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  data-testid="button-save-campaign"
                >
                  {mutation.isPending ? "Saving..." : isEdit ? "Update Campaign" : "Create Campaign"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/youhonor/campaigns")}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
