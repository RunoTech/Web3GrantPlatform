import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Lock, ArrowLeft, Loader2, AlertCircle, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { validateCard, formatCardNumber, formatExpiryDate, getBinInfo, type CardBrand } from '@/lib/payments';
import { Link, useLocation } from 'wouter';

// Form validation schema
const virtualPosSchema = z.object({
  cardNumber: z.string().min(12, 'Kart numarası en az 12 haneli olmalıdır'),
  cardHolder: z.string().min(2, 'Kart sahibi adı gereklidir'),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, 'MM/YY formatında giriniz'),
  cvv: z.string().min(3, 'CVV en az 3 haneli olmalıdır'),
  amount: z.number().min(1, 'Tutar 1$ den fazla olmalıdır'),
});

type VirtualPosForm = z.infer<typeof virtualPosSchema>;

interface ProcessingState {
  isProcessing: boolean;
  stage: 'validating' | 'authorizing' | 'processing' | 'completed';
  progress: number;
}

interface PaymentError {
  code: string;
  message: string;
  details?: string;
}

export default function VirtualPosPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cardBrand, setCardBrand] = useState<CardBrand | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    stage: 'validating',
    progress: 0,
  });
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);

  const form = useForm<VirtualPosForm>({
    resolver: zodResolver(virtualPosSchema),
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      amount: 500, // Fixed amount as requested
    },
  });

  // Real-time card brand detection
  const handleCardNumberChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 6) {
      const brand = getBinInfo(cleanValue);
      setCardBrand({
        name: brand.brand as any,
        cvvLength: brand.cvvLength,
        cardLengths: [],
        color: brand.brand === 'visa' ? '#1A1F71' : brand.brand === 'mastercard' ? '#EB001B' : '#006FCF',
      });
    } else {
      setCardBrand(null);
    }
    
    // Format with spaces every 4 digits
    const formattedValue = formatCardNumber(cleanValue);
    form.setValue('cardNumber', formattedValue);
  };

  // Handle expiry date formatting
  const handleExpiryChange = (value: string) => {
    const formattedValue = formatExpiryDate(value);
    form.setValue('expiryDate', formattedValue);
  };

  // Simulate payment processing with 5-second delay
  const simulateProcessing = async (): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const stages = ['validating', 'authorizing', 'processing', 'completed'] as const;
      let currentStageIndex = 0;

      setProcessingState({
        isProcessing: true,
        stage: stages[0],
        progress: 0,
      });

      const interval = setInterval(() => {
        progress += 20;
        
        if (progress >= 100) {
          setProcessingState({
            isProcessing: false,
            stage: 'completed',
            progress: 100,
          });
          clearInterval(interval);
          resolve();
        } else {
          // Update stage every 25% progress
          const newStageIndex = Math.floor(progress / 25);
          if (newStageIndex < stages.length) {
            currentStageIndex = newStageIndex;
          }
          
          setProcessingState({
            isProcessing: true,
            stage: stages[currentStageIndex],
            progress,
          });
        }
      }, 1000); // 1 second intervals for 5 total seconds
    });
  };

  const onSubmit = async (data: VirtualPosForm) => {
    setPaymentError(null);
    
    // Client-side validation using our payment utilities
    const [month, year] = data.expiryDate.split('/');
    const validation = validateCard(
      data.cardNumber.replace(/\s/g, ''),
      month,
      year,
      data.cvv
    );

    if (!validation.isValid) {
      toast({
        title: 'Kart Bilgileri Hatalı',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Start processing simulation
      await simulateProcessing();

      // Always return insufficient balance error as requested
      setPaymentError({
        code: 'INSUFFICIENT_FUNDS',
        message: 'Bakiye Yetersiz',
        details: 'Kartınızda yeterli bakiye bulunmamaktadır. Lütfen başka bir kart deneyin veya bakiyenizi kontrol edin.',
      });

      toast({
        title: 'Ödeme Başarısız',
        description: 'Bakiye yetersiz - işlem gerçekleştirilemedi',
        variant: 'destructive',
      });

    } catch (error) {
      setPaymentError({
        code: 'PROCESSING_ERROR',
        message: 'İşlem Hatası',
        details: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      });
    }
  };

  const getProcessingStageText = (stage: ProcessingState['stage']) => {
    switch (stage) {
      case 'validating': return 'Kart bilgileri doğrulanıyor...';
      case 'authorizing': return 'Banka ile bağlantı kuruluyor...';
      case 'processing': return 'Ödeme işleniyor...';
      case 'completed': return 'İşlem tamamlandı';
      default: return 'İşleniyor...';
    }
  };

  const getBrandIcon = (brandName: string) => {
    switch (brandName) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      case 'discover': return '💳';
      default: return '💳';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header currentPage="payment" />

      <div className="container-main section-spacing-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation('/payment')}
              className="mr-auto"
              data-testid="button-back-to-payment"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sanal POS Sistemi
          </h1>
          <p className="text-muted-foreground">
            Güvenli kredi kartı ödeme sistemi - Test Ortamı
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Payment Amount Card */}
          <Card className="card-standard mb-6">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Building className="w-5 h-5 mr-2 text-primary" />
                <span className="font-semibold">DUXXAN Platform</span>
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                $500.00 USD
              </CardTitle>
              <CardDescription>
                Hesap Aktivasyon Ücreti
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Payment Form */}
          <Card className="card-standard">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="w-5 h-5 mr-2 text-primary" />
                Kart Bilgileri
              </CardTitle>
              <CardDescription>
                Güvenli SSL şifreleme ile korunmaktadır
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                              maxLength={23} // Including spaces
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
                            placeholder="JOHN DOE"
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
                        $500.00 Öde
                      </>
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="text-center text-xs text-muted-foreground">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Bu test ortamıdır. Gerçek ödeme işlemi yapılmaz.
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Test Information */}
          <Card className="card-standard mt-6 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Test Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Bu bir test sistemidir.</strong> Herhangi bir geçerli kart numarası girebilirsiniz.
              </p>
              <p>
                Sistem BIN kontrolü, CVV doğrulaması ve Luhn algoritması ile kart doğrulaması yapar, 
                ancak 5 saniye sonra her zaman "Bakiye Yetersiz" hatası döndürür.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}