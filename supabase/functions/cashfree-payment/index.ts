import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, orderId, orderAmount, customerName, customerEmail, customerPhone, returnUrl } = await req.json();
    
    const appId = Deno.env.get('CASHFREE_APP_ID');
    const secretKey = Deno.env.get('CASHFREE_SECRET_KEY');
    
    if (!appId || !secretKey) {
      console.error('Cashfree credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use production URL - change to sandbox for testing
    const baseUrl = 'https://api.cashfree.com/pg';
    // For sandbox testing, use: 'https://sandbox.cashfree.com/pg'

    if (action === 'create_order') {
      console.log('Creating Cashfree order:', { orderId, orderAmount, customerName, customerEmail, customerPhone });
      
      const orderPayload = {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: `cust_${Date.now()}`,
          customer_name: customerName || 'Customer',
          customer_email: customerEmail || 'customer@example.com',
          customer_phone: customerPhone || '9999999999',
        },
        order_meta: {
          return_url: returnUrl || `${req.headers.get('origin')}/checkout?order_id=${orderId}&status={order_status}`,
          notify_url: null,
        },
      };

      console.log('Order payload:', JSON.stringify(orderPayload));

      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': appId,
          'x-client-secret': secretKey,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();
      console.log('Cashfree response:', JSON.stringify(data));

      if (!response.ok) {
        console.error('Cashfree error:', data);
        return new Response(
          JSON.stringify({ error: data.message || 'Failed to create payment order', details: data }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          orderId: data.order_id,
          sessionId: data.payment_session_id,
          orderToken: data.order_token,
          cfOrderId: data.cf_order_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify_payment') {
      console.log('Verifying payment for order:', orderId);
      
      const response = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': appId,
          'x-client-secret': secretKey,
        },
      });

      const data = await response.json();
      console.log('Payment verification response:', JSON.stringify(data));

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to verify payment', details: data }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          orderStatus: data.order_status,
          paymentStatus: data.order_status === 'PAID' ? 'paid' : 'pending',
          cfOrderId: data.cf_order_id,
          orderAmount: data.order_amount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Edge function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
