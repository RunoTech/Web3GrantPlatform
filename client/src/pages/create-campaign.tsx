import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Heart, ArrowLeft, Building, Users, Calendar, CheckCircle, Lock } from "lucide-react";

// Add Header component import
import Header from "@/components/Header";

export default function CreateCampaignPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get URL parameters to determine campaign type
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  
  // Set initial campaign type based on URL parameter or default to DONATE
  const initialCampaignType = typeParam === 'fund' ? 'FUND' : 'DONATE';
  const [campaignType, setCampaignType] = useState<"FUND" | "DONATE">(initialCampaignType);
  const [creatorType, setCreatorType] = useState<"company" | "citizen" | "association" | "foundation">(
    initialCampaignType === 'FUND' ? 'company' : 'citizen'
  );

  // Lock campaign type if coming from specific page
  const isLocked = typeParam !== null;

  // Creator type options based on campaign type
  const getCreatorTypeOptions = () => {
    if (campaignType === "FUND") {
      return [{ value: "company", label: "Company" }];
    }
    return [
      { value: "citizen", label: "Individual" },
      { value: "association", label: "Association" },
      { value: "foundation", label: "Foundation" }
    ];
  };

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      targetAmount: "0",
      startDate: "",
      endDate: "",
      // Company information fields
      companyName: "",
      companyRegistrationNumber: "",
      companyAddress: "",
      companyWebsite: "",
      companyEmail: "",
      companyPhone: "",
      companyCEO: "",
      companyFoundedYear: "",
      companyIndustry: "",
      companyEmployeeCount: "",
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => 
      api.post("/api/create-campaign", {
        ...data,
        campaignType,
        creatorType,
        ownerWallet: address,
      }),
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Campaign created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/get-campaigns"] });
      setLocation(`/campaign/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Validate FUND/DONATE rules
    if (campaignType === "FUND" && creatorType !== "company") {
      toast({
        title: "Error",
        description: "FUND campaigns can only be created by companies",
        variant: "destructive",
      });
      return;
    }

    if (campaignType === "DONATE" && creatorType === "company") {
      toast({
        title: "Error", 
        description: "DONATE campaigns cannot be created by companies",
        variant: "destructive",
      });
      return;
    }

    if (campaignType === "DONATE" && (!data.startDate || !data.endDate)) {
      toast({
        title: "Error",
        description: "Start and end dates are required for DONATE campaigns",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate(data);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center mx-auto">
            <Lock className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Connect Wallet</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need to connect your wallet first to create a campaign.
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation Header - Binance Style */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-b border-yellow-200 dark:border-yellow-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold text-black dark:text-white">DUXXAN</span>
            </div>
            <Link href="/" className="flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Home
            </Link>
          </div>
        </div>
      </header>

      {/* Campaign Creation Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-4">Create Campaign</h1>
          <p className="text-gray-600 dark:text-gray-400">What type of campaign would you like to create?</p>
        </div>

        {/* Campaign Type Selection - Only show if not locked */}
        {!isLocked && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* FUND Campaign */}
            <div 
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                campaignType === "FUND" 
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600"
              }`}
              onClick={() => {
                setCampaignType("FUND");
                setCreatorType("company");
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Building className="w-8 h-8 text-yellow-600" />
                <h3 className="text-xl font-bold text-black dark:text-white">FUND Campaign</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Unlimited funding campaign for companies
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Only companies can create</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Unlimited (permanent) campaign</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Continuous funding opportunity</span>
                </li>
              </ul>
            </div>

            {/* DONATE Campaign */}
            <div 
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                campaignType === "DONATE" 
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" 
                  : "border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600"
              }`}
              onClick={() => {
                setCampaignType("DONATE");
                if (creatorType === "company") setCreatorType("citizen");
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-8 h-8 text-yellow-600" />
                <h3 className="text-xl font-bold text-black dark:text-white">DONATE Campaign</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Time-limited donation campaign for individuals and organizations
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Individuals, associations, foundations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Start and end dates required</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Time-limited donation campaign</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Campaign Type Info - Show when locked */}
        {isLocked && (
          <div className="mb-8 p-6 border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <div className="flex items-center space-x-3 mb-4">
              {campaignType === "FUND" ? (
                <Building className="w-8 h-8 text-yellow-600" />
              ) : (
                <Users className="w-8 h-8 text-yellow-600" />
              )}
              <h3 className="text-xl font-bold text-black dark:text-white">
                Creating {campaignType} Campaign
              </h3>
              {isLocked && (
                <Lock className="w-5 h-5 text-gray-500" />
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {campaignType === "FUND" 
                ? "Unlimited funding campaign for companies"
                : "Time-limited donation campaign for individuals and organizations"
              }
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              {campaignType === "FUND" ? (
                <>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Only companies can create</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Unlimited (permanent) campaign</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Continuous funding opportunity</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Individuals, associations, foundations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Start and end dates required</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Time-limited donation campaign</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Campaign Form */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Creator Type Selection */}
              <div className="space-y-2">
                <label className="text-black dark:text-white font-medium">Organization Type</label>
                <Select 
                  value={creatorType} 
                  onValueChange={(value: any) => setCreatorType(value)}
                  disabled={campaignType === "FUND"}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCreatorTypeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Campaign Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your campaign title" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campaign Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Campaign Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of your campaign" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600 min-h-[120px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campaign Image */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Campaign Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.jpg" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Amount */}
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Target Amount (USDT)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Information Section - Only for FUND campaigns */}
              {campaignType === "FUND" && (
                <div className="space-y-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-3 mb-4">
                    <Building className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-black dark:text-white">Company Information</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Company Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC Technologies Inc." 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Registration Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123456789" 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">Company Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="123 Business Street, City, State, Country" 
                            {...field} 
                            className="border-gray-300 dark:border-gray-600"
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Company Website</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.company.com" 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Company Email *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="info@company.com" 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Company Phone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="+1 234 567 8900" 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyCEO"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">CEO/Founder Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John Smith" 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="companyFoundedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Founded Year</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="2020" 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                              min="1800"
                              max={new Date().getFullYear()}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyIndustry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Industry *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Technology, Healthcare, etc." 
                              {...field} 
                              className="border-gray-300 dark:border-gray-600"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyEmployeeCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black dark:text-white">Employee Count</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 employees</SelectItem>
                              <SelectItem value="11-50">11-50 employees</SelectItem>
                              <SelectItem value="51-200">51-200 employees</SelectItem>
                              <SelectItem value="201-500">201-500 employees</SelectItem>
                              <SelectItem value="501-1000">501-1000 employees</SelectItem>
                              <SelectItem value="1000+">1000+ employees</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Date Fields - Only for DONATE campaigns */}
              {campaignType === "DONATE" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black dark:text-white">End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="border-gray-300 dark:border-gray-600"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>

            </form>
          </Form>
        </div>

        {/* Campaign Type Info - Only show when not locked */}
        {!isLocked && (
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-black dark:text-white mb-2">
              {campaignType === "FUND" ? "FUND Campaign" : "DONATE Campaign"} Information:
            </h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {campaignType === "FUND" ? (
                <>
                  <li>• Can only be created by companies</li>
                  <li>• Unlimited (permanent) campaign - no start/end dates</li>
                  <li>• Continuous funding opportunity</li>
                </>
              ) : (
                <>
                  <li>• Can be created by individuals, associations and foundations</li>
                  <li>• Start and end dates are required</li>
                  <li>• Time-limited donation campaign</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}