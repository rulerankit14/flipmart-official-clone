import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QrCode, Check, Copy, CheckCircle2 } from 'lucide-react';
import scanToPayIcon from '@/assets/scan-to-pay-icon.png';
import { useToast } from '@/hooks/use-toast';

interface ScanToPaymentProps {
  amount: number;
  qrCodeUrl: string;
  onPaymentConfirm: (utrNumber: string) => void;
  disabled?: boolean;
  upiId?: string;
  merchantName?: string;
}

const ScanToPayment: React.FC<ScanToPaymentProps> = ({
  amount,
  qrCodeUrl,
  onPaymentConfirm,
  disabled = false,
  upiId = 'merchant@paytm',
  merchantName = 'Flipkart',
}) => {
  const { toast } = useToast();
  const [showPaymentUI, setShowPaymentUI] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
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
        title: 'UPI ID Copied!',
        description: 'Paste it in your payment app',
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy manually: ' + upiId,
        variant: 'destructive',
      });
    }
  };

  const handleConfirmPayment = () => {
    if (utrNumber.trim().length < 6) {
      toast({
        title: 'Enter UTR Number',
        description: 'Please enter a valid UTR/Transaction number (min 6 digits)',
        variant: 'destructive',
      });
      return;
    }
    onPaymentConfirm(utrNumber);
  };

  if (showPaymentUI) {
    return (
      <Card className="mt-4">
        <CardContent className="p-4 space-y-4">
          {/* QR Code Section */}
          <div className="bg-gradient-to-b from-green-50 to-white rounded-lg p-4 text-center border border-green-100">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Scan QR Code to Pay</span>
            </div>

            <div className="bg-white p-3 rounded-lg inline-block mx-auto shadow-md border">
              <img
                src={qrCodeUrl}
                alt="Payment QR Code"
                className="w-48 h-48 object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/200x200?text=QR+Code';
                }}
              />
            </div>

            <p className="text-lg font-bold text-green-600 mt-3">
              ₹{amount.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-500">Scan with any UPI app</p>
          </div>

          {/* UPI ID Copy Section */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-xs text-gray-500 mb-2 text-center">Or copy UPI ID</p>
            <div className="flex items-center gap-2 bg-white rounded-lg p-2 border">
              <div className="flex-1 font-mono text-sm truncate text-gray-800 px-2">{upiId}</div>
              <Button variant="ghost" size="sm" onClick={copyUpiId} className="shrink-0">
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
            <Check className="h-5 w-5 mr-2" />I have completed the payment
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => {
              setShowPaymentUI(false);
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
    <Card className="mt-4">
      <CardContent className="p-0">
        {/* Offer Timer */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-3 text-center border-b">
          <p className="text-base">
            <span className="text-gray-700">🔥 Offer ends in </span>
            <span className="text-orange-600 font-bold text-lg">
              {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </p>
        </div>

        <div className="p-4">
          <button
            onClick={() => setShowPaymentUI(true)}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all"
            disabled={disabled}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={scanToPayIcon} alt="Scan To Pay" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-lg font-medium text-gray-800">Scan & Pay</span>
              <p className="text-xs text-gray-500">Works with any UPI app</p>
            </div>
            <div className="text-lg font-bold text-green-600">
              ₹{amount.toLocaleString('en-IN')}
            </div>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanToPayment;
