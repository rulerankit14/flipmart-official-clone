import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, Check, Copy, CheckCircle2, ExternalLink, Smartphone } from 'lucide-react';
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

// UPI app configurations with deep link schemes
const UPI_APPS = {
  PhonePe: {
    name: 'PhonePe',
    logo: null as string | null, // Will be set from import
    scheme: 'phonepe://pay',
    package: 'com.phonepe.app',
    iosScheme: 'phonepe://pay',
  },
  GPay: {
    name: 'Google Pay',
    logo: null as string | null,
    scheme: 'tez://upi/pay',
    package: 'com.google.android.apps.nbu.paisa.user',
    iosScheme: 'gpay://upi/pay',
  },
  Paytm: {
    name: 'Paytm',
    logo: null as string | null,
    scheme: 'paytmmp://pay',
    package: 'net.one97.paytm',
    iosScheme: 'paytm://pay',
  },
};

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
  const [appLaunched, setAppLaunched] = useState(false);

  // Set logos
  UPI_APPS.PhonePe.logo = phonePeLogo;
  UPI_APPS.GPay.logo = gpayLogo;
  UPI_APPS.Paytm.logo = paytmLogo;

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

  // Check if mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const isAndroid = () => /Android/i.test(navigator.userAgent);
  const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Generate UPI payment link
  const generateUPILink = (appScheme?: string) => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: encodeURIComponent(merchantName),
      am: amount.toFixed(2),
      cu: 'INR',
      tn: encodeURIComponent(`Payment to ${merchantName}`),
    });
    
    const scheme = appScheme || 'upi';
    return `${scheme}://pay?${params.toString()}`;
  };

  // Generate Android intent URL
  const generateAndroidIntent = (packageName: string) => {
    const upiParams = new URLSearchParams({
      pa: upiId,
      pn: merchantName,
      am: amount.toFixed(2),
      cu: 'INR',
      tn: `Payment to ${merchantName}`,
    });
    
    return `intent://pay?${upiParams.toString()}#Intent;scheme=upi;package=${packageName};end`;
  };

  // Open UPI app
  const openUPIApp = (appKey: string) => {
    const app = UPI_APPS[appKey as keyof typeof UPI_APPS];
    
    if (!app) {
      // Generic UPI link for "Scan To Pay"
      const genericLink = generateUPILink('upi');
      window.location.href = genericLink;
      return;
    }

    if (isAndroid()) {
      // Try Android intent first (more reliable)
      const intentUrl = generateAndroidIntent(app.package);
      
      // Create an anchor and click it
      const link = document.createElement('a');
      link.href = intentUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback to generic UPI after delay
      setTimeout(() => {
        window.location.href = generateUPILink('upi');
      }, 500);
      
    } else if (isIOS()) {
      // iOS - try app-specific scheme
      window.location.href = generateUPILink(app.iosScheme.split('://')[0]);
      
    } else {
      // Desktop - just show QR
      toast({
        title: "Open on mobile",
        description: "UPI apps work on mobile devices. Please scan the QR code.",
      });
    }
  };

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
  };

  const handleOpenApp = () => {
    if (!selectedMethod) return;
    
    setAppLaunched(true);
    setShowPaymentUI(true);
    
    if (selectedMethod !== 'Scan To Pay' && isMobile()) {
      openUPIApp(selectedMethod);
      toast({
        title: `Opening ${selectedMethod}...`,
        description: "Complete payment in the app",
      });
    } else {
      // Just show QR for Scan To Pay or desktop
      setShowPaymentUI(true);
    }
  };

  const handleConfirmPayment = () => {
    if (utrNumber.trim().length < 6 || !selectedMethod) {
      toast({
        title: "Enter UTR Number",
        description: "Please enter a valid UTR/Transaction number (min 6 digits)",
        variant: "destructive",
      });
      return;
    }
    onPaymentConfirm(utrNumber, selectedMethod);
  };

  // Payment UI after app selection
  if (showPaymentUI && selectedMethod) {
    const appConfig = UPI_APPS[selectedMethod as keyof typeof UPI_APPS];
    
    return (
      <Card className="mt-4">
        <CardContent className="p-4 space-y-4">
          {/* App Launched Banner */}
          {appLaunched && selectedMethod !== 'Scan To Pay' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <Smartphone className="h-5 w-5" />
                <span className="font-medium">{selectedMethod} app opened!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Complete the payment in the app, then enter UTR below
              </p>
              
              {/* Retry button */}
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-green-700 border-green-300"
                onClick={() => openUPIApp(selectedMethod)}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open {selectedMethod} again
              </Button>
            </div>
          )}

          {/* QR Code Section */}
          <div className="bg-gradient-to-b from-blue-50 to-white rounded-lg p-4 text-center border border-blue-100">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">
                {appLaunched && selectedMethod !== 'Scan To Pay' 
                  ? 'Or Scan QR Code' 
                  : 'Scan QR Code to Pay'}
              </span>
            </div>
            
            <div className="bg-white p-3 rounded-lg inline-block mx-auto shadow-md border">
              <img 
                src={qrCodeUrl} 
                alt="Payment QR Code" 
                className="w-48 h-48 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=QR+Code';
                }}
              />
            </div>
            
            <p className="text-lg font-bold text-green-600 mt-3">
              ₹{amount.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-500">
              Scan with any UPI app
            </p>
          </div>

          {/* UPI ID Copy Section */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-xs text-gray-500 mb-2 text-center">Or copy UPI ID</p>
            <div className="flex items-center gap-2 bg-white rounded-lg p-2 border">
              <div className="flex-1 font-mono text-sm truncate text-gray-800 px-2">
                {upiId}
              </div>
              <Button
                variant="ghost"
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
          </div>

          {/* UTR Input */}
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="utr" className="text-sm font-semibold flex items-center gap-1">
              Enter UTR/Transaction Number
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="utr"
              placeholder="Enter 12-digit UTR number"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
              className="font-mono text-center text-lg tracking-widest"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              Find UTR in: App → Transaction History → Payment Details
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
              setAppLaunched(false);
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
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardContent className="py-3 text-center">
          <p className="text-base">
            <span className="text-gray-700">🔥 Offer ends in </span>
            <span className="text-orange-600 font-bold text-lg">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <Card>
        <CardContent className="p-0">
          <p className="text-sm font-medium text-gray-500 px-4 pt-3 pb-2">Select Payment App</p>
          
          {/* PhonePe Option */}
          <button
            onClick={() => handleMethodSelect('PhonePe')}
            className={`w-full flex items-center gap-4 p-4 border-b transition-all ${
              selectedMethod === 'PhonePe' 
                ? 'bg-purple-50 border-l-4 border-l-purple-500' 
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
            }`}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={phonePeLogo} alt="PhonePe" className="w-12 h-12 object-cover" />
            </div>
            <span className="flex-1 text-left text-lg font-medium text-gray-800">PhonePe</span>
            {selectedMethod === 'PhonePe' && <Check className="h-5 w-5 text-purple-600" />}
          </button>

          {/* GPay Option */}
          <button
            onClick={() => handleMethodSelect('GPay')}
            className={`w-full flex items-center gap-4 p-4 border-b transition-all ${
              selectedMethod === 'GPay' 
                ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
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
            className={`w-full flex items-center gap-4 p-4 border-b transition-all ${
              selectedMethod === 'Paytm' 
                ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
            }`}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-gray-200">
              <img src={paytmLogo} alt="Paytm" className="w-10 h-6 object-contain" />
            </div>
            <span className="flex-1 text-left text-lg font-medium text-gray-800">Paytm</span>
            {selectedMethod === 'Paytm' && <Check className="h-5 w-5 text-blue-500" />}
          </button>

          {/* Scan To Pay Option */}
          <button
            onClick={() => handleMethodSelect('Scan To Pay')}
            className={`w-full flex items-center gap-4 p-4 transition-all ${
              selectedMethod === 'Scan To Pay' 
                ? 'bg-green-50 border-l-4 border-l-green-500' 
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
            }`}
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={scanToPayIcon} alt="Scan To Pay" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-lg font-medium text-gray-800">Scan & Pay</span>
              <p className="text-xs text-gray-500">Works with any UPI app</p>
            </div>
            {selectedMethod === 'Scan To Pay' && <Check className="h-5 w-5 text-green-600" />}
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
        className="w-full bg-[#ffc107] hover:bg-[#e5ac00] text-gray-900 font-semibold py-6 text-lg shadow-lg disabled:opacity-50"
        disabled={disabled || !selectedMethod}
        onClick={handleOpenApp}
      >
        {selectedMethod ? (
          <>
            <ExternalLink className="h-5 w-5 mr-2" />
            {selectedMethod === 'Scan To Pay' ? 'Continue' : `Open ${selectedMethod}`}
          </>
        ) : (
          buttonText || 'Select Payment Method'
        )}
      </Button>
    </div>
  );
};

export default UPIPayment;
