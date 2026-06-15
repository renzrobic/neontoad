const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { db } = require('../config/firebase');

// In a real app, you would initialize Stripe with your secret key
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/stripe/create-checkout-session
// @desc    Create a Stripe checkout session (Simulated)
// @access  Private
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { tier } = req.body;
    const uid = req.user.uid;

    // SIMULATION: Instead of calling stripe.checkout.sessions.create(),
    // we will return a mock URL that the frontend can redirect to, which just redirects back.
    // In reality, you'd do:
    /*
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: 'price_XXXXX', quantity: 1 }],
      mode: 'subscription',
      success_url: `http://localhost:5173/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/account`,
      metadata: { userId: uid, tier: tier }
    });
    return res.json({ url: session.url });
    */

    console.log(`[SIMULATION] Creating checkout session for user ${uid}, tier: ${tier}`);
    
    // For our simulation, we'll just immediately upgrade them to demonstrate functionality
    if (db) {
      const userRef = db.collection('users').doc(uid);
      await userRef.update({
        membershipTier: tier || 'premium',
        membershipActive: true,
        membershipUpdatedAt: new Date().toISOString()
      });
    }

    // Return a fake URL or a signal to just reload the account page
    res.json({ simulated: true, url: '/account?simulated_success=true' });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/stripe/webhook
// @desc    Handle Stripe webhooks
// @access  Public (Stripe signature verification needed in prod)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // In prod, verify the signature:
    // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // For now, just parse the JSON manually
    event = JSON.parse(req.body.toString());
    
    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const tier = session.metadata.tier;

      // Fulfill the purchase...
      console.log(`Fulfilling purchase for user: ${userId}, tier: ${tier}`);
      if (db && userId) {
        await db.collection('users').doc(userId).update({
          membershipTier: tier,
          membershipActive: true,
          membershipUpdatedAt: new Date().toISOString()
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

module.exports = router;
