# Quick Start Guide - 5 Minutes

## 1. Clone & Install (2 minutes)

```bash
cd walters-kitchen-kiosk
npm install
cd web && npm install && cd ..
cd api && npm install && cd ..
```

## 2. Create .env Files (1 minute)

**Create `web/.env.local`:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890123456789012345678901234567890123
VITE_API_URL=http://localhost:3001/api
```

**Create `api/.env.local`:**
```
PORT=3001
STRIPE_SECRET_KEY=sk_test_1234567890123456789012345678901234567890123
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890123456789012345678901234567890123
RESEND_API_KEY=re_test_1234567890123456789012345678901234567890123
SUPABASE_URL=https://demo.supabase.co
SUPABASE_KEY=demo-key
```

**Get Real Keys:**

1. **Stripe Test Keys** (easiest to start):
   - Go to https://dashboard.stripe.com/
   - You'll see test keys immediately
   - Look for "Publishable key" and "Secret key" under "KEYS"
   - Copy and paste into .env files

2. **Resend (Free):**
   - Sign up at https://resend.com
   - Go to Settings > API Keys
   - Copy key to RESEND_API_KEY

3. **Supabase (Free):**
   - Create project at https://supabase.com
   - Copy project URL and anon key
   - Use dummy values for now

## 3. Start Development (1 minute)

```bash
npm run dev
```

Browser will open automatically:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api/health

## 4. Test Everything (1 minute)

1. **Menu:**
   - See "Appetizers" tab selected
   - See menu items with prices
   - Click any item to add to cart

2. **Cart:**
   - See item appear in right sidebar
   - Click + to increase quantity
   - See total update

3. **Checkout:**
   - Click "Proceed to Pay"
   - Enter name: "Test User"
   - Enter phone: "(555) 123-4567"
   - Enter location: "Test Location"
   - Click "Continue to Payment"

4. **Payment (Test):**
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - Click "Pay $XX.XX"

5. **Confirmation:**
   - See "Order Confirmed!" screen
   - See order number (e.g., WK12345678)
   - See it auto-resets after 30 seconds

## Full Menu Categories

✅ Appetizers (14 items)
✅ Salads & Soups (8 items)
✅ Entrees (13 items)
✅ Asian Favorites (10 items)
✅ Steak & Fajitas (4 items)
✅ Sushi (5 items)
✅ Burgers & Sandwiches (9 items)
✅ Kid's Menu (4 items)
✅ Beverages (16 items)
✅ Desserts (7 items)

**Total: 100+ items hardcoded from spec**

## Available Test Cards (Stripe)

All cards work in test mode with any future date and any CVC:

| Card | Use Case |
|------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Card declined |
| 4000 0025 0000 3155 | 3D Secure required |
| 5555 5555 5555 4444 | Mastercard |
| 3782 822463 10005 | American Express |

## Troubleshooting

**"Cannot find module" errors:**
```bash
cd web && npm install && cd ..
cd api && npm install && cd ..
```

**Port 3000 already in use:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

**API not responding:**
- Check backend is running: http://localhost:3001/api/health
- Should return: `{"status":"ok"}`

**Stripe key issues:**
- Verify you're using TEST keys (start with `pk_test_` or `sk_test_`)
- Keys must be copied completely (very long strings)

**Payment fails:**
- Use test card: 4242 4242 4242 4242
- All test cards accept any future date and CVC

## File Structure

```
walters-kitchen-kiosk/
├── web/              ← Frontend React app (npm start)
├── api/              ← Backend Express server (node server.js)
├── README.md         ← Full documentation
├── DEPLOYMENT.md     ← Production deployment
└── QUICK_START.md    ← This file
```

## Next Steps

1. **Customize menu:** Edit `web/src/data/menu.js`
2. **Change email:** Edit `api/server.js` (line with "walter@example.com")
3. **Custom styling:** Edit `web/src/index.css` or `tailwind.config.js`
4. **Deploy:** See `DEPLOYMENT.md`

## Support

- **Stripe Docs:** https://stripe.com/docs
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Supabase:** https://supabase.com/docs

Happy coding! 🚀
