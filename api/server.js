import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseUrl ? createClient(supabaseUrl, supabaseKey) : null;

// Admin auth middleware
const adminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase: !!supabase });
});

// ============ MENU ENDPOINTS ============

// Get full menu (public)
app.get('/api/menu', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Get categories
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order');

    if (catError) throw catError;

    // Get items
    const { data: items, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('sort_order');

    if (itemError) throw itemError;

    // Group items by category
    const menuData = {};
    categories.forEach(cat => {
      menuData[cat.name] = items
        .filter(item => item.category_id === cat.id)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          description: item.description,
        }));
    });

    res.json(menuData);
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

// ============ ADMIN MENU ENDPOINTS ============

// Get all categories (admin)
app.get('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
app.post('/api/admin/categories', adminAuth, async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({ name, sort_order: sort_order || 0 })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Category create error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
app.put('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;
    const { data, error } = await supabase
      .from('menu_categories')
      .update({ name, sort_order })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/admin/categories/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Category delete error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get all items (admin - includes unavailable)
app.get('/api/admin/items', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, menu_categories(name)')
      .order('sort_order');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Items fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Create item
app.post('/api/admin/items', adminAuth, async (req, res) => {
  try {
    const { category_id, name, price, description, available, sort_order } = req.body;
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        category_id,
        name,
        price,
        description,
        available: available !== false,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Item create error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update item
app.put('/api/admin/items/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, price, description, available, sort_order } = req.body;
    const { data, error } = await supabase
      .from('menu_items')
      .update({ category_id, name, price, description, available, sort_order })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Item update error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
app.delete('/api/admin/items/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Item delete error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// ============ SETTINGS ENDPOINTS ============

// Get settings (admin)
app.get('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kiosk_settings')
      .select('*');

    if (error) throw error;

    // Convert to object
    const settings = {};
    data.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update setting
app.put('/api/admin/settings/:key', adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { data, error } = await supabase
      .from('kiosk_settings')
      .upsert({ setting_key: key, setting_value: value })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Setting update error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ============ STRIPE CONNECT ENDPOINTS ============

// Create Stripe Connect account link (for onboarding)
app.post('/api/admin/stripe/connect', adminAuth, async (req, res) => {
  try {
    const { return_url } = req.body;

    // Check if we already have a connected account
    const { data: settings } = await supabase
      .from('kiosk_settings')
      .select('setting_value')
      .eq('setting_key', 'stripe_connected_account_id')
      .single();

    let accountId = settings?.setting_value;

    // Create new account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      // Save account ID
      await supabase
        .from('kiosk_settings')
        .upsert({ setting_key: 'stripe_connected_account_id', setting_value: accountId });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: return_url,
      return_url: return_url,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url, accountId });
  } catch (error) {
    console.error('Stripe Connect error:', error);
    res.status(500).json({ error: 'Failed to create Stripe Connect link' });
  }
});

// Check Stripe Connect status
app.get('/api/admin/stripe/status', adminAuth, async (req, res) => {
  try {
    const { data: settings } = await supabase
      .from('kiosk_settings')
      .select('setting_value')
      .eq('setting_key', 'stripe_connected_account_id')
      .single();

    if (!settings?.setting_value) {
      return res.json({ connected: false });
    }

    const account = await stripe.accounts.retrieve(settings.setting_value);

    res.json({
      connected: true,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch (error) {
    console.error('Stripe status error:', error);
    res.status(500).json({ error: 'Failed to check Stripe status' });
  }
});

// ============ PAYMENT ENDPOINTS ============

// Create Payment Intent (with split payment support)
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // Get connected account and kiosk fee from settings
    let connectedAccountId = null;
    let kioskFee = 3.00;

    if (supabase) {
      const { data: settings } = await supabase
        .from('kiosk_settings')
        .select('*');

      settings?.forEach(s => {
        if (s.setting_key === 'stripe_connected_account_id') {
          connectedAccountId = s.setting_value;
        }
        if (s.setting_key === 'kiosk_fee') {
          kioskFee = parseFloat(s.setting_value) || 3.00;
        }
      });
    }

    const paymentIntentParams = {
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    };

    // If connected account exists, split the payment
    if (connectedAccountId) {
      paymentIntentParams.application_fee_amount = Math.round(kioskFee * 100);
      paymentIntentParams.transfer_data = {
        destination: connectedAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// ============ PRINTNODE ENDPOINTS ============

// Generate receipt text
function generateReceipt(order) {
  const { orderNumber, items, subtotal, tax, kioskFee, total, customerName, customerPhone, deliveryLocation } = order;
  const date = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  let receipt = `
================================
    WALTER'S KITCHEN
    Food Ordering Kiosk
================================

Order #: ${orderNumber}
Date: ${date}

Customer: ${customerName || 'Guest'}
Phone: ${customerPhone || 'N/A'}
Location: ${deliveryLocation || 'N/A'}

--------------------------------
ITEMS:
--------------------------------
`;

  items.forEach(item => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    const line = `${item.quantity}x ${item.name}`;
    const padding = 32 - line.length - itemTotal.length - 1;
    receipt += `${line}${' '.repeat(Math.max(1, padding))}$${itemTotal}\n`;
  });

  receipt += `
--------------------------------
Subtotal:${' '.repeat(14)}$${subtotal.toFixed(2)}
Kiosk Fee:${' '.repeat(13)}$${kioskFee.toFixed(2)}
Tax (8.25%):${' '.repeat(11)}$${tax.toFixed(2)}
--------------------------------
TOTAL:${' '.repeat(17)}$${total.toFixed(2)}
================================
        THANK YOU!
================================
`;

  return receipt;
}

// Send print job to PrintNode
async function sendPrintJob(receipt, printNodeApiKey, printerId) {
  if (!printNodeApiKey || !printerId) {
    console.log('PrintNode not configured, skipping print');
    return null;
  }

  try {
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(printNodeApiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        printerId: parseInt(printerId),
        title: 'Order Receipt',
        contentType: 'raw_base64',
        content: Buffer.from(receipt).toString('base64'),
        source: 'Walters Kitchen Kiosk',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('PrintNode error:', error);
      return null;
    }

    const result = await response.json();
    console.log('Print job created:', result);
    return result;
  } catch (error) {
    console.error('PrintNode request error:', error);
    return null;
  }
}

// Test print endpoint
app.post('/api/admin/print/test', adminAuth, async (req, res) => {
  try {
    // Get PrintNode settings
    const { data: settings } = await supabase
      .from('kiosk_settings')
      .select('*');

    let printNodeApiKey = null;
    let printerId = null;

    settings?.forEach(s => {
      if (s.setting_key === 'printnode_api_key') printNodeApiKey = s.setting_value;
      if (s.setting_key === 'printnode_printer_id') printerId = s.setting_value;
    });

    if (!printNodeApiKey || !printerId) {
      return res.status(400).json({ error: 'PrintNode not configured' });
    }

    // Generate test receipt
    const testOrder = {
      orderNumber: 'TEST001',
      items: [
        { name: 'Test Item 1', price: 10.00, quantity: 2 },
        { name: 'Test Item 2', price: 5.50, quantity: 1 },
      ],
      subtotal: 25.50,
      tax: 2.35,
      kioskFee: 3.00,
      total: 30.85,
      customerName: 'Test Customer',
      customerPhone: '(555) 123-4567',
      deliveryLocation: 'Table 1',
    };

    const receipt = generateReceipt(testOrder);
    const result = await sendPrintJob(receipt, printNodeApiKey, printerId);

    if (result) {
      res.json({ success: true, printJobId: result });
    } else {
      res.status(500).json({ error: 'Failed to send print job' });
    }
  } catch (error) {
    console.error('Test print error:', error);
    res.status(500).json({ error: 'Test print failed' });
  }
});

// Get PrintNode printers (to help user find printer ID)
app.get('/api/admin/print/printers', adminAuth, async (req, res) => {
  try {
    const { data: settings } = await supabase
      .from('kiosk_settings')
      .select('setting_value')
      .eq('setting_key', 'printnode_api_key')
      .single();

    if (!settings?.setting_value) {
      return res.status(400).json({ error: 'PrintNode API key not configured' });
    }

    const response = await fetch('https://api.printnode.com/printers', {
      headers: {
        'Authorization': `Basic ${Buffer.from(settings.setting_value + ':').toString('base64')}`,
      },
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to fetch printers' });
    }

    const printers = await response.json();
    res.json(printers.map(p => ({ id: p.id, name: p.name, description: p.description })));
  } catch (error) {
    console.error('Fetch printers error:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

// ============ ORDER ENDPOINTS ============

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

    // Save to Supabase if configured
    if (supabase) {
      try {
        await supabase.from('orders').insert({
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
      } catch (error) {
        console.error('Database error:', error);
      }
    }

    // Format items for email
    const itemsList = items
      .map((item) => `- ${item.name} x${item.quantity} @ $${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    // Print receipt if PrintNode configured
    if (supabase) {
      try {
        const { data: settings } = await supabase
          .from('kiosk_settings')
          .select('*');

        let printNodeApiKey = null;
        let printerId = null;

        settings?.forEach(s => {
          if (s.setting_key === 'printnode_api_key') printNodeApiKey = s.setting_value;
          if (s.setting_key === 'printnode_printer_id') printerId = s.setting_value;
        });

        if (printNodeApiKey && printerId) {
          const receipt = generateReceipt({
            orderNumber,
            items,
            subtotal,
            tax,
            kioskFee,
            total,
            customerName,
            customerPhone,
            deliveryLocation,
          });
          await sendPrintJob(receipt, printNodeApiKey, printerId);
          console.log(`Receipt printed for order ${orderNumber}`);
        }
      } catch (printError) {
        console.error('Print error:', printError);
      }
    }

    // Send email via Resend
    if (process.env.RESEND_API_KEY && process.env.RESTAURANT_EMAIL) {
      try {
        await resend.emails.send({
          from: 'orders@walters-kitchen.local',
          to: process.env.RESTAURANT_EMAIL,
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
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get Order Status
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    if (supabase) {
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
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ============ STRIPE WEBHOOK ============

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
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Walter's Kitchen API running on port ${PORT}`);
  console.log(`Supabase: ${supabase ? 'Connected' : 'Not configured'}`);
});
