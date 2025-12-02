# Stripe Payment Setup Guide

## Quick Setup Steps

### 1. Create a Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" and create your account
3. Complete the registration process

### 2. Get Your API Keys

#### For Testing (Recommended to start):
1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_...`) - Not needed for backend
   - **Secret key** (starts with `sk_test_...`) - **This is what you need**
3. Click "Reveal test key" to see your secret key
4. Copy the secret key

#### For Production (When going live):
1. Switch to "Live mode" in the Stripe Dashboard
2. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Copy the live secret key (starts with `sk_live_...`)

### 3. Update Your .env File

Open `backend/.env` and replace the placeholder:

```env
# Replace this line:
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# With your actual key:
STRIPE_SECRET_KEY=sk_test_51ABC123DEF...
```

### 4. Setup Webhook (Optional but Recommended)

Webhooks allow Stripe to notify your server about payment events:

1. Go to [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "+ Add endpoint"
3. Enter your webhook URL: `http://your-server-url/api/payments/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Click "Add endpoint"
6. Click on the webhook you just created
7. Copy the "Signing secret" (starts with `whsec_...`)
8. Update your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_ABC123...
   ```

### 5. Restart Your Backend Server

After updating the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
node server.js
```

## Testing Payments

### Test Card Numbers

When in test mode, use these card numbers:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |
| 4000 0000 0000 9995 | Payment declined |

- **Expiry Date**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

## Pricing Configuration

Current pricing in `backend/routes/payments.js`:

```javascript
function getAmountForPlan(plan) {
  if (String(plan).toLowerCase() === 'yearly') return 1200 * 100; // 1200 PKR
  return 100 * 100; // 100 PKR for monthly
}
```

**Note**: Stripe amounts are in the smallest currency unit (paisa for PKR):
- 100 PKR = 10000 paisa (100 × 100)
- 1200 PKR = 120000 paisa (1200 × 100)

### To Change Prices:

Edit the `getAmountForPlan` function in `backend/routes/payments.js`:

```javascript
function getAmountForPlan(plan) {
  if (String(plan).toLowerCase() === 'yearly') return 5000 * 100; // 5000 PKR yearly
  return 500 * 100; // 500 PKR monthly
}
```

## Troubleshooting

### "Stripe is not configured" Error
- ✅ Make sure `STRIPE_SECRET_KEY` is set in `backend/.env`
- ✅ Restart your backend server after updating `.env`
- ✅ Check that the key starts with `sk_test_` (test mode) or `sk_live_` (live mode)

### Payment Not Recording
- Check the browser console for errors
- Check backend terminal for error logs
- Verify the user is logged in as "admin"
- Check MongoDB to see if payment was recorded

### Webhook Not Working
- For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks
- Or use a service like [ngrok](https://ngrok.com/) to expose your local server
- Make sure `STRIPE_WEBHOOK_SECRET` matches your webhook's signing secret

## Security Notes

⚠️ **Important**:
- Never commit your `.env` file to Git (it's in `.gitignore`)
- Never share your secret keys publicly
- Use test keys for development
- Use live keys only in production
- Rotate keys if they're ever exposed

## Going Live

Before accepting real payments:

1. Switch to live mode in Stripe Dashboard
2. Update `STRIPE_SECRET_KEY` with your live key (`sk_live_...`)
3. Complete Stripe account verification
4. Set up proper webhook endpoints on your production server
5. Test thoroughly with live test cards
6. Enable 3D Secure authentication for extra security

## Support

- Stripe Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
- Test your integration: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)
