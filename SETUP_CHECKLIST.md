# Setup Checklist for Sam

Complete this checklist to get the PWA running in development and production.

## Phase 1: Development Setup (30 minutes)

### Step 1: Clone and Dependencies
- [ ] Navigate to `/Users/sam/clawd/walters-kitchen-kiosk`
- [ ] Run `npm install`
- [ ] Run `cd web && npm install && cd ..`
- [ ] Run `cd api && npm install && cd ..`

### Step 2: Get Stripe Test Keys
- [ ] Go to https://dashboard.stripe.com/
- [ ] Look for "Publishable key" and "Secret key" under test keys
- [ ] Copy both keys

### Step 3: Create Environment Files
Create `web/.env.local`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_[PASTE YOUR KEY]
VITE_API_URL=http://localhost:3001/api
```

Create `api/.env.local`:
```
PORT=3001
STRIPE_SECRET_KEY=sk_test_[PASTE YOUR KEY]
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890123456789
RESEND_API_KEY=re_test_1234567890123456789
SUPABASE_URL=https://demo.supabase.co
SUPABASE_KEY=demo-key
```

### Step 4: Start Development
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Frontend should load with red header "Walter's Kitchen"

### Step 5: Test Basic Flow
- [ ] See "Appetizers" tab selected
- [ ] Click "Nachos Supreme" item
- [ ] See item appear in right cart sidebar
- [ ] Click + to increase quantity
- [ ] Verify total updates correctly
- [ ] Click "Proceed to Pay"
- [ ] Enter test name/phone/location
- [ ] Use test card: 4242 4242 4242 4242
- [ ] See "Order Confirmed!" screen
- [ ] See order number (WK########)

**✅ Development should be working!**

## Phase 2: Email Setup (15 minutes)

### Step 1: Resend API Key
- [ ] Go to https://resend.com
- [ ] Sign up with free account
- [ ] Go to Settings > API Keys
- [ ] Copy your API key (starts with `re_`)

### Step 2: Update API .env
- [ ] Edit `api/.env.local`
- [ ] Replace RESEND_API_KEY with your key from Resend

### Step 3: Update Restaurant Email
- [ ] Edit `api/server.js`
- [ ] Find line ~95: `to: 'walter@example.com',`
- [ ] Replace with actual restaurant email (e.g., `orders@walter-kitchen.com`)

### Step 4: Test Email
- [ ] Restart API: Stop and run `npm run dev:api`
- [ ] Place test order
- [ ] Check email inbox for order confirmation

**✅ Emails should be working!**

## Phase 3: Database Setup (20 minutes)

### Step 1: Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Sign up with GitHub (easier)
- [ ] Create new project
- [ ] Copy project URL and anon key

### Step 2: Create Database Tables
- [ ] Go to SQL Editor in Supabase
- [ ] Copy SQL from `SUPABASE_SETUP.md`
- [ ] Paste and execute in Supabase SQL Editor

### Step 3: Update API .env
- [ ] Edit `api/.env.local`
- [ ] Replace SUPABASE_URL with your project URL
- [ ] Replace SUPABASE_KEY with your anon key

### Step 4: Test Database
- [ ] Restart API
- [ ] Place test order
- [ ] Go to Supabase Dashboard > Tables > orders
- [ ] See your order listed there

**✅ Database should be working!**

## Phase 4: Production Setup (Varies)

### Option A: Deploy to Vercel (Recommended - Free)

#### Frontend on Vercel
- [ ] Push code to GitHub: `git push origin main`
- [ ] Go to https://vercel.com/new
- [ ] Import your GitHub repository
- [ ] Select `web` folder as root directory
- [ ] Add environment variables:
  - `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_PROD_KEY]`
  - `VITE_API_URL=https://your-api-domain.com/api`
- [ ] Deploy
- [ ] Note the Vercel URL (e.g., `walters-kitchen.vercel.app`)

#### Backend on Railway (Free tier)
- [ ] Go to https://railway.app
- [ ] Connect GitHub repo
- [ ] Deploy from `api/` folder
- [ ] Add environment variables for production
- [ ] Note the Railway URL (e.g., `api.railway.app`)

#### Update Stripe Production Keys
- [ ] Go to Stripe Dashboard (switch to Live)
- [ ] Copy production public key (pk_live_)
- [ ] Copy production secret key (sk_live_)
- [ ] Update both services with production keys

#### Setup Stripe Webhook
- [ ] Go to Stripe > Developers > Webhooks
- [ ] Create endpoint: `https://your-api-domain/api/webhooks/stripe`
- [ ] Select events: `payment_intent.succeeded`
- [ ] Copy webhook secret
- [ ] Add to API environment variables

**✅ Production should be live!**

### Option B: Deploy with Docker (If you prefer)
- [ ] Update `.env` files with production secrets
- [ ] Build: `docker-compose build`
- [ ] Run: `docker-compose up`
- [ ] Deploy to Docker hosting (Render, Railway, etc.)

## Phase 5: Testing Checklist

### Menu & Categories
- [ ] All 10 categories visible
- [ ] All 100+ items load
- [ ] Category switching works
- [ ] Items display with prices

