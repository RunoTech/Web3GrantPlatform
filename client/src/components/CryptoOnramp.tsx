import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  CreditCard, 
  X,
  Wallet,
  Building2,
  ShoppingCart,
  Settings,
  CheckCircle,
  ArrowLeft
} from "lucide-react";

interface CryptoOnrampProps {
  targetAmount?: number;
  targetCurrency?: 'USDT' | 'USDC' | 'ETH' | 'BNB';
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export default function CryptoOnramp({ 
  targetAmount = 100, 
  targetCurrency = 'USDT',
  onSuccess,
  onError 
}: CryptoOnrampProps) {
  const { address, isConnected } = useWallet();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(targetAmount);
  const [step, setStep] = useState<'amount' | 'payment' | 'processing' | 'success'>('amount');
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'bank' | 'google-pay' | 'apple-pay'>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const openCryptoOnramp = () => {
    if (!isConnected || !address) {
      onError?.('Lütfen önce cüzdanınızı bağlayın');
      return;
    }
    setIsOpen(true);
    setStep('amount');
  };

  // Process payment with MoonPay
  const handlePayment = async () => {
    if (!import.meta.env.VITE_MOONPAY_API_KEY) {
      onError?.('MoonPay API key not configured');
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      // Simulate MoonPay API call with our backend
      const response = await fetch('/api/moonpay-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'USD',
          targetCurrency: targetCurrency.toLowerCase(),
          walletAddress: address,
          paymentMethod: selectedPayment,
          cardDetails: selectedPayment === 'card' ? cardDetails : undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        setStep('success');
        setTimeout(() => {
          onSuccess?.(result.transactionId);
          setIsOpen(false);
          resetForm();
        }, 3000);
      } else {
        onError?.(result.error || 'Payment failed');
        setStep('payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError?.('Payment processing error');
      setStep('payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep('amount');
    setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
    setSelectedPayment('card');
    setIsProcessing(false);
  };

  return (
    <>
      <Button 
        onClick={openCryptoOnramp}
        disabled={!isConnected}
        className="bg-binance-yellow hover:bg-yellow-400 text-black font-medium text-sm px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50"
        data-testid="button-buy-crypto"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {t('crypto.buy_crypto')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0 bg-background border border-border rounded-lg shadow-binance" aria-describedby="crypto-onramp-description">
          <div id="crypto-onramp-description" className="sr-only">
            Kripto para satın alma formu
          </div>
          <DialogHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold text-foreground">
                {t('crypto.buy_crypto_with_card')}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-4">
            {/* Step: Amount Selection */}
            {step === 'amount' && (
              <div className="space-y-4">
                {/* Wallet Info */}
                <div className="bg-muted border border-border rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-4 h-4 text-binance-yellow" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Bağlı Cüzdan
                      </p>
                      <code className="text-xs text-muted-foreground font-mono">
                        {address?.slice(0, 8)}...{address?.slice(-6)}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Satın Alınacak Miktar
                  </label>
                  <div className="flex items-center bg-input border border-border rounded-lg p-3">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="100"
                      className="bg-transparent border-none text-foreground text-base font-medium outline-none flex-1"
                    />
                    <span className="text-binance-yellow text-sm font-medium">
                      {targetCurrency}
                    </span>
                  </div>
                </div>

                {/* Continue Button */}
                <Button 
                  onClick={() => setStep('payment')}
                  className="w-full bg-binance-yellow hover:bg-yellow-400 text-black font-medium py-3 mt-4"
                >
                  Devam Et
                </Button>
              </div>
            )}

            {/* Step: Payment Method */}
            {step === 'payment' && (
              <div className="space-y-4">
                {/* Back Button */}
                <button 
                  onClick={() => setStep('amount')}
                  className="flex items-center gap-2 text-binance-yellow hover:text-yellow-400 text-sm font-medium cursor-pointer bg-transparent border-none p-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>

                {/* Payment Method Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-3">
                    Ödeme Yöntemi
                  </label>
                  
                  {/* Quick Payment Options */}
                  <div className="space-y-3 mb-4">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Hızlı Ödeme
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Google Pay */}
                      <div 
                        onClick={() => setSelectedPayment('google-pay')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedPayment === 'google-pay' 
                            ? 'border-binance-yellow bg-binance-yellow/10' 
                            : 'border-border bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <div className={`w-4 h-4 rounded ${selectedPayment === 'google-pay' ? 'bg-binance-yellow' : 'bg-muted-foreground'}`}>
                            <span className="text-[8px] font-bold text-black flex items-center justify-center h-full">G</span>
                          </div>
                          <span className={`text-sm font-medium ${selectedPayment === 'google-pay' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Google Pay
                          </span>
                        </div>
                      </div>

                      {/* Apple Pay */}
                      <div 
                        onClick={() => setSelectedPayment('apple-pay')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedPayment === 'apple-pay'
                            ? 'border-binance-yellow bg-binance-yellow/10'
                            : 'border-border bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <div className={`w-4 h-4 rounded ${selectedPayment === 'apple-pay' ? 'bg-binance-yellow' : 'bg-muted-foreground'}`}>
                            <span className="text-[8px] font-bold text-black flex items-center justify-center h-full">🍎</span>
                          </div>
                          <span className={`text-sm font-medium ${selectedPayment === 'apple-pay' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Apple Pay
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Traditional Payment Options */}
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Geleneksel Ödeme
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {/* Credit Card */}
                      <div 
                        onClick={() => setSelectedPayment('card')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedPayment === 'card' 
                            ? 'border-binance-yellow bg-binance-yellow/10' 
                            : 'border-border bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <CreditCard className={`w-4 h-4 ${selectedPayment === 'card' ? 'text-binance-yellow' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${selectedPayment === 'card' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Kredi Kartı
                          </span>
                        </div>
                      </div>

                      {/* Bank Transfer */}
                      <div 
                        onClick={() => setSelectedPayment('bank')}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedPayment === 'bank'
                            ? 'border-binance-yellow bg-binance-yellow/10'
                            : 'border-border bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Building2 className={`w-4 h-4 ${selectedPayment === 'bank' ? 'text-binance-yellow' : 'text-muted-foreground'}`} />
                          <span className={`text-sm font-medium ${selectedPayment === 'bank' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Banka Kartı
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Payment Processing */}
                {(selectedPayment === 'google-pay' || selectedPayment === 'apple-pay') && (
                  <div className="space-y-4">
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <div>
                          <p className="text-sm font-medium text-success">
                            {selectedPayment === 'google-pay' ? 'Google Pay' : 'Apple Pay'} Hazır
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Kayıtlı kartınız kullanılacak
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-muted border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Kart:</span>
                        <span className="text-foreground font-medium">**** 1234 (Varsayılan)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Details Form */}
                {selectedPayment === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">
                        Kart Numarası
                      </label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full bg-input border border-border rounded-lg p-3 text-foreground text-sm outline-none focus:border-binance-yellow transition-colors"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-2">
                          Son Kullanma
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                          placeholder="12/25"
                          maxLength={5}
                          className="w-full bg-input border border-border rounded-lg p-3 text-foreground text-sm outline-none focus:border-binance-yellow transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                          placeholder="123"
                          maxLength={4}
                          className="w-full bg-input border border-border rounded-lg p-3 text-foreground text-sm outline-none focus:border-binance-yellow transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">
                        Kart Sahibi
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full bg-input border border-border rounded-lg p-3 text-foreground text-sm outline-none focus:border-binance-yellow transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Purchase Summary */}
                <div className="bg-muted border border-border rounded-lg p-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    İşlem Özeti
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Miktar:</span>
                      <span className="text-xs text-foreground font-medium">${amount} → {amount} {targetCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Ödeme:</span>
                      <span className="text-xs text-foreground font-medium">
                        {selectedPayment === 'card' ? 'Kredi Kartı' : 
                         selectedPayment === 'bank' ? 'Banka Kartı' :
                         selectedPayment === 'google-pay' ? 'Google Pay' : 
                         selectedPayment === 'apple-pay' ? 'Apple Pay' : 'Seçilmedi'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Cüzdan:</span>
                      <code className="text-xs text-binance-yellow font-mono">
                        {address?.slice(0, 8)}...{address?.slice(-6)}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={selectedPayment === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name)}
                  className="w-full bg-binance-yellow hover:bg-yellow-400 text-black font-medium py-3 mt-4 disabled:opacity-50"
                >
                  {selectedPayment === 'google-pay' ? (
                    <>
                      <div className="w-4 h-4 mr-2 bg-black rounded text-white flex items-center justify-center text-[8px] font-bold">G</div>
                      ${amount} ile Öde
                    </>
                  ) : selectedPayment === 'apple-pay' ? (
                    <>
                      <span className="mr-2">🍎</span>
                      ${amount} ile Öde
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      ${amount} Öde
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="bg-muted border border-border rounded-lg p-8">
                  <div className="w-8 h-8 border-2 border-muted-foreground border-t-binance-yellow rounded-full animate-spin mx-auto mb-4"></div>
                  
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    İşlem İşleniyor
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    Ödemeniz güvenli olarak işleniyor...
                  </p>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="bg-success/10 border border-success/20 rounded-lg p-8">
                  <CheckCircle className="w-10 h-10 text-success mx-auto mb-4" />
                  
                  <h3 className="text-base font-semibold text-success mb-2">
                    İşlem Başarılı
                  </h3>
                  
                  <p className="text-sm text-foreground mb-1">
                    {amount} {targetCurrency} cüzdanınıza gönderildi
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    Bu pencere otomatik kapanacak...
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}