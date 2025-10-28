const express = require('express');
const Stripe = require('stripe');
const path = require('path');
const fs = require('fs');

// ✅ Load .env locally. Render injects env automatically.
require('dotenv').config();

const app = express();

// ✅ Switch keys easily
const LIVE_MODE = true;

const stripe = Stripe(
  LIVE_MODE
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST
);

// ✅ Serve static assets (HTML, CSS, images)
app.use(express.static(path.join(__dirname)));

// ✅ Redirect root to landing page
app.get('/', (req, res) => res.redirect('/about'));

// Serve About/Landing Page
app.get('/about', (req, res) => {
  const filePath = path.join(__dirname, 'about.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      console.error('❌ Error loading About page:', err);
      return res.status(500).send('Error loading About page.');
    }
    res.send(html);
  });
});

// ✅ Lifetime Checkout
app.get('/buy', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      allow_promotion_codes: true,
      line_items: [
        {
          price: 'price_1SMuZQFU03fbQ7eGrAk3ZHWW', // $247 Lifetime
          quantity: 1
        }
      ],
      customer_creation: 'always',
      custom_fields: [
        {
          key: 'discord',
          label: { type: 'custom', custom: 'Discord Username' },
          type: 'text',
          text: { minimum_length: 3, maximum_length: 32 }
        }
      ],
      success_url: 'https://freshdoes.com/access?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://freshdoes.com/cancel',
      metadata: {
        product: 'Saucy',
        access: 'lifetime'
      }
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error('❌ Checkout error:', err);
    res.status(500).send('Error creating checkout session');
  }
});

// ✅ Monthly Subscription Checkout
app.get('/buy-monthly', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      allow_promotion_codes: true,
      line_items: [
        {
          price: 'price_1SMueeFU03fbQ7eGvycLhJzt', // $100 Monthly
          quantity: 1
        }
      ],
      custom_fields: [
        {
          key: 'discord',
          label: { type: 'custom', custom: 'Discord Username' },
          type: 'text',
          text: { minimum_length: 3, maximum_length: 32 }
        }
      ],
      success_url: 'https://freshdoes.com/access?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://freshdoes.com/cancel',
      metadata: {
        product: 'Saucy',
        access: 'monthly'
      }
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error('❌ Subscription error:', err);
    res.status(500).send('Error creating subscription session');
  }
});

// ✅ Gate Access Route
app.get('/access', async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.redirect('/');

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer']
    });

    if (session.payment_status !== 'paid') {
      return res.redirect('/');
    }

    const plan = session.metadata.access;
    const discordField = session.custom_fields?.find(f => f.key === 'discord');
    const discord = discordField?.text?.value || 'Unknown';

    res.send(`
      <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Welcome to Saucy ✅</title>
<style>
    body {
        font-family: 'Poppins', sans-serif;
        background: #0e1217;
        color: #fff;
        text-align: center;
        padding: 60px 20px;
    }
    .card {
        background: #1a1f2e;
        border: 1px solid rgba(248,216,122,0.25);
        max-width: 600px;
        margin: 0 auto;
        padding: 35px;
        border-radius: 14px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }
    h1 {
        font-size: 2.2rem;
        color: #f8d87a;
        margin-bottom: 20px;
    }
    p {
        font-size: 1.15rem;
        line-height: 1.6;
        margin-bottom: 25px;
    }
    .button {
        display: inline-block;
        padding: 14px 30px;
        background: linear-gradient(135deg, #f8d87a, #f1c94e);
        color: #000;
        border-radius: 50px;
        font-weight: 700;
        text-decoration: none;
        text-transform: uppercase;
        box-shadow: 0 8px 25px rgba(248,216,122,0.3);
        transition: transform 0.2s ease;
    }
    .button:hover {
        transform: translateY(-2px);
    }
    .footer-text {
        margin-top: 20px;
        font-size: 0.95rem;
        color: #e2e8f0;
    }
</style>
</head>
<body>
    <div class="card">
        <h1>✅ You Got In!</h1>
        <p>Welcome to <strong>Saucy</strong>. You’re officially inside.</p>
        
        <p>
            Click below to access the Skool community and get started:
        </p>

        <a class="button" href="https://www.skool.com/saucy-4191/about" target="_blank">
            Join Saucy on Skool
        </a>

        <p class="footer-text">
            DM <strong>Fresh</strong> on Discord (<em>freshdoes</em>) for fast onboarding ✅
        </p>
    </div>
</body>
</html>

    `);

  } catch (err) {
    console.error('❌ Session lookup failed:', err);
    res.redirect('/');
  }
});

// Cancel Page
app.get('/cancel', (req, res) => {
  res.send('<h1>❌ Payment canceled.</h1><p>No worries, try again anytime.</p>');
});

// ✅ Server start
const PORT = process.env.PORT || 4242;
app.listen(PORT, () =>
  console.log(`🚀 Saucy server running at http://localhost:${PORT}`)
);
