import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, Environment } from 'square';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Square
const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production'
    ? Environment.Production
    : Environment.Sandbox,
});

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

    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order');

    if (catError) throw catError;

    const { data: items, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('sort_order');

    if (itemError) throw itemError;

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

app.get('/api/admin/settings', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('kiosk_settings')
      .select('*');

    if (error) throw error;

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

// ============ SQUARE ENDPOINTS ============

// Get Square config for frontend
app.get('/api/square/config', (req, res) => {
  res.json({
    applicationId: process.env.SQUARE_APPLICATION_ID,
    locationId: process.env.SQUARE_LOCATION_ID,
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
  });
});

// Process Square payment
app.post('/api/square/payment', async (req, res) => {
  try {
    const { sourceId, amount, currency = 'USD' } = req.body;

    const idempotencyKey = crypto.randomUUID();

    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency,
      },
      locationId: process.env.SQUARE_LOCATION_ID,
    });

    res.json({
      success: true,
      paymentId: result.payment.id,
      status: result.payment.status,
    });
  } catch (error) {
    console.error('Square payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get Square OAuth URL for merchant connection
app.get('/api/admin/square/auth-url', adminAuth, async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');

    // Store state for verification
    if (supabase) {
      await supabase.from('kiosk_settings').upsert({
        setting_key: 'square_oauth_state',
        setting_value: state,
      });
    }

    const baseUrl = process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    // Use the frontend URL for redirect
    const redirectUri = process.env.SQUARE_REDIRECT_URI || 'http://localhost:5173/admin';

    const authUrl = `${baseUrl}/oauth2/authorize?` +
      `client_id=${process.env.SQUARE_APPLICATION_ID}&` +
      `scope=PAYMENTS_WRITE+PAYMENTS_READ+MERCHANT_PROFILE_READ&` +
      `session=false&` +
      `state=${state}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}`;

    res.json({ url: authUrl, state });
  } catch (error) {
    console.error('Square auth-url error:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Square OAuth callback (GET method to handle redirect from Square)
app.get('/api/admin/square/callback', adminAuth, async (req, res) => {
  try {
    const { code, state } = req.query;

    // Verify state
    if (supabase) {
      const { data: storedState } = await supabase
        .from('kiosk_settings')
        .select('setting_value')
        .eq('setting_key', 'square_oauth_state')
        .single();

      if (storedState?.setting_value !== state) {
        return res.status(400).json({ error: 'Invalid OAuth state' });
      }
    }

    const baseUrl = process.env.SQUARE_ENVIRONMENT === 'production'
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    const redirectUri = process.env.SQUARE_REDIRECT_URI || 'http://localhost:5173/admin';

    const response = await fetch(`${baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18',
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_APPLICATION_ID,
        client_secret: process.env.SQUARE_ACCESS_TOKEN,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      // Save merchant tokens
      await supabase.from('kiosk_settings').upsert([
        { setting_key: 'square_merchant_id', setting_value: data.merchant_id },
        { setting_key: 'square_merchant_access_token', setting_value: data.access_token },
        { setting_key: 'square_merchant_refresh_token', setting_value: data.refresh_token },
      ]);

      // Clear the oauth state
      await supabase.from('kiosk_settings').delete().eq('setting_key', 'square_oauth_state');

      res.json({ success: true, merchantId: data.merchant_id });
    } else {
      res.status(400).json({ error: data.message || 'OAuth failed' });
    }
  } catch (error) {
    console.error('Square OAuth error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// Disconnect Square merchant
app.post('/api/admin/square/disconnect', adminAuth, async (req, res) => {
  try {
    await supabase.from('kiosk_settings').delete()
      .in('setting_key', [
        'square_merchant_id',
        'square_merchant_access_token',
        'square_merchant_refresh_token',
      ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Square disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Check Square connection status
app.get('/api/admin/square/status', adminAuth, async (req, res) => {
  try {
    const { data: settings } = await supabase
      .from('kiosk_settings')
      .select('*')
      .in('setting_key', ['square_merchant_id', 'square_merchant_access_token']);

    const settingsMap = {};
    settings?.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    if (settingsMap.square_merchant_id && settingsMap.square_merchant_access_token) {
      // Try to get merchant info from Square
      let businessName = null;
      let locationId = null;
      try {
        const merchantClient = new Client({
          accessToken: settingsMap.square_merchant_access_token,
          environment: process.env.SQUARE_ENVIRONMENT === 'production'
            ? Environment.Production
            : Environment.Sandbox,
        });

        const { result } = await merchantClient.merchantsApi.retrieveMerchant(settingsMap.square_merchant_id);
        businessName = result.merchant?.businessName;

        const { result: locResult } = await merchantClient.locationsApi.listLocations();
        locationId = locResult.locations?.[0]?.id;
      } catch (e) {
        console.error('Failed to fetch merchant info:', e);
      }

      res.json({
        connected: true,
        merchantId: settingsMap.square_merchant_id,
        businessName,
        locationId,
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Square status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// ============ PRINTNODE ENDPOINTS ============

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

app.post('/api/admin/print/test', adminAuth, async (req, res) => {
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

    if (!printNodeApiKey || !printerId) {
      return res.status(400).json({ error: 'PrintNode not configured' });
    }

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
      paymentId,
    } = req.body;

    const orderNumber = `WK${Date.now().toString().slice(-8)}`;

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
          payment_intent_id: paymentId,
          status: 'pending',
        });
      } catch (error) {
        console.error('Database error:', error);
      }
    }

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
        const itemsList = items
          .map((item) => `- ${item.name} x${item.quantity} @ $${(item.price * item.quantity).toFixed(2)}`)
          .join('\n');

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

            <p>Payment ID: ${paymentId}</p>
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

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Walter's Kitchen API running on port ${PORT}`);
  console.log(`Supabase: ${supabase ? 'Connected' : 'Not configured'}`);
  console.log(`Square Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
});
