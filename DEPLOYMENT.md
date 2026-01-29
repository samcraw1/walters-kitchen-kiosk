# Deployment Guide - Vercel & Production

## Prerequisites

- Vercel account (free): https://vercel.com
- GitHub account for code hosting
- Production Stripe keys
- Production Resend API key (or dev key if using free tier)
- Production Supabase URL and key

## Step 1: Prepare for Deployment

### Update Environment Variables

Update keys in your `.env.local` files with production keys:

**web/.env.production:**
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PROD_KEY
VITE_API_URL=https://your-production-api.com/api
```

**api/.env.production:**
```
PORT=3001
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_YOUR_PROD_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PROD_SECRET
RESEND_API_KEY=re_YOUR_PROD_KEY
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-prod-anon-key
```

## Step 2: Deploy to Vercel

### Option A: Frontend on Vercel (Recommended)

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Create Vercel project:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `web` folder as root directory
   - Add environment variables

3. **Configure environment variables in Vercel:**
   - Go to Project Settings > Environment Variables
   - Add:
     ```
     VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
     VITE_API_URL=https://your-api-domain.com/api
     ```

4. **Deploy:**
   - Click Deploy
   - Your app will be live at `https://your-project.vercel.app`

### Option B: Full Stack on Vercel (API + Web)

For API deployment on Vercel, use serverless functions:

1. **Create `vercel.json` in root:**
```json
{
  "builds": [
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "web/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "web/index.html"
    }
  ]
}
```

2. **Deploy full project to Vercel**

## Step 3: Deploy API (Separate Option)

If keeping API separate from frontend:

### Option A: Railway.app (Free)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd api
railway up
```

### Option B: Render (Free)
1. Connect GitHub to Render.com
2. Create new Web Service
3. Set root directory to `api/`
4. Add environment variables
5. Deploy

### Option C: Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and deploy
flyctl auth login
flyctl launch
flyctl deploy
```

### Option D: Self-hosted (DigitalOcean, AWS, etc.)
```bash
cd api
npm install
PORT=3001 node server.js
```

## Step 4: Configure Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Create new webhook endpoint
3. Point to: `https://your-api-domain.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`
5. Copy webhook secret and add to environment variables

## Step 5: Configure Resend

1. Log in to https://resend.com
2. Navigate to API Keys
3. Copy your production API key
4. Update `RESEND_API_KEY` environment variable

Important: Update the email recipient in `api/server.js`:
```javascript
// Change from:
to: 'walter@example.com',

// To your actual restaurant email:
to: 'orders@walters-kitchen.com',
```

## Step 6: Setup Custom Domain

### For Vercel:
1. Go to Project Settings > Domains
2. Add your domain (e.g., `order.walters-kitchen.com`)
3. Follow DNS configuration steps
4. SSL certificate auto-generated

### For API (separate):
1. Add custom domain to hosting provider
2. Point DNS to their servers
3. Configure SSL certificate

## Step 7: Monitor & Analytics

### Vercel Analytics:
- Built-in performance monitoring
- Real user metrics
- Edge function performance

### Stripe Monitoring:
- Dashboard for payment success/failure rates
- Webhook event logs
- Testing interface

### Resend Monitoring:
- Email delivery reports
- Bounce and complaint rates

## Environment Variable Checklist

### Frontend (Vercel)
- [ ] VITE_STRIPE_PUBLISHABLE_KEY (production)
- [ ] VITE_API_URL (points to your API domain)

### Backend (Any Host)
- [ ] PORT (for local: 3001, Vercel handles this)
- [ ] NODE_ENV=production
- [ ] STRIPE_SECRET_KEY (production)
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] RESEND_API_KEY (production)
- [ ] SUPABASE_URL
- [ ] SUPABASE_KEY (anon key is fine)

## Testing Production

1. **Test Stripe (Livemode):**
   - Use real test card: 4242 4242 4242 4242
   - Or create test transactions in Stripe dashboard

2. **Test Email:**
   - Place test order
   - Verify email arrives at restaurant address
   - Check Resend dashboard for delivery

3. **Test Supabase:**
   - Verify order appears in database
   - Check order status endpoint

4. **Performance:**
   - Run Lighthouse audit
   - Test on actual iPad/kiosk device
   - Check touch responsiveness

## Post-Deployment

1. **Monitor Errors:**
   - Vercel: Check Deploy > Functions Logs
   - API Host: Check application logs
   - Sentry integration (optional): Add error tracking

2. **Update Restaurant:**
   - Provide kiosk URL
   - Setup email notifications
   - Train staff on order pickup process

3. **Backup Configuration:**
   - Document all API keys location
   - Create runbook for production issues
   - Setup on-call rotation if needed

## Rollback Procedure

### Vercel Frontend:
1. Go to Deployments
2. Find previous successful deployment
3. Click "Promote to Production"

### API (Separate):
1. Revert code to previous version: `git revert [commit]`
2. Redeploy with previous environment variables

## Performance Optimization

### Frontend:
- Vercel Edge Cache enabled (default)
- Images optimized via Vercel Image Optimization
- CSS/JS minification automatic

### Backend:
- Enable response compression
- Setup caching headers
- Monitor API response times

## Security Checklist

- [ ] No hardcoded secrets in code
- [ ] HTTPS enforced everywhere
- [ ] CORS properly configured
- [ ] API rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Stripe webhook signature verification
- [ ] Environment secrets properly scoped

## Troubleshooting

### 502 Bad Gateway
- Check if API is running
- Verify environment variables set
- Check API logs for errors

### Payment fails
- Verify Stripe keys are production keys
- Check webhook configuration
- Review Stripe dashboard for errors

### Emails not sending
- Verify Resend API key
- Check email address is valid
- Review Resend dashboard

### Orders not saving to database
- Verify Supabase connection
- Check database schema created
- Review Supabase logs

## Scaling Considerations

- Vercel automatically scales frontend
- API may need upgrade for high volume:
  - Railway: Scale dynos
  - Render: Scale plan
  - Self-hosted: Add load balancer
- Supabase: Free tier sufficient for small restaurants

## Cost Estimation (Monthly)

- Vercel Frontend: $0-20 (free to pro)
- Railway API: $5+ (free tier available)
- Supabase DB: $0 (free tier 500MB)
- Stripe: 2.9% + $0.30 per transaction
- Resend: $20/month (100,000 emails)

**Total estimate: $50-100/month for typical restaurant**

## Support & Monitoring

Setup alerts for:
- Failed payments
- API downtime
- High error rates
- Unusual traffic patterns

Recommended tools:
- UptimeRobot (uptime monitoring)
- Sentry (error tracking)
- LogRocket (session replay)
