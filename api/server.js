import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_demo');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://demo.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'demo-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Order
app.post('/api/orders', async (req, res) => {
  try {
    const {
      items,
      subtotal,
      tax,
      kioskFee,
      total,
      customerName,
      customerPhone,
      deliveryLocation,
      paymentIntentId,
    } = req.body;

    // Generate order number
    const orderNumber = `WK${Date.now().toString().slice(-8)}`;

    // Try to save to Supabase if configured
    let orderId = orderNumber;
    if (supabaseUrl !== 'https://demo.supabase.co') {
      try {
        const { data, error } = await supabase.from('orders').insert({
          order_number: orderNumber,
          items: items,
          subtotal: subtotal,
          tax: tax,
          kiosk_fee: kioskFee,
          total: total,
          customer_name: customerName,
          customer_phone: customerPhone,
          delivery_location: deliveryLocation,
          payment_intent_id: paymentIntentId,
          status: 'pending',
        });

        if (error) console.error('Supabase error:', error);
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Format items for email
    const itemsList = items
      .map((item) => `- ${item.name} x${item.quantity} @ $${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'orders@walters-kitchen.local',
          to: 'walter@example.com',
          subject: `New Order #${orderNumber} - Walter's Kitchen Kiosk`,
          html: `
            <h1>New Kiosk Order</h1>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Phone:</strong> ${customerPhone}</p>
            <p><strong>Location:</strong> ${deliveryLocation}</p>
            
            <h2>Items:</h2>
            <pre>${itemsList}</pre>
            
            <h2>Order Summary:</h2>
            <p>Subtotal: $${subtotal.toFixed(2)}</p>
            <p>Kiosk Fee: $${kioskFee.toFixed(2)}</p>
            <p>Tax (8.25%): $${tax.toFixed(2)}</p>
            <p><strong>Total: $${total.toFixed(2)}</strong></p>
            
            <p>Payment Intent: ${paymentIntentId}</p>
          `,
        });
        console.log(`Email sent for order ${orderNumber}`);
      } catch (error) {
        console.error('Resend error:', error);
      }
    }

    res.json({
      orderNumber,
      success: true,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Order Status
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Try to fetch from Supabase if configured
    if (supabaseUrl !== 'https://demo.supabase.co') {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json(data);
    }

    res.json({ orderNumber, status: 'pending' });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.json({ received: true });
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log(`Payment succeeded: ${paymentIntent.id}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Walter's Kitchen API running on port ${PORT}`);
});
