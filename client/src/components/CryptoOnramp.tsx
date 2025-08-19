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
          background: 'linear-gradient(45deg, #00d4ff, #ff00ff)',
          color: '#000',
          fontFamily: "'Orbitron', monospace",
          fontSize: '0.9rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          padding: '12px 24px',
          borderRadius: '20px',
          border: 'none',
          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
          transition: 'all 0.3s ease'
        }}
        className="hover:scale-105"
        data-testid="button-buy-crypto"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        Kripto Satın Al
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md p-0" style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95), rgba(20, 20, 20, 0.95))',
          border: '2px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '20px',
          backdropFilter: 'blur(20px)',
          minHeight: '600px'
        }}>
          <DialogHeader className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: '#ffffff',
                fontFamily: "'Orbitron', monospace",
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
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
          
          <div className="p-6">
            {/* Step: Amount Selection */}
            {step === 'amount' && (
              <div className="space-y-6">
                {/* Wallet Info */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1))',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  borderRadius: '15px',
                  padding: '16px'
                }}>
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5" style={{ color: '#00ff88' }} />
                    <div>
                      <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: 0 }}>
                        Bağlı Cüzdan
                      </p>
                      <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
                        <code style={{ color: '#00d4ff', fontSize: '0.75rem' }}>{address}</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Satın Alınacak Miktar
                  </label>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    borderRadius: '12px',
                    padding: '12px',
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
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        outline: 'none',
                        flex: 1
                      }}
                    />
                    <span style={{ color: '#00ff88', fontSize: '0.9rem', fontWeight: '600' }}>
                      {targetCurrency}
                    </span>
                  </div>
                </div>

                {/* Continue Button */}
                <div 
                  onClick={() => setStep('payment')}
                  style={{
                    background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                    borderRadius: '15px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  className="hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span style={{ 
                      color: '#000000', 
                      fontSize: '1.1rem', 
                      fontWeight: '700',
                      fontFamily: "'Orbitron', monospace"
                    }}>
                      DEVAM ET
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Payment Method */}
            {step === 'payment' && (
              <div className="space-y-6">
                {/* Back Button */}
                <button 
                  onClick={() => setStep('amount')}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#00d4ff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>

                {/* Payment Method Selection */}
                <div>
                  <label style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '12px' }}>
                    Ödeme Yöntemi Seçin
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Credit Card */}
                    <div 
                      onClick={() => setSelectedPayment('card')}
                      style={{
                        background: selectedPayment === 'card' 
                          ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1))'
                          : 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
                        border: selectedPayment === 'card' 
                          ? '2px solid #00ff88'
                          : '2px solid rgba(0, 255, 136, 0.3)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      className="hover:scale-105"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <CreditCard className="w-5 h-5" style={{ color: '#00ff88' }} />
                        <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>
                          Kredi Kartı
                        </span>
                      </div>
                    </div>

                    {/* Bank Transfer */}
                    <div 
                      onClick={() => setSelectedPayment('bank')}
                      style={{
                        background: selectedPayment === 'bank'
                          ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.1))'
                          : 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))',
                        border: selectedPayment === 'bank'
                          ? '2px solid #00d4ff'
                          : '2px solid rgba(0, 212, 255, 0.3)',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      className="hover:scale-105"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Building2 className="w-5 h-5" style={{ color: '#00d4ff' }} />
                        <span style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '600' }}>
                          Banka Kartı
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Details Form */}
                {selectedPayment === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
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
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(0, 255, 136, 0.3)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          MM/YY
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                          placeholder="12/25"
                          maxLength={5}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(0, 255, 136, 0.3)',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#ffffff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
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
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(0, 255, 136, 0.3)',
                            borderRadius: '8px',
                            padding: '12px',
                            color: '#ffffff',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Kart Sahibi
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="JOHN DOE"
                        style={{
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(0, 255, 136, 0.3)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#ffffff',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Purchase Summary */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.1), rgba(0, 212, 255, 0.1))',
                  border: '1px solid rgba(255, 0, 255, 0.3)',
                  borderRadius: '15px',
                  padding: '16px'
                }}>
                  <h4 style={{ color: '#ff00ff', fontSize: '0.9rem', fontWeight: '600', margin: '0 0 8px 0' }}>
                    İşlem Özeti
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ color: '#888', fontSize: '0.8rem' }}>Miktar:</span>
                      <span style={{ color: '#ffffff', fontSize: '0.8rem' }}>${amount} → {amount} {targetCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#888', fontSize: '0.8rem' }}>Ödeme:</span>
                      <span style={{ color: '#ffffff', fontSize: '0.8rem' }}>
                        {selectedPayment === 'card' ? 'Kredi Kartı' : 'Banka Kartı'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#888', fontSize: '0.8rem' }}>Cüzdan:</span>
                      <span style={{ color: '#00d4ff', fontSize: '0.7rem' }}>
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <div 
                  onClick={handlePayment}
                  style={{
                    background: 'linear-gradient(135deg, #ff00ff, #00d4ff)',
                    borderRadius: '15px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    opacity: (selectedPayment === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name)) ? 0.5 : 1
                  }}
                  className="hover:scale-105"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <ShoppingCart className="w-5 h-5" style={{ color: '#000000' }} />
                    <span style={{ 
                      color: '#000000', 
                      fontSize: '1.1rem', 
                      fontWeight: '700',
                      fontFamily: "'Orbitron', monospace"
                    }}>
                      ${amount} ÖDE
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="space-y-6 text-center">
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 255, 0.1))',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '20px',
                  padding: '40px 20px'
                }}>
                  <div 
                    style={{
                      width: '60px',
                      height: '60px',
                      border: '4px solid rgba(0, 212, 255, 0.3)',
                      borderTop: '4px solid #00d4ff',
                      borderRadius: '50%',
                      margin: '0 auto 20px',
                      animation: 'spin 1s linear infinite'
                    }}
                  ></div>
                  
                  <h3 style={{ color: '#ffffff', fontSize: '1.2rem', fontWeight: '700', margin: '0 0 12px 0', fontFamily: "'Orbitron', monospace" }}>
                    İşlem İşleniyor
                  </h3>
                  
                  <p style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>
                    MoonPay üzerinden ödemeniz işleniyor...
                  </p>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <div className="space-y-6 text-center">
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  borderRadius: '20px',
                  padding: '40px 20px'
                }}>
                  <CheckCircle 
                    style={{ 
                      color: '#00ff88', 
                      width: '60px', 
                      height: '60px', 
                      margin: '0 auto 20px'
                    }} 
                  />
                  
                  <h3 style={{ color: '#00ff88', fontSize: '1.2rem', fontWeight: '700', margin: '0 0 12px 0', fontFamily: "'Orbitron', monospace" }}>
                    Başarılı!
                  </h3>
                  
                  <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: '0 0 8px 0' }}>
                    {amount} {targetCurrency} cüzdanınıza gönderildi
                  </p>
                  
                  <p style={{ color: '#888', fontSize: '0.8rem', margin: 0 }}>
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