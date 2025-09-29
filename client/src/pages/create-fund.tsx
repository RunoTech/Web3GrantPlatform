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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";
import { 
  Building2, 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Wallet,
  Shield,
  FileCheck,
  AlertCircle,
  DollarSign,
  RefreshCw
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DocumentFile {
  id?: number;
  type: string;
  file: File;
  preview: string;
  uploaded?: boolean;
}

export default function CreateFundPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [verificationId, setVerificationId] = useState<number | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentFile[]>([]);
  
  // Payment state - Updated for balance system
  const [collateralPaid, setCollateralPaid] = useState(false);
  const [pendingFundId, setPendingFundId] = useState<number | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Wagmi hooks for payment
  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: 1,
    timeout: 600000,
  });

  // Platform settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings-map'],
    refetchOnWindowFocus: false
  });

  // Database-driven pricing for FUND collateral
  const { data: pricingData } = useQuery({
    queryKey: ['/api/pricing', 'fund_collateral'],
    queryFn: () => api.get('/api/pricing?purpose=fund_collateral'),
    refetchOnWindowFocus: false
  });

  // KYB Status Query
  const { data: kybStatus, refetch: refetchKybStatus } = useQuery({
    queryKey: ['/api/kyb/status'],
    enabled: isConnected,
    refetchInterval: 5000, // Check status every 5 seconds
    retry: false
  });

  // Company Balance Query
  const { data: companyBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['/api/company/balance'],
    enabled: isConnected,
    retry: false
  });

  const collateralAmount = pricingData?.pricing?.amount || settings?.fund_collateral_amount || "100";
  const collateralToken = pricingData?.pricing?.token || "USDT";
  const platformWallet = pricingData?.pricing?.platformWallet || settings?.platform_wallet || "0x21e1f57a753fE27F7d8068002F65e8a830E2e6A8";

  // Step 1: Company Information Form
  const companyForm = useForm({
    defaultValues: {
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
      ownerWallet: address || "",
    },
  });

  // Step 3: Campaign Details Form
  const campaignForm = useForm({
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      targetAmount: "0",
      startDate: "",
      endDate: "",
      creditCardEnabled: false,
    },
  });

  // Document types required for KYB
  const requiredDocuments = [
    { type: "company_registry", name: "Company Registration Certificate", required: true },
    { type: "tax_certificate", name: "Tax Registration Certificate", required: true },
    { type: "id_card", name: "CEO/Founder ID Document", required: true },
    { type: "bank_statement", name: "Company Bank Statement", required: false },
    { type: "passport", name: "Business License", required: false },
  ];

  // Step management
  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.includes(step - 1)) {
      setCurrentStep(step);
    }
  };

  const markStepCompleted = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  };

  const canProceedToStep = (step: number) => {
    return currentStep >= step || completedSteps.includes(step - 1);
  };

  // Submit company information (Step 1)
  const submitCompanyInfo = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/api/kyb/create-verification', {
        ...data,
        wallet: address,
      });
    },
    onSuccess: (data) => {
      setVerificationId(data.id);
      markStepCompleted(1);
      setCurrentStep(2);
      toast({
        title: "Company Information Saved",
        description: "Your company information has been recorded. Please upload required documents.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save company information",
        variant: "destructive",
      });
    },
  });

  // Balance Top-up Payment Handler
  const handleBalanceTopUp = useMutation({
    mutationFn: async (amount: number) => {
      if (!address || !pricingData?.pricing) {
        throw new Error("Missing wallet address or pricing data");
      }

      // Create payment intent for balance top-up
      const paymentIntent = await api.post('/api/payment-intents', {
        amount: amount.toString(),
        token: collateralToken,
        wallet: address,
        purpose: 'balance_topup',
        description: `Balance top-up: ${amount} ${collateralToken}`
      });

      return paymentIntent;
    },
    onSuccess: (data) => {
      setPaymentIntentId(data.id);
      
      // Trigger blockchain payment
      const tokenAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT
      const amountInWei = parseUnits(collateralAmount.toString(), 6); // USDT has 6 decimals
      
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [platformWallet as `0x${string}`, amountInWei],
        chainId: 1,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error?.message || "Failed to initiate payment",
        variant: "destructive",
      });
    },
  });

  // Watch for payment confirmation
  useEffect(() => {
    if (isConfirmed && paymentIntentId) {
      toast({
        title: "Payment Confirmed",
        description: `${collateralAmount} ${collateralToken} added to your company balance`,
      });
      setCollateralPaid(true);
      markStepCompleted(3); // Complete balance top-up step
      refetchBalance(); // Refresh balance
      queryClient.invalidateQueries({ queryKey: ['/api/company/balance'] });
    }
  }, [isConfirmed, paymentIntentId, collateralAmount, collateralToken]);

  // Document upload handler
  const handleDocumentUpload = async (file: File, documentType: string) => {
    console.log("🔍 Document upload started:", { fileName: file.name, fileSize: file.size, documentType, verificationId });
    
    if (!verificationId) {
      console.log("❌ No verification ID available");
      toast({
        title: "Error",
        description: "Please complete company information first",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('verificationId', verificationId.toString());
    formData.append('wallet', address || '');

    try {
      console.log("📤 Sending upload request to /api/kyb/upload-document");
      const response = await fetch('/api/kyb/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      console.log("📥 Upload response received:", { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ Upload failed, response:", errorText);
        throw new Error('Upload failed');
      }
      
      const data = await response.json();

      const newDoc: DocumentFile = {
        id: data.id,
        type: documentType,
        file,
        preview: URL.createObjectURL(file),
        uploaded: true,
      };

      setUploadedDocuments(prev => {
        const filtered = prev.filter(doc => doc.type !== documentType);
        return [...filtered, newDoc];
      });

      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded successfully`,
      });

      // Check if all required documents are uploaded
      const requiredDocs = requiredDocuments.filter(doc => doc.required).map(doc => doc.type);
      const uploadedTypes = [...uploadedDocuments.filter(doc => doc.type !== documentType).map(doc => doc.type), documentType];
      
      if (requiredDocs.every(type => uploadedTypes.includes(type))) {
        markStepCompleted(2);
        setCurrentStep(3); // Move to Balance Top-up step
      }

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  // Auto-advance to approval waiting when balance is topped up
  useEffect(() => {
    if (collateralPaid && completedSteps.includes(3)) {
      setCurrentStep(4); // Move to Approval Waiting step
      // Start monitoring KYB status
      refetchKybStatus();
    }
  }, [collateralPaid, completedSteps]);

  // Auto-advance to campaign creation when KYB is approved
  useEffect(() => {
    if (kybStatus && (kybStatus as any).status === 'APPROVED' && completedSteps.includes(3)) {
      markStepCompleted(4); // Complete approval waiting
      setCurrentStep(5); // Move to Campaign Creation step
    }
  }, [kybStatus, completedSteps]);

  // Enhanced Campaign Creation (Final Step)
  const createFinalCampaign = useMutation({
    mutationFn: async (data: any) => {
      // Use the unified campaign creation endpoint that now enforces KYB
      return api.post('/api/create-campaign', {
        ...data,
        ownerWallet: address,
        campaignType: 'FUND',
        creatorType: 'company',
        creditCardEnabled: true, // FUND campaigns have credit card enabled by default
        // Company data will be automatically filled from approved KYB
      });
    },
    onSuccess: (data) => {
      markStepCompleted(5);
      toast({
        title: "FUND Campaign Created Successfully!",
        description: "Your FUND campaign is now live and accepting donations.",
      });
      // Redirect to campaign page or dashboard
      setTimeout(() => {
        setLocation(`/campaign/${data.id}`);
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Campaign Creation Failed",
        description: error?.message || "Failed to create FUND campaign",
        variant: "destructive",
      });
    },
  });

  // Submit campaign details and create pending fund (Legacy - now for step 5)
  const submitCampaignDetails = useMutation({
    mutationFn: async (data: any) => {
      return createFinalCampaign.mutateAsync(data);
    },
    onSuccess: (data) => {
      setPendingFundId(data.id);
      markStepCompleted(3);
      setCurrentStep(4);
      toast({
        title: "Campaign Details Saved",
        description: "Please proceed with collateral payment to submit your fund for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save campaign details",
        variant: "destructive",
      });
    },
  });

  // Handle collateral payment
  const handleCollateralPayment = async () => {
    if (!pendingFundId) {
      toast({
        title: "Error",
        description: "Please complete previous steps first",
        variant: "destructive",
      });
      return;
    }

    try {
      setBalanceLoading(true);
      
      // Step 1: Create payment intent for KYB deposit
      const paymentIntentResponse = await api.post('/api/payment-intents', {
        purpose: 'KYB_DEPOSIT',
        amount: collateralAmount,
        method: 'USDT',
        metadata: { pendingFundId }
      });
      
      const intent = paymentIntentResponse.paymentIntent;
      setPaymentIntentId(intent.id);
      
      // Step 2: Execute USDT transfer to platform wallet
      const usdtContract = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT Mainnet
      const amount = parseUnits(collateralAmount, 6); // USDT has 6 decimals

      writeContract({
        address: usdtContract as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [platformWallet as `0x${string}`, amount],
        chainId: 1,
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      setBalanceLoading(false);
      toast({
        title: "Payment Failed",
        description: error?.response?.data?.error || error?.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  // Handle payment confirmation - Updated for balance system
  useEffect(() => {
    if (isConfirmed && txHash && paymentIntentId && pendingFundId) {
      handlePaymentConfirmation();
    }
  }, [isConfirmed, txHash, paymentIntentId, pendingFundId]);
  
  const handlePaymentConfirmation = async () => {
    try {
      setBalanceLoading(true);
      
      // Step 1: Confirm payment intent and credit balance
      await api.post('/api/payment/confirm', {
        paymentIntentId,
        txHash
      });
      
      // Step 2: Update KYB pending fund status
      await api.post('/api/kyb/confirm-payment', {
        pendingFundId,
        txHash,
        amount: collateralAmount,
      });
      
      // Step 3: If credit card enabled, reserve collateral from balance
      const creditCardEnabled = campaignForm.getValues('creditCardEnabled');
      if (creditCardEnabled) {
        // This will be handled in campaign creation step
        // For now just mark payment as complete
      }
      
      setCollateralPaid(true);
      markStepCompleted(4);
      setBalanceLoading(false);
      
      toast({
        title: "Payment Successful!",
        description: "Balance credited. Your fund application has been submitted for admin review.",
      });
      
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      setBalanceLoading(false);
      toast({
        title: "Confirmation Error",
        description: error?.response?.data?.error || "Payment sent but failed to update status. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Calculate progress percentage
  const progressPercentage = (completedSteps.length / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/funds">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Funds
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Create Corporate Fund
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Multi-step verification process for corporate fundraising
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Progress</span>
              <span>{completedSteps.length}/4 Steps Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-6">
            {[
              { num: 1, title: "Company Info", icon: Building2 },
              { num: 2, title: "Documents", icon: FileText },
              { num: 3, title: "Campaign", icon: Camera },
              { num: 4, title: "Payment", icon: Wallet },
            ].map(({ num, title, icon: Icon }) => (
              <button
                key={num}
                onClick={() => goToStep(num)}
                disabled={!canProceedToStep(num)}
                className={`flex flex-col items-center space-y-2 p-4 rounded-lg transition-colors ${
                  currentStep === num
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : completedSteps.includes(num)
                    ? 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400'
                    : canProceedToStep(num)
                    ? 'hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-800 dark:text-gray-400'
                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                }`}
                data-testid={`step-indicator-${num}`}
              >
                <div className={`p-2 rounded-full ${
                  completedSteps.includes(num) ? 'bg-green-500' : 'bg-current opacity-20'
                }`}>
                  {completedSteps.includes(num) ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>
                <span className="text-sm font-medium">{title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Connection Check */}
        {!isConnected ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                You need to connect your wallet to create a corporate fund
              </p>
              <WalletConnectButton />
            </CardContent>
          </Card>
        ) : (
          /* Step Content */
          <div className="space-y-6">
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Please provide accurate company details for KYB verification
                  </CardDescription>
                </CardHeader>
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit((data) => submitCompanyInfo.mutate(data))}>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={companyForm.control}
                          name="companyName"
                          rules={{ required: "Company name is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name *</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-company-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="companyRegistrationNumber"
                          rules={{ required: "Registration number is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registration Number *</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-registration-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="companyEmail"
                          rules={{ 
                            required: "Email is required",
                            pattern: { value: /^\S+@\S+$/i, message: "Invalid email" }
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Email *</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="input-company-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="companyCEO"
                          rules={{ required: "CEO name is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEO/Founder Name *</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-ceo-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="companyIndustry"
                          rules={{ required: "Industry is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Industry *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-industry">
                                    <SelectValue placeholder="Select industry" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="technology">Technology</SelectItem>
                                  <SelectItem value="finance">Finance</SelectItem>
                                  <SelectItem value="healthcare">Healthcare</SelectItem>
                                  <SelectItem value="education">Education</SelectItem>
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="companyPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-company-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={companyForm.control}
                        name="companyAddress"
                        rules={{ required: "Address is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Address *</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} data-testid="input-company-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={companyForm.control}
                          name="companyWebsite"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://" {...field} data-testid="input-company-website" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={companyForm.control}
                          name="companyEmployeeCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee Count</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-employee-count">
                                    <SelectValue placeholder="Select range" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1-10">1-10</SelectItem>
                                  <SelectItem value="11-50">11-50</SelectItem>
                                  <SelectItem value="51-200">51-200</SelectItem>
                                  <SelectItem value="201-500">201-500</SelectItem>
                                  <SelectItem value="500+">500+</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        type="submit" 
                        disabled={submitCompanyInfo.isPending}
                        className="ml-auto"
                        data-testid="button-save-company-info"
                      >
                        {submitCompanyInfo.isPending ? "Saving..." : "Save & Continue"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            )}

            {/* Step 2: Document Upload */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Upload
                  </CardTitle>
                  <CardDescription>
                    Upload required documents for KYB verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!verificationId ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Please complete company information first
                      </p>
                      <Button 
                        onClick={() => setCurrentStep(1)}
                        className="mt-4"
                        data-testid="button-go-to-step-1"
                      >
                        Go to Step 1
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requiredDocuments.map((doc) => {
                        const uploadedDoc = uploadedDocuments.find(d => d.type === doc.type);
                        
                        return (
                          <div key={doc.type} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileCheck className={`h-5 w-5 ${uploadedDoc ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className="font-medium">{doc.name}</span>
                                {doc.required && <Badge variant="secondary">Required</Badge>}
                              </div>
                              {uploadedDoc && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            
                            {uploadedDoc ? (
                              <div className="text-sm text-green-600 dark:text-green-400">
                                ✓ Uploaded: {uploadedDoc.file.name}
                              </div>
                            ) : (
                              <div>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    console.log("📁 File input onChange triggered", e.target.files);
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      console.log("✅ File selected, calling handleDocumentUpload");
                                      handleDocumentUpload(file, doc.type);
                                    } else {
                                      console.log("❌ No file selected");
                                    }
                                  }}
                                  className="hidden"
                                  id={`upload-${doc.type}`}
                                />
                                <label
                                  htmlFor={`upload-${doc.type}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                  data-testid={`upload-${doc.type}`}
                                >
                                  <Upload className="h-4 w-4" />
                                  Choose File
                                </label>
                                <p className="text-sm text-gray-500 mt-1">
                                  PDF, JPG, or PNG (max 10MB)
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {completedSteps.includes(2) && (
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => setCurrentStep(3)}
                            data-testid="button-continue-to-step-3"
                          >
                            Continue to Campaign Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Campaign Details */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Campaign Details
                  </CardTitle>
                  <CardDescription>
                    Define your fundraising campaign
                  </CardDescription>
                </CardHeader>
                <Form {...campaignForm}>
                  <form onSubmit={campaignForm.handleSubmit((data) => submitCampaignDetails.mutate(data))}>
                    <CardContent className="space-y-6">
                      <FormField
                        control={campaignForm.control}
                        name="title"
                        rules={{ required: "Campaign title is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Title *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-campaign-title" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={campaignForm.control}
                        name="description"
                        rules={{ required: "Description is required" }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={6} data-testid="input-campaign-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={campaignForm.control}
                          name="targetAmount"
                          rules={{ 
                            required: "Target amount is required",
                            min: { value: 100, message: "Minimum target is $100" }
                          }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Amount (USD) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  data-testid="input-target-amount"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={campaignForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Image URL</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-image-url" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={campaignForm.control}
                          name="startDate"
                          rules={{ required: "Start date is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-start-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={campaignForm.control}
                          name="endDate"
                          rules={{ required: "End date is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-end-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={campaignForm.control}
                        name="creditCardEnabled"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="rounded"
                                data-testid="checkbox-credit-card"
                              />
                              <FormLabel>Enable Credit Card Payments</FormLabel>
                            </div>
                            <p className="text-sm text-gray-500">
                              Allow donors to contribute using credit cards
                            </p>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        type="submit" 
                        disabled={submitCampaignDetails.isPending}
                        className="ml-auto"
                        data-testid="button-save-campaign-details"
                      >
                        {submitCampaignDetails.isPending ? "Saving..." : "Save & Continue"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Collateral Payment
                  </CardTitle>
                  <CardDescription>
                    Pay collateral to submit your fund for admin review
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!pendingFundId ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Please complete campaign details first
                      </p>
                      <Button 
                        onClick={() => setCurrentStep(3)}
                        className="mt-4"
                        data-testid="button-go-to-step-3"
                      >
                        Go to Step 3
                      </Button>
                    </div>
                  ) : collateralPaid ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-green-600 mb-2">
                        Payment Successful!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Your fund application has been submitted for admin review.
                        You will be notified once the review is complete.
                      </p>
                      <div className="space-y-2">
                        <Link to="/funds">
                          <Button className="mr-4" data-testid="button-view-funds">
                            View All Funds
                          </Button>
                        </Link>
                        <Link to="/profile">
                          <Button variant="outline" data-testid="button-view-profile">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-800 dark:text-amber-200">
                              Collateral Requirement
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              A refundable collateral of {collateralAmount} USDT is required.
                              This will be returned after successful campaign completion or if rejected.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Payment Details</h4>
                          <Badge variant="outline">Required</Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                            <span className="font-medium">{collateralAmount} USDT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">To:</span>
                            <span className="font-mono text-sm break-all">{platformWallet}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Network:</span>
                            <span>Ethereum Mainnet</span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleCollateralPayment}
                          disabled={isConfirming}
                          className="w-full mt-6"
                          data-testid="button-pay-collateral"
                        >
                          {isConfirming ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Confirming Payment...
                            </>
                          ) : (
                            <>
                              <Wallet className="h-4 w-4 mr-2" />
                              Pay {collateralAmount} USDT Collateral
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}