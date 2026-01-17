import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CashfreePaymentProps {
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentFailure: (error: string) => void;
  disabled?: boolean;
}

const CashfreePayment: React.FC<CashfreePaymentProps> = ({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
  onPaymentFailure,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create order via edge function
      const { data, error } = await supabase.functions.invoke('cashfree-payment', {
        body: {
          action: 'create_order',
          orderId: `order_${orderId}_${Date.now()}`,
          orderAmount: amount,
          customerName,
          customerEmail,
          customerPhone,
          returnUrl: `${window.location.origin}/checkout?cf_order_id={order_id}&status={order_status}`,
        },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Failed to create payment');

      console.log('Cashfree order created:', data);

      // Load Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: data.sessionId,
        redirectTarget: '_self',
      };

      // @ts-ignore - Cashfree SDK loaded from script
      if (window.Cashfree) {
        // @ts-ignore
        const cashfree = window.Cashfree({ mode: 'production' }); // Change to 'sandbox' for testing
        cashfree.checkout(checkoutOptions);
      } else {
        // Fallback: redirect to payment link
        toast({
          title: 'Redirecting to payment...',
          description: 'Please complete payment on Cashfree',
        });
        
        // If SDK not loaded, we need to load it
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.onload = () => {
          // @ts-ignore
          const cashfree = window.Cashfree({ mode: 'production' });
          cashfree.checkout(checkoutOptions);
        };
        document.body.appendChild(script);
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
      onPaymentFailure(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-600 rounded-lg p-2">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Cashfree Payment Gateway</h3>
              <p className="text-sm text-gray-500">UPI, Cards, Netbanking & Wallets</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Secure payment powered by Cashfree</span>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount to Pay</span>
              <span className="text-2xl font-bold text-green-600">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg font-semibold"
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Pay ₹{amount.toLocaleString('en-IN')} with Cashfree
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          You will be redirected to Cashfree's secure payment page
        </p>
      </CardContent>
    </Card>
  );
};

export default CashfreePayment;
