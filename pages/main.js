// pages/main.js

const express = require('express');
const Stripe = require('stripe');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Serve static files (JS, CSS, etc) from /pages
app.use(express.static(path.join(__dirname)));

// Redirect root to /about
app.get('/', (req, res) => {
  res.redirect('/about');
});

// Serve About page
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

// One-time payment
app.get('/buy', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: 'price_1RYSd2FU03fbQ7eGqasaFVpj', // your real product price
          quantity: 1,
        }
      ],
      success_url: 'http://localhost:4242/access',
      cancel_url: 'http://localhost:4242/cancel',
    });
    res.redirect(303, session.url);
  } catch (err) {
    console.error('❌ Checkout error:', err);
    res.status(500).send('Error creating checkout session');
  }
});

// Final "You're In" page
app.get('/access', (req, res) => {
  res.send(`
    <style>
      body { font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; text-align: center; }
      h2 { font-size: 2rem; margin-bottom: 1rem; }
      p { font-size: 1.1rem; }
    </style>

    <h2>You're in 💖</h2>
    <p>You’re fully set up with lifetime access.<br>Welcome to the vault.</p>
  `);
});

// Cancel page
app.get('/cancel', (req, res) => {
  res.send('<h1>❌ Payment canceled.</h1><p>You can try again anytime.</p>');
});

// Start server
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
