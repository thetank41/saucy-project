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
      <style>
        body { font-family:sans-serif; text-align:center; padding:2rem; color:#222; }
        h2 { color:green; }
      </style>
      <h2>✅ Payment Verified</h2>
      <p>You now have <strong>${plan.toUpperCase()}</strong> access to Saucy!</p>
      <p>Discord Username: <strong>${discord}</strong></p>
      <p>DM <strong>Fresh</strong> (<em>skymosely</em>) to get everything unlocked.</p>
      <a href="https://discord.gg/czhCcWzUgd">Join Discord Server</a>
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
