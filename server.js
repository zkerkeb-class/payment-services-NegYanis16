require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
// Remplace par ta vraie clé secrète Stripe (sk_test_... ou sk_live_...)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_votre_cle_secrete');

app.use(cors(
  {
    origin: 'https://front-neg-yanis16-bxt5.vercel.app',
  }
));
app.use(express.json());

// Endpoint pour tester la connexion
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Serveur Stripe Checkout opérationnel' });
});

app.post('/create-checkout-session', async (req, res) => {
  const { quantity } = req.body;

  // Définir les offres
  const offers = {
    10: { price: 500, name: 'Pack 10 jetons' },   // 5,00 €
    20: { price: 900, name: 'Pack 20 jetons' },   // 9,00 €
    30: { price: 1200, name: 'Pack 30 jetons' },  // 12,00 €
  };

  const offer = offers[quantity];

  if (!offer) {
    return res.status(400).json({ error: 'Offre invalide. Choisissez 10, 20 ou 30 jetons.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: offer.name,
              description: `${quantity} jetons pour votre compte`,
            },
            unit_amount: offer.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://front-neg-yanis16-bxt5.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://front-neg-yanis16-bxt5.vercel.app/cancel',
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Erreur Stripe:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint pour récupérer les détails d'une session
app.get('/session/:sessionId', async (req, res) => {
  try {
    console.log('Récupération de la session:', req.params.sessionId);
    
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    
    console.log('Session récupérée:', {
      id: session.id,
      amount_total: session.amount_total,
      payment_status: session.payment_status,
      status: session.status
    });
    
    // Retourner les champs spécifiques nécessaires pour le frontend
    const sessionData = {
      id: session.id,
      amount_total: session.amount_total,
      payment_status: session.payment_status,
      status: session.status,
      currency: session.currency,
      customer_email: session.customer_email,
      created: session.created,
      line_items: session.line_items,
      metadata: session.metadata
    };
    
    res.json(sessionData);
  } catch (err) {
    console.error('Erreur lors de la récupération de la session:', err);
    res.status(500).json({ 
      error: err.message,
      sessionId: req.params.sessionId 
    });
  }
});

// Endpoint pour les métriques
app.get('/metrics', (req, res) => {
  const metrics = {
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  
  res.set('Content-Type', 'application/json');
  res.json(metrics);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Stripe Checkout démarré sur le port ${PORT}`);
}); 
