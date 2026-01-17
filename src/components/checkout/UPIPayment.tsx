import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, Check, Copy, CheckCircle2 } from 'lucide-react';
import phonePeLogo from '@/assets/phonepe-logo.png';
import phonePeBanner from '@/assets/phonepe-banner.webp';
import gpayLogo from '@/assets/gpay-logo.png';
import paytmLogo from '@/assets/paytm-logo.png';
import scanToPayIcon from '@/assets/scan-to-pay-icon.png';
import { useToast } from '@/hooks/use-toast';

interface UPIPaymentProps {
  amount: number;
  qrCodeUrl: string;
  onPaymentConfirm: (utrNumber: string, paymentMethod: string) => void;
  disabled?: boolean;
  buttonText?: string;
  upiId?: string;
  merchantName?: string;
}

const UPIPayment: React.FC<UPIPaymentProps> = ({ 
  amount, 
  qrCodeUrl, 
  onPaymentConfirm,
  disabled = false,
  buttonText,
  upiId = 'merchant@paytm',
  merchantName = 'Flipkart'
}) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [showPaymentUI, setShowPaymentUI] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 6, seconds: 12 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          return { minutes: 9, seconds: 59 };
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      toast({
        title: "UPI ID Copied!",
        description: "Paste it in your payment app",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy manually: " + upiId,
        variant: "destructive",
      });
    }
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setShowPaymentUI(true);
  };

  const handleConfirmPayment = () => {
    if (utrNumber.trim().length < 6 || !selectedMethod) {
      return;
    }
    onPaymentConfirm(utrNumber, selectedMethod);
  };

  if (showPaymentUI && selectedMethod) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4 space-y-4">
          {/* Selected method header */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <img 
              src={
                selectedMethod === 'PhonePe' ? phonePeLogo :
                selectedMethod === 'GPay' ? gpayLogo :
                selectedMethod === 'Paytm' ? paytmLogo :
                scanToPayIcon
              } 
              alt={selectedMethod} 
              className="w-10 h-10 object-contain"
            />
            <div>
              <p className="font-semibold text-gray-800">Pay via {selectedMethod}</p>
              <p className="text-lg font-bold text-primary">₹{amount.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-4 text-center border border-blue-100">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Scan & Pay</span>
            </div>
            
            <div className="bg-white p-3 rounded-lg inline-block mx-auto shadow-md border">
              <img 
                src={qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-52 h-52 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=QR+Code';
                }}
              />
            </div>
            
            <p className="text-sm text-gray-600 mt-3">
              Open <span className="font-medium">{selectedMethod}</span> → Scan QR → Complete payment
            </p>
          </div>

          {/* UPI ID Section */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-sm text-gray-600 mb-2 text-center">Or pay directly to UPI ID</p>
            <div className="flex items-center gap-2 bg-white rounded-lg p-3 border">
              <div className="flex-1 font-mono text-sm break-all text-gray-800">
                {upiId}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyUpiId}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Copy UPI ID → Open any UPI app → Send ₹{amount.toLocaleString('en-IN')}
            </p>
          </div>

          {/* UTR Input */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="utr" className="text-sm font-medium flex items-center gap-1">
              Enter UTR/Transaction Number after payment
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="utr"
              placeholder="Enter 12-digit UTR number"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="font-mono text-center text-lg tracking-wider"
            />
            <p className="text-xs text-muted-foreground">
              Find UTR in your payment app → Transaction history → Transaction details
            </p>
          </div>

          <Button 
            onClick={handleConfirmPayment} 
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
            disabled={disabled || utrNumber.trim().length < 6}
          >
            <Check className="h-5 w-5 mr-2" />
            I have completed the payment
          </Button>

          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={() => {
              setShowPaymentUI(false);
              setSelectedMethod(null);
              setUtrNumber('');
            }}
          >
            ← Choose different payment method
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Promotional Banner */}
      <div className="rounded-xl overflow-hidden shadow-md">
        <img 
          src={phonePeBanner} 
          alt="Get 20% Cashback when you pay with PhonePe UPI" 
          className="w-full h-auto"
        />
      </div>

      {/* Offer Timer */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="py-3 text-center">
          <p className="text-base">
            <span className="text-gray-700">🔥 Offer ends in </span>
            <span className="text-orange-600 font-bold">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardContent className="p-0">
          <p className="text-sm font-medium text-gray-500 px-4 pt-3 pb-2">Select Payment App</p>
          
          {/* Scan To Pay - Primary Option */}
          <button
            onClick={() => handleMethodSelect('Scan To Pay')}
            className={`w-full flex items-center gap-4 p-4 border-b transition-colors ${
              selectedMethod === 'Scan To Pay' ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
            }`}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-2">
              <img src={scanToPayIcon} alt="Scan To Pay" className="w-10 h-10 object-contain" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-lg font-medium text-gray-800">Scan & Pay (Any UPI App)</span>
              <p className="text-xs text-green-600 font-medium">✓ Recommended</p>
            </div>
            {selectedMethod === 'Scan To Pay' && <Check className="h-5 w-5 text-blue-600" />}
          </button>

          {/* PhonePe Option */}
          <button
            onClick={() => handleMethodSelect('PhonePe')}
            className={`w-full flex items-center gap-4 p-4 border-b transition-colors ${
              selectedMethod === 'PhonePe' ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
            }`}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={phonePeLogo} alt="PhonePe" className="w-12 h-12 object-cover" />
            </div>
            <span className="flex-1 text-left text-lg font-medium text-gray-800">PhonePe</span>
            {selectedMethod === 'PhonePe' && <Check className="h-5 w-5 text-blue-600" />}
          </button>

          {/* GPay Option */}
          <button
            onClick={() => handleMethodSelect('GPay')}
            className={`w-full flex items-center gap-4 p-4 border-b transition-colors ${
              selectedMethod === 'GPay' ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
            }`}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-white">
              <img src={gpayLogo} alt="Google Pay" className="w-10 h-10 object-contain" />
            </div>
            <span className="flex-1 text-left text-lg font-medium text-gray-800">Google Pay</span>
            {selectedMethod === 'GPay' && <Check className="h-5 w-5 text-blue-600" />}
          </button>

          {/* Paytm Option */}
          <button
            onClick={() => handleMethodSelect('Paytm')}
            className={`w-full flex items-center gap-4 p-4 transition-colors ${
              selectedMethod === 'Paytm' ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
            }`}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-gray-200">
              <img src={paytmLogo} alt="Paytm" className="w-10 h-6 object-contain" />
            </div>
            <span className="flex-1 text-left text-lg font-medium text-gray-800">Paytm</span>
            {selectedMethod === 'Paytm' && <Check className="h-5 w-5 text-blue-600" />}
          </button>
        </CardContent>
      </Card>

      {/* Price Details */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Price Details</h3>
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-green-600">₹{amount.toLocaleString('en-IN')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Button 
        className="w-full bg-[#ffc107] hover:bg-[#e5ac00] text-gray-900 font-semibold py-6 text-lg shadow-lg"
        disabled={disabled || !selectedMethod}
        onClick={() => selectedMethod && handleMethodSelect(selectedMethod)}
      >
        {buttonText || 'Continue to Pay'}
      </Button>
    </div>
  );
};

export default UPIPayment;
