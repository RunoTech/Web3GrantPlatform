import React, { useState, useEffect } from "react";
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
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { erc20Abi } from "viem";
import { Heart, ArrowLeft, Building, Users, Calendar, CheckCircle, Lock, CreditCard, Shield, DollarSign } from "lucide-react";

// Add Header component import
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CreateCampaignPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Wagmi hooks for contract interaction
  const { writeContract, data: txHash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  
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
  
  // Credit card payment state
  const [creditCardEnabled, setCreditCardEnabled] = useState(false);
  const [collateralPaid, setCollateralPaid] = useState(false);
  const [collateralInfo, setCollateralInfo] = useState({ 
    collateralAmount: 100, 
    collateralToken: 'USDT', 
    enabled: true,
    platformWallet: '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8'
  });

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
      // Wallet information - auto-populate if available
      ownerWallet: address || "",
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
      // Credit card payment fields
      creditCardEnabled: false,
      collateralAmount: "100", // Default from API
      collateralTxHash: "",
      collateralPaid: false,
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => 
      api.post("/api/create-campaign", {
        ...data,
        campaignType,
        creatorType,
        // Use form value instead of address from useWallet
        ownerWallet: data.ownerWallet,
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

  // Fetch dynamic collateral info
  const { data: creditCardInfoData, isLoading: creditCardInfoLoading } = useQuery<{
    collateralAmount: number;
    collateralToken: string;
    enabled: boolean;
    platformWallet: string;
  }>({
    queryKey: ["/api/credit-card-info"],
    enabled: true,
  });

  // Update collateral info when data is fetched
  useEffect(() => {
    if (creditCardInfoData) {
      setCollateralInfo(creditCardInfoData);
      form.setValue("collateralAmount", creditCardInfoData.collateralAmount.toString());
    }
  }, [creditCardInfoData, form]);

  // Handle transaction confirmation
  React.useEffect(() => {
    if (isConfirmed && txHash) {
      setCollateralPaid(true);
      form.setValue("collateralTxHash", txHash);
      form.setValue("collateralPaid", true);
      
      toast({
        title: "Payment Successful!",
        description: "Collateral paid successfully. Creating campaign...",
      });

      // Automatically create campaign after successful collateral payment
      setTimeout(() => {
        const formData = form.getValues();
        onSubmit(formData);
      }, 1000); // Small delay to show success message first
    }
  }, [isConfirmed, txHash, form, toast]);

  // Handle write errors
  React.useEffect(() => {
    if (writeError) {
      console.error("Collateral payment error:", writeError);
      toast({
        title: "Payment Failed",
        description: writeError.message || "Failed to process collateral payment",
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  // Wagmi-based collateral payment function
  const handleCollateralPayment = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const collateralAmount = form.getValues("collateralAmount");
    const minAmount = collateralInfo.collateralAmount;
    if (!collateralAmount || parseFloat(collateralAmount) < minAmount) {
      toast({
        title: "Error",
        description: `Minimum collateral amount is ${minAmount} ${collateralInfo.collateralToken}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // USDT contract details
      const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
      const requiredAmount = parseUnits(collateralAmount, 6); // USDT has 6 decimals

      toast({
        title: "Processing...",
        description: "Please confirm the transaction in your wallet",
      });

      // Execute USDT transfer using Wagmi
      await writeContract({
        address: USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [collateralInfo.platformWallet as `0x${string}`, requiredAmount],
      });
      
      toast({
        title: "Transaction Sent",
        description: "Waiting for blockchain confirmation...",
      });

    } catch (error: any) {
      console.error("Collateral payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process collateral payment",
        variant: "destructive",
      });
    }
  };

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

    // Validate credit card payment setup
    if (data.creditCardEnabled && !data.collateralPaid) {
      toast({
        title: "Error",
        description: "You must pay collateral before enabling credit card payments",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      ...data,
      creditCardEnabled,
      collateralPaid,
    });
  };

  // NO AUTH: Allow campaign creation without wallet connection requirement
  // Auto-populate wallet if available, otherwise allow manual input

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header currentPage="create-campaign" />

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
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/60"
              }`}
              onClick={() => {
                setCampaignType("FUND");
                setCreatorType("company");
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Building className="w-8 h-8 text-primary" />
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
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/60"
              }`}
              onClick={() => {
                setCampaignType("DONATE");
                if (creatorType === "company") setCreatorType("citizen");
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-8 h-8 text-primary" />
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
          <div className="mb-8 p-6 border-2 border-primary bg-primary/10 rounded-xl">
            <div className="flex items-center space-x-3 mb-4">
              {campaignType === "FUND" ? (
                <Building className="w-8 h-8 text-primary" />
              ) : (
                <Users className="w-8 h-8 text-primary" />
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
        <div className="card-standard">
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

              {/* Owner Wallet Address */}
              <FormField
                control={form.control}
                name="ownerWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Wallet Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0x... (Enter your wallet address)" 
                        {...field} 
                        className="border-gray-300 dark:border-gray-600"
                        data-testid="input-owner-wallet"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {address ? "Auto-filled from connected wallet" : "Enter your wallet address manually"}
                    </p>
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
                <div className="space-y-6 p-6 surface-secondary rounded-lg border border-border">
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

              {/* Credit Card Payment Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-black dark:text-white">Credit Card Payment Option</h3>
                </div>
                
                <div className="surface-primary border border-primary/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary mb-1">Enable Credit Card Donations</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow donors to contribute using credit cards. Requires a {collateralInfo.collateralAmount} {collateralInfo.collateralToken} collateral payment to activate this feature. Your campaign will be created automatically after payment confirmation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Enable Credit Card Toggle */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="creditCardEnabled"
                      checked={creditCardEnabled}
                      onChange={(e) => {
                        setCreditCardEnabled(e.target.checked);
                        form.setValue("creditCardEnabled", e.target.checked);
                      }}
                      className="w-4 h-4 text-primary border-border rounded focus:ring-primary/50"
                      data-testid="checkbox-credit-card-enabled"
                    />
                    <label htmlFor="creditCardEnabled" className="text-black dark:text-white font-medium cursor-pointer">
                      Enable credit card payments for this campaign
                    </label>
                  </div>

                  {/* Collateral Section */}
                  {creditCardEnabled && (
                    <div className="surface-secondary border border-border rounded-lg p-4 space-y-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-black dark:text-white">Collateral Payment Required</h4>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="collateralAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black dark:text-white">Collateral Amount (USDT)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min={collateralInfo.collateralAmount?.toString() || "1"}
                                step="1"
                                placeholder={collateralInfo.collateralAmount?.toString() || "1"} 
                                {...field} 
                                className="border-gray-300 dark:border-gray-600"
                                data-testid="input-collateral-amount"
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Required: {collateralInfo.collateralAmount} {collateralInfo.collateralToken} to platform wallet</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!collateralPaid && (
                        <Button
                          type="button"
                          onClick={handleCollateralPayment}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
                          data-testid="button-pay-collateral"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pay Collateral & Create Campaign ({form.watch("collateralAmount") || collateralInfo.collateralAmount} {collateralInfo.collateralToken})
                        </Button>
                      )}

                      {collateralPaid && (
                        <div className="surface-primary border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-800 dark:text-green-200 font-medium">Collateral Paid Successfully ({collateralInfo.collateralAmount} {collateralInfo.collateralToken})</span>
                          </div>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            TX: {form.watch("collateralTxHash")?.slice(0, 20)}...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button - Only show when credit card is disabled OR collateral is paid */}
              {(!creditCardEnabled || collateralPaid) && (
                <Button 
                  type="submit" 
                  className="w-full btn-binance font-bold text-lg h-12 transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                  disabled={createCampaignMutation.isPending}
                  data-testid="button-create-campaign"
                >
                  {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                </Button>
              )}
              
              {/* Payment Required Message */}
              {creditCardEnabled && !collateralPaid && (
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Please complete the collateral payment above to create your campaign with credit card support.
                  </p>
                </div>
              )}

            </form>
          </Form>
        </div>

        {/* Campaign Type Info - Only show when not locked */}
        {!isLocked && (
          <div className="mt-8 p-4 surface-secondary rounded-lg">
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
      <Footer />
    </div>
  );
}