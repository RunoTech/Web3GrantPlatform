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
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'bank'>('card');
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
        style={{
          background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
          color: '#ffffff',
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.85rem',
          fontWeight: '500',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          transition: 'all 0.2s ease'
        }}
        className="hover:opacity-90"
        data-testid="button-buy-crypto"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Kripto Satın Al
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg p-0" style={{
          background: 'linear-gradient(135deg, rgba(12, 12, 15, 0.98), rgba(18, 18, 25, 0.98))',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          maxHeight: '90vh',
          overflow: 'hidden'
        }} aria-describedby="crypto-onramp-description">
          <div id="crypto-onramp-description" className="sr-only">
            Kripto para satın alma formu
          </div>
          <DialogHeader className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <DialogTitle style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.02em'
              }}>
                Kripto Satın Al
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  padding: '8px'
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* Step: Amount Selection */}
            {step === 'amount' && (
              <div className="space-y-4">
                {/* Wallet Info */}
                <div style={{
                  background: 'rgba(0, 255, 136, 0.05)',
                  border: '1px solid rgba(0, 255, 136, 0.15)',
                  borderRadius: '12px',
                  padding: '14px'
                }}>
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-4 h-4" style={{ color: '#00d4ff' }} />
                    <div>
                      <p style={{ color: '#e5e5e5', fontSize: '0.85rem', margin: 0, fontWeight: '500' }}>
                        Bağlı Cüzdan
                      </p>
                      <p style={{ color: '#a0a0a0', fontSize: '0.75rem', margin: 0, marginTop: '2px' }}>
                        <code style={{ color: '#00d4ff', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                          {address?.slice(0, 8)}...{address?.slice(-6)}
                        </code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label style={{ color: '#e5e5e5', fontSize: '0.85rem', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                    Satın Alınacak Miktar
                  </label>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="100"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '500',
                        outline: 'none',
                        flex: 1,
                        fontFamily: "'Inter', sans-serif"
                      }}
                    />
                    <span style={{ color: '#00d4ff', fontSize: '0.85rem', fontWeight: '500' }}>
                      {targetCurrency}
                    </span>
                  </div>
                </div>

                {/* Continue Button */}
                <div 
                  onClick={() => setStep('payment')}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                    borderRadius: '10px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    marginTop: '20px'
                  }}
                  className="hover:opacity-90"
                >
                  <span style={{ 
                    color: '#ffffff', 
                    fontSize: '0.9rem', 
                    fontWeight: '600',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Devam Et
                  </span>
                </div>
              </div>
            )}

            {/* Step: Payment Method */}
            {step === 'payment' && (
              <div className="space-y-4">
                {/* Back Button */}
                <button 
                  onClick={() => setStep('amount')}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#0ea5e9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>

                {/* Payment Method Selection */}
                <div>
                  <label style={{ color: '#e5e5e5', fontSize: '0.85rem', fontWeight: '500', display: 'block', marginBottom: '10px' }}>
                    Ödeme Yöntemi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Credit Card */}
                    <div 
                      onClick={() => setSelectedPayment('card')}
                      style={{
                        background: selectedPayment === 'card' 
                          ? 'rgba(14, 165, 233, 0.15)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: selectedPayment === 'card' 
                          ? '1px solid #0ea5e9'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <CreditCard className="w-4 h-4" style={{ color: selectedPayment === 'card' ? '#0ea5e9' : '#a0a0a0' }} />
                        <span style={{ color: selectedPayment === 'card' ? '#e5e5e5' : '#a0a0a0', fontSize: '0.8rem', fontWeight: '500' }}>
                          Kredi Kartı
                        </span>
                      </div>
                    </div>

                    {/* Bank Transfer */}
                    <div 
                      onClick={() => setSelectedPayment('bank')}
                      style={{
                        background: selectedPayment === 'bank'
                          ? 'rgba(14, 165, 233, 0.15)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: selectedPayment === 'bank'
                          ? '1px solid #0ea5e9'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Building2 className="w-4 h-4" style={{ color: selectedPayment === 'bank' ? '#0ea5e9' : '#a0a0a0' }} />
                        <span style={{ color: selectedPayment === 'bank' ? '#e5e5e5' : '#a0a0a0', fontSize: '0.8rem', fontWeight: '500' }}>
                          Banka Kartı
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Details Form */}
                {selectedPayment === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label style={{ color: '#e5e5e5', fontSize: '0.75rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                        Kart Numarası
                      </label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          outline: 'none',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={{ color: '#e5e5e5', fontSize: '0.75rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                          Son Kullanma
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                          placeholder="12/25"
                          maxLength={5}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            outline: 'none',
                            fontFamily: "'Inter', sans-serif"
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#e5e5e5', fontSize: '0.75rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                          placeholder="123"
                          maxLength={4}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            outline: 'none',
                            fontFamily: "'Inter', sans-serif"
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#e5e5e5', fontSize: '0.75rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>
                        Kart Sahibi
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          outline: 'none',
                          fontFamily: "'Inter', sans-serif"
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Purchase Summary */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '14px'
                }}>
                  <h4 style={{ color: '#e5e5e5', fontSize: '0.8rem', fontWeight: '500', margin: '0 0 10px 0' }}>
                    İşlem Özeti
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>Miktar:</span>
                      <span style={{ color: '#e5e5e5', fontSize: '0.75rem' }}>${amount} → {amount} {targetCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>Ödeme:</span>
                      <span style={{ color: '#e5e5e5', fontSize: '0.75rem' }}>
                        {selectedPayment === 'card' ? 'Kredi Kartı' : 'Banka Kartı'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#a0a0a0', fontSize: '0.75rem' }}>Cüzdan:</span>
                      <span style={{ color: '#0ea5e9', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                        {address?.slice(0, 8)}...{address?.slice(-6)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <div 
                  onClick={handlePayment}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                    borderRadius: '10px',
                    padding: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    opacity: (selectedPayment === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name)) ? 0.5 : 1,
                    marginTop: '16px'
                  }}
                  className="hover:opacity-90"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ShoppingCart className="w-4 h-4" style={{ color: '#ffffff' }} />
                    <span style={{ 
                      color: '#ffffff', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      ${amount} Öde
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="space-y-4 text-center py-8">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '32px 20px'
                }}>
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(14, 165, 233, 0.3)',
                      borderTop: '3px solid #0ea5e9',
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      animation: 'spin 1s linear infinite'
                    }}
                  ></div>
                  
                  <h3 style={{ color: '#e5e5e5', fontSize: '1rem', fontWeight: '600', margin: '0 0 8px 0', fontFamily: "'Inter', sans-serif" }}>
                    İşlem İşleniyor
                  </h3>
                  
                  <p style={{ color: '#a0a0a0', fontSize: '0.8rem', margin: 0 }}>
                    Ödemeniz güvenli olarak işleniyor...
                  </p>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="space-y-4 text-center py-8">
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '12px',
                  padding: '32px 20px'
                }}>
                  <CheckCircle 
                    style={{ 
                      color: '#22c55e', 
                      width: '40px', 
                      height: '40px', 
                      margin: '0 auto 16px'
                    }} 
                  />
                  
                  <h3 style={{ color: '#22c55e', fontSize: '1rem', fontWeight: '600', margin: '0 0 8px 0', fontFamily: "'Inter', sans-serif" }}>
                    İşlem Başarılı
                  </h3>
                  
                  <p style={{ color: '#e5e5e5', fontSize: '0.85rem', margin: '0 0 6px 0' }}>
                    {amount} {targetCurrency} cüzdanınıza gönderildi
                  </p>
                  
                  <p style={{ color: '#a0a0a0', fontSize: '0.75rem', margin: 0 }}>
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