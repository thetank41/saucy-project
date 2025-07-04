// pages/main.js

const express = require('express');
const Stripe = require('stripe');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Serve static files from current folder (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Redirect root to /about
app.get('/', (req, res) => {
  res.redirect('/about');
});

// Serve the About page
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

// Stripe Checkout - One-time payment with custom field for Discord
app.get('/buy', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: 'price_1RYSd2FU03fbQ7eGqasaFVpj', // your actual Stripe Price ID
          quantity: 1,
        }
      ],
      customer_creation: 'always', // ensures email collection

      custom_fields: [
      {
        key: 'discord',
        label: {
          type: 'custom',
          custom: 'Discord Username'
        },
        type: 'text',
        text: {
          minimum_length: 3,
          maximum_length: 32
        }
      }
    ],


      success_url: 'https://freshdoes.com/access',
      cancel_url: 'https://freshdoes.com/cancel',

      metadata: {
        product: 'Saucy Presale',
        type: 'Lifetime Access'
      }
    });

    res.redirect(303, session.url);

  } catch (err) {
    console.error('❌ Checkout error:', err);
    res.status(500).send('Error creating checkout session');
  }
});

// Final access page after successful payment
app.get('/access', (req, res) => {
  res.send(`
    <style>
      body {
        font-family: sans-serif;
        padding: 2rem;
        max-width: 700px;
        margin: auto;
        text-align: center;
        line-height: 1.6;
      }
      h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
      }
      p {
        font-size: 1.1rem;
      }
      strong {
        font-weight: 600;
      }
    </style>

    <h2>✅ Payment received</h2>
    <p>Your <strong>Saucy</strong> presale spot is locked.</p>
    <p>DM <strong>Fresh</strong> (<em>skymosely</em>) on Discord with a screenshot of this page<br>to claim scripts, voice messages, and 1:1 DM access.</p>
    <p>The full video course drops once I’m back from travel — you’ll get access 48 hours before public launch.</p>
    <p style="margin-top: 2rem;"><em>Non-refundable. One purchase per person.</em></p>
  `);
});

// Cancel page if payment was canceled
app.get('/cancel', (req, res) => {
  res.send('<h1>❌ Payment canceled.</h1><p>You can try again anytime.</p>');
});

// Start the server
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