### Cart & Calculations
- [ ] Add items to cart
- [ ] Remove items from cart
- [ ] Adjust quantities (+/-)
- [ ] Clear cart
- [ ] Subtotal calculates correctly
- [ ] Kiosk fee ($3.00) applied
- [ ] Tax calculates correctly (8.25%)
- [ ] Total is accurate

### Checkout Flow
- [ ] Review step shows all items
- [ ] Info step validates required fields
- [ ] Payment form loads
- [ ] Test card payment succeeds
- [ ] Confirmation shows order number
- [ ] Auto-reset after 30 seconds

### Integrations
- [ ] Order email received
- [ ] Order appears in Supabase
- [ ] Payment recorded in Stripe
- [ ] Order number is unique

### PWA Features
- [ ] Service worker registered
- [ ] Works offline (menu still visible)
- [ ] Can add to home screen
- [ ] Fullscreen mode works
- [ ] Touch targets are 44px+

### Performance
- [ ] Loads in <2 seconds
- [ ] No console errors
- [ ] Touch response is instant
- [ ] Smooth transitions

### iPad/Kiosk
- [ ] Landscape layout optimized
- [ ] Touch targets easily tappable
- [ ] Text readable from distance
- [ ] No keyboard needed
- [ ] Full-screen immersive

## Phase 6: Customization (Optional)

### Update Restaurant Info
- [ ] Edit `web/src/App.jsx` header
- [ ] Update address: "8010 N Stemmons Fwy, Dallas, TX 75247"
- [ ] Update phone: "(469) 489-4654"
- [ ] Update hours: "Mon-Sat 11am-10pm"

### Adjust Menu
- [ ] Edit `web/src/data/menu.js`
- [ ] Change prices
- [ ] Add/remove items
- [ ] Add/remove categories

### Change Kiosk Fee
- [ ] Edit `web/src/components/Cart.jsx`
- [ ] Change `KIOSK_FEE = 3.00` to desired amount
- [ ] Edit `web/src/components/Checkout.jsx` (same change)

### Change Tax Rate
- [ ] Edit `web/src/components/Cart.jsx`
- [ ] Change `TAX_RATE = 0.0825` for different rate
- [ ] Edit `web/src/components/Checkout.jsx` (same change)

### Customize Colors
- [ ] Edit `web/tailwind.config.js`
- [ ] Change `'wk-red': '#DC2626'` to your color
- [ ] Change `'wk-dark': '#000000'` to your color

## Phase 7: Launch Preparation

### Documentation
- [ ] Read `README.md` for full overview
- [ ] Review `QUICK_START.md` for troubleshooting
- [ ] Reference `IMPLEMENTATION.md` for technical details

### Training
- [ ] Test on actual iPad/kiosk device
- [ ] Train staff on using kiosk
- [ ] Document order pickup process
- [ ] Setup email notification routine

### Monitoring
- [ ] Bookmark Stripe Dashboard
- [ ] Bookmark Resend Dashboard
- [ ] Bookmark Supabase Dashboard
- [ ] Setup uptime monitoring (UptimeRobot)

### Backup Plan
- [ ] Document all API keys (secure storage)
- [ ] Document deployment URLs
- [ ] Note emergency contacts
- [ ] Create rollback procedure

## Success Metrics

### Day 1
- ✅ Kiosk loads without errors
- ✅ Staff can place test orders
- ✅ Payments process correctly
- ✅ Emails arrive at restaurant

### Week 1
- ✅ First real orders placed
- ✅ No payment failures
- ✅ Email notifications working
- ✅ Database has 10+ orders

### Month 1
- ✅ Average daily orders: X
- ✅ Payment success rate: >99%
- ✅ Zero downtime incidents
- ✅ Customer feedback positive

## Troubleshooting Guide

### Development

**Problem: "Cannot find module" error**
```bash
cd web && npm install && cd ..
cd api && npm install && cd ..
```

**Problem: Port 3000/3001 in use**
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Problem: Stripe payment fails**
- Verify test keys (must start with pk_test_ or sk_test_)
- Use test card: 4242 4242 4242 4242
- Check backend logs for errors

**Problem: Email not sending**
- Verify Resend API key
- Check restaurant email address in api/server.js
- Check Resend dashboard for errors

### Production

**Problem: 502 Bad Gateway**
- Check API is running
- Verify all environment variables set
- Check API logs for errors

**Problem: Payment errors**
- Verify production keys (pk_live_ or sk_live_)
- Check Stripe webhook configured
- Review Stripe dashboard for rejected payments

**Problem: Orders not saving**
- Verify Supabase connection
- Check database has orders table
- Review Supabase logs

## Final Checklist

Before going live:
- [ ] All phases completed
- [ ] Tested end-to-end
- [ ] Staff trained
- [ ] Backup plan documented
- [ ] Monitoring setup
- [ ] Support contact established

## Getting Help

- **Stripe Errors**: https://stripe.com/docs/error-codes
- **React Issues**: https://react.dev
- **Node/Express**: https://nodejs.org/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

---

**Status**: [ ] Completed

Start with Phase 1 and work through each phase in order. Each phase builds on the previous one.

Good luck! 🚀
