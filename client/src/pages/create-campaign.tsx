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
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { erc20Abi } from "viem";
import { Heart, ArrowLeft, Building, Users, Calendar, CheckCircle, Lock, CreditCard, Shield, DollarSign, RefreshCw } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

// Add Header component import
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CreateCampaignPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { campaignFeeDonate, campaignFeeFund, isLoading: settingsLoading } = useSettings();
  
  // Wagmi hooks for contract interaction with DEBUG
  const { writeContract, data: txHash, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: 1, // Explicit Ethereum Mainnet
    timeout: 600000, // 10 minute timeout - increased for Ethereum network delays
  });
  
  // Public client for manual transaction verification
  const publicClient = usePublicClient({ chainId: 1 });
  
  // Debug receipt status
  React.useEffect(() => {
    if (txHash) {
      console.log('⏳ Waiting for transaction receipt...', txHash);
    }
    if (receiptError) {
      console.error('❌ Receipt error:', receiptError);
    }
  }, [txHash, receiptError]);
  
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
  
  // Credit card payment state - Updated for balance system
  const [creditCardEnabled, setCreditCardEnabled] = useState(false);
  const [collateralPaid, setCollateralPaid] = useState(false);
  const [validatedFormData, setValidatedFormData] = useState<any>(null); // Store validated data
  const [companyBalance, setCompanyBalance] = useState<{ available: number; reserved: number } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<number | null>(null);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [collateralInfo, setCollateralInfo] = useState({ 
    collateralAmount: 100, 
    collateralToken: 'USDT', 
    enabled: true,
    platformWallet: '0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8'
  });
  
  // Image upload state
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Pending payment tracking
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  
  // KYB Status Query - Check if user has approved KYB
  const { data: kybStatus, isLoading: kybLoading } = useQuery({
    queryKey: ['/api/kyb/status'],
    enabled: isConnected && campaignType === 'FUND',
    retry: false
  });

  // Company Profile Query - Get approved company data
  const { data: companyProfile, isLoading: companyLoading } = useQuery({
    queryKey: ['/api/company/profile'], 
    enabled: isConnected && campaignType === 'FUND' && kybStatus && (kybStatus as any)?.status === 'APPROVED',
    retry: false
  });

  // Company balance fetch hook - Updated for balance system
  const fetchCompanyBalance = async () => {
    if (!isConnected) return null;
    try {
      setBalanceLoading(true);
      const response = await api.get('/api/company/balance');
      return response.balance;
    } catch (error) {
      console.error('Balance fetch error:', error);
      return null;
    } finally {
      setBalanceLoading(false);
    }
  };
  
  // Load company balance when credit card is enabled
  useEffect(() => {
    if (creditCardEnabled && isConnected) {
      fetchCompanyBalance().then(setCompanyBalance);
    }
  }, [creditCardEnabled, isConnected]);

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
      imageUrl: uploadedImageUrl || "",
      targetAmount: "0",
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
      // Campaign creation fee
      campaignFeeTxHash: "",
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

  // File upload handler
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('campaignImage', file);

      const response = await fetch('/api/upload-campaign-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadedImageUrl(data.imageUrl);
      form.setValue("imageUrl", data.imageUrl);

      toast({
        title: "Upload Successful",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle transaction confirmation with DEBUG
  // LEGACY DIRECT PAYMENT EFFECT - DISABLED FOR BALANCE SYSTEM
  // This effect is replaced by balance-based top-up confirmation
  React.useEffect(() => {
    // Only trigger for legacy direct payment (when paymentIntentId is NOT set)
    if (isConfirmed && txHash && validatedFormData && !paymentIntentId) {
      console.log('⚠️ Legacy direct payment detected - this should not happen in balance system');
      
      // DISABLED: This path is deprecated in favor of balance system
      console.log('❌ Legacy direct payment path disabled');
      toast({
        title: "Payment Error",
        description: "Please use the balance system for collateral payments.",
        variant: "destructive",
      });
    }
  }, [isConfirmed, txHash, validatedFormData, paymentIntentId, toast]);

  // Handle top-up payment confirmation - Balance system
  useEffect(() => {
    if (isConfirmed && txHash && paymentIntentId && validatedFormData) {
      handleTopUpConfirmation();
    }
  }, [isConfirmed, txHash, paymentIntentId, validatedFormData]);
  
  const handleTopUpConfirmation = async () => {
    try {
      console.log('✅ Top-up payment confirmed! Processing...');
      setBalanceLoading(true);
      
      // Step 1: Confirm payment intent and credit balance
      await api.post('/api/payment/confirm', {
        paymentIntentId,
        txHash
      });
      
      // Step 2: Reserve collateral from newly credited balance
      const collateralAmount = validatedFormData.collateralAmount.toString();
      await api.post('/api/collateral/reserve', {
        campaignId: null, // Will be linked to campaign after creation
        collateralAmount,
        purpose: 'CREDIT_CARD_COLLATERAL'
      });
      
      // Step 3: Mark collateral as paid and close modal
      setCollateralPaid(true);
      setShowTopUpModal(false);
      setBalanceLoading(false);
      
      // Refresh balance after top-up and reservation
      fetchCompanyBalance().then(setCompanyBalance);
      
      toast({
        title: "Top-up Successful!",
        description: "Balance credited and collateral reserved. Ready to create campaign!",
      });
      
    } catch (error: any) {
      console.error('Top-up confirmation error:', error);
      setBalanceLoading(false);
      toast({
        title: "Top-up Error",
        description: error?.response?.data?.error || "Failed to process top-up confirmation",
        variant: "destructive",
      });
    }
  };
  
  // Handle write contract errors - Restored error handling
  React.useEffect(() => {
    if (writeError) {
      console.error("❌ Transaction error:", writeError);
      setBalanceLoading(false);
      setValidatedFormData(null);
      toast({
        title: "Transaction Failed",
        description: writeError.message || "Failed to process payment transaction",
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  // Handle top-up transaction initiation
  const handleTopUpPayment = async () => {
    if (!paymentIntentId || !validatedFormData) return;
    
    try {
      const requiredAmount = parseFloat(validatedFormData.collateralAmount);
      const availableBalance = companyBalance?.available || 0;
      const shortfall = requiredAmount - availableBalance;
      const usdtContract = "0xdac17f958d2ee523a2206206994597c13d831ec7";
      const amount = parseUnits(shortfall.toFixed(6), 6); // Ensure proper precision
      
      writeContract({
        address: usdtContract as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [collateralInfo.platformWallet as `0x${string}`, amount],
        chainId: 1,
      });
      
      toast({
        title: "Transaction Sent",
        description: "Processing top-up payment...",
      });
      
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error?.message || "Failed to send top-up payment",
        variant: "destructive",
      });
    }
  };

  // Handle collateral payment - UPDATED FOR BALANCE SYSTEM
  const handleCollateralPayment = async () => {
    console.log('🚀 Starting balance-based collateral handling...');
    
    // STEP 1: Validate form FIRST (keep existing validation)
    const formData = form.getValues();
    console.log('📋 Form data retrieved:', formData);
    
    // Form validation (unchanged)
    if (!formData.title?.trim()) {
      toast({ title: "Validation Error", description: "Campaign title is required", variant: "destructive" });
      return;
    }
    if (!formData.description?.trim()) {
      toast({ title: "Validation Error", description: "Campaign description is required", variant: "destructive" });
      return;
    }
    if (!formData.ownerWallet?.trim()) {
      toast({ title: "Validation Error", description: "Wallet address is required", variant: "destructive" });
      return;
    }
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      toast({ title: "Validation Error", description: "Target amount must be greater than 0", variant: "destructive" });
      return;
    }
    if (campaignType === "FUND" && creatorType !== "company") {
      toast({ title: "Validation Error", description: "FUND campaigns can only be created by companies", variant: "destructive" });
      return;
    }
    if (campaignType === "DONATE" && creatorType === "company") {
      toast({ title: "Validation Error", description: "DONATE campaigns cannot be created by companies", variant: "destructive" });
      return;
    }
    
    const collateralAmount = formData.collateralAmount;
    const minAmount = collateralInfo.collateralAmount;
    if (!collateralAmount || parseFloat(collateralAmount) < minAmount) {
      toast({ title: "Validation Error", description: `Minimum collateral amount is ${minAmount} ${collateralInfo.collateralToken}`, variant: "destructive" });
      return;
    }

    // STEP 2: Check wallet connection
    if (!isConnected || !address) {
      toast({ title: "Wallet Error", description: "Please connect your wallet to proceed", variant: "destructive" });
      return;
    }

    try {
      setBalanceLoading(true);
      
      // STEP 3: Check company balance
      console.log('💰 Checking company balance...');
      const balance = await fetchCompanyBalance();
      
      if (!balance) {
        toast({ title: "Balance Error", description: "Unable to fetch company balance. Please try again.", variant: "destructive" });
        return;
      }
      
      const requiredAmount = parseFloat(collateralAmount);
      const availableBalance = balance.available;
      
      console.log(`💰 Balance check: Required=${requiredAmount}, Available=${availableBalance}`);
      
      // STEP 4: Handle sufficient vs insufficient balance
      if (availableBalance >= requiredAmount) {
        // STEP 4A: Sufficient balance - Reserve collateral directly
        console.log('✅ Sufficient balance - reserving collateral directly');
        
        const reservationResponse = await api.post('/api/collateral/reserve', {
          campaignId: null, // Will be linked to campaign after creation
          collateralAmount: requiredAmount.toString(), // Use decimal string
          purpose: 'CREDIT_CARD_COLLATERAL'
        });
        
        console.log('✅ Collateral reserved:', reservationResponse);
        
        // Store reservation ID and validated data
        if (reservationResponse.reservation?.id) {
          setReservationId(reservationResponse.reservation.id);
        }
        setValidatedFormData(formData);
        setCollateralPaid(true);
        
        // Refresh balance after reservation
        fetchCompanyBalance().then(setCompanyBalance);
        
        toast({
          title: "Collateral Reserved!",
          description: `${requiredAmount} ${collateralInfo.collateralToken} reserved from your company balance.`,
        });
        
      } else {
        // STEP 4B: Insufficient balance - Show top-up modal
        const shortfall = requiredAmount - availableBalance;
        console.log(`💳 Insufficient balance - need to top up ${shortfall} USDT`);
        
        toast({
          title: "Insufficient Balance",
          description: `You need ${shortfall} more USDT. Please top up your balance.`,
          variant: "destructive",
        });
        
        // Create payment intent for top-up
        const paymentIntentResponse = await api.post('/api/payment-intents', {
          purpose: 'BALANCE_TOPUP',
          amount: shortfall,
          method: 'USDT',
          metadata: { 
            collateralAmount: requiredAmount,
            formData: formData 
          }
        });
        
        setPaymentIntentId(paymentIntentResponse.paymentIntent.id);
        setValidatedFormData(formData);
        setShowTopUpModal(true);
      }
      
    } catch (error: any) {
      console.error('Balance system error:', error);
      toast({
        title: "Balance System Error", 
        description: error?.response?.data?.error || "Failed to process balance operation",
        variant: "destructive",
      });
    } finally {
      setBalanceLoading(false);
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

    if (false) {
      // Date validation removed
      toast({
        title: "Error",
        description: "Validation error",
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

        {/* KYB Gating for FUND Campaigns */}
        {campaignType === 'FUND' && isConnected && (
          <>
            {/* Loading State */}
            {kybLoading && (
              <div className="card-standard">
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin mr-3" />
                  <span className="text-lg text-black dark:text-white">Checking KYB verification status...</span>
                </div>
              </div>
            )}

            {/* KYB Not Started or Not Approved */}
            {!kybLoading && (!kybStatus || (kybStatus as any).status !== 'APPROVED') && (
              <div className="card-standard">
                <div className="text-center py-8 space-y-6">
                  <div className="flex items-center justify-center">
                    <Shield className="w-16 h-16 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-4">KYB Verification Required</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      FUND campaigns require approved Know Your Business (KYB) verification. Complete the KYB process to continue with campaign creation.
                    </p>
                    {(kybStatus as any)?.status === 'PENDING' && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-6">
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                          Your KYB verification is pending review. You'll be able to create FUND campaigns once approved.
                        </p>
                      </div>
                    )}
                    <Button asChild className="bg-primary hover:bg-primary/90 text-white px-8 py-3">
                      <Link href="/create-fund">
                        <Building className="w-5 h-5 mr-2" />
                        Complete KYB Verification
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Approved Company Profile Display */}
            {!kybLoading && (kybStatus as any)?.status === 'APPROVED' && companyProfile && (
              <div className="card-standard mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-black dark:text-white">Verified Company Profile</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Company Name</p>
                    <p className="font-medium text-black dark:text-white">{(companyProfile as any).companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Registration Number</p>
                    <p className="font-medium text-black dark:text-white">{(companyProfile as any).companyRegistrationNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Industry</p>
                    <p className="font-medium text-black dark:text-white">{(companyProfile as any).companyIndustry}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Contact Person</p>
                    <p className="font-medium text-black dark:text-white">{(companyProfile as any).contactPersonName}</p>
                  </div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  ✓ This company information will be used for your FUND campaign
                </p>
              </div>
            )}
          </>
        )}

        {/* Campaign Form - Only show if not FUND or if FUND with approved KYB */}
        {(campaignType !== 'FUND' || ((kybStatus as any)?.status === 'APPROVED' && companyProfile)) && (
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

              {/* Campaign Image Upload */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black dark:text-white">Campaign Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input 
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="border-gray-300 dark:border-gray-600 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          data-testid="input-campaign-image"
                        />
                        {isUploading && (
                          <p className="text-sm text-muted-foreground">Uploading image...</p>
                        )}
                        {uploadedImageUrl && (
                          <div className="space-y-2">
                            <p className="text-sm text-green-600 dark:text-green-400">✓ Image uploaded successfully</p>
                            <img 
                              src={uploadedImageUrl} 
                              alt="Campaign preview" 
                              className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload an image (max 10MB). Supported formats: JPG, PNG, GIF
                    </p>
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

              {/* Campaign Creation Fee Section */}
              {(() => {
                const campaignFee = campaignType === "FUND" ? campaignFeeFund : campaignFeeDonate;
                if (settingsLoading || campaignFee === undefined) return null;
                
                return (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-6 h-6 text-primary" />
                      <h3 className="text-lg font-semibold text-black dark:text-white">Campaign Creation Fee</h3>
                    </div>
                    
                    {campaignFee > 0 ? (
                      <>
                        <div className="surface-primary border border-primary/20 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <Shield className="w-5 h-5 text-primary mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-primary mb-1">
                                {campaignType} Campaign Fee: {campaignFee} USDT
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                A one-time fee of {campaignFee} USDT is required to create a {campaignType} campaign. 
                                This fee helps maintain the platform and ensure quality campaigns. Payment is verified on the blockchain.
                              </p>
                            </div>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="campaignFeeTxHash"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-black dark:text-white flex items-center space-x-2">
                                <span>Campaign Fee Payment Transaction Hash</span>
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="0x... (Transaction hash after sending USDT to platform wallet)" 
                                  {...field} 
                                  className="border-gray-300 dark:border-gray-600 font-mono text-sm"
                                  data-testid="input-campaign-fee-tx"
                                />
                              </FormControl>
                              <FormMessage />
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <p><strong>How to pay:</strong></p>
                                <ol className="list-decimal list-inside space-y-1 ml-2">
                                  <li>Send <strong>{campaignFee} USDT</strong> to the platform wallet</li>
                                  <li>Copy the transaction hash from your wallet</li>
                                  <li>Paste it above and submit the form</li>
                                  <li>We'll verify your payment on the blockchain</li>
                                </ol>
                              </div>
                            </FormItem>
                          )}
                        />
                      </>
                    ) : (
                      <div className="surface-primary border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-green-700 dark:text-green-300 mb-1">
                              Free Campaign Creation
                            </h4>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              {campaignType} campaigns are currently free to create. No payment required!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* KYB Verification Notice - Only for FUND campaigns */}
              {campaignType === "FUND" && (
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">KYB Verification Required</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                        FUND campaigns require Know Your Business (KYB) verification including document upload and admin approval. 
                        Please use our dedicated FUND creation wizard for the complete verification process.
                      </p>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href="/create-fund">
                          <Building className="w-4 h-4 mr-2" />
                          Complete FUND Creation with KYB
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Card Payment Section - Only for FUND campaigns */}
              {campaignType === "FUND" && (
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
                        
                        {/* Company Balance Status */}
                        {companyBalance && (
                          <div className="surface-primary border border-primary/20 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Company Balance</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-black dark:text-white">
                                  Available: {companyBalance.available} USDT
                                </div>
                                {companyBalance.reserved > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Reserved: {companyBalance.reserved} USDT
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {balanceLoading && (
                          <div className="surface-primary border border-primary/20 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                              <span className="text-sm text-primary">Checking balance...</span>
                            </div>
                          </div>
                        )}
                        
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
              )}


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
        )}

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