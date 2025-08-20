require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
// Remplace par ta vraie clé secrète Stripe (sk_test_... ou sk_live_...)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_votre_cle_secrete');

app.use(cors());
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
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
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

// Endpoint pour déclencher l'envoi d'email de confirmation d'achat
app.post('/send-purchase-email', async (req, res) => {
  const { sessionId, userData } = req.body;
  
  if (!sessionId || !userData) {
    return res.status(400).json({ 
      error: 'Session ID et données utilisateur sont requis' 
    });
  }
  
  try {
    // Récupérer les détails de la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Le paiement n\'est pas encore confirmé' 
      });
    }
    
    // Extraire les informations de la session
    const amount = (session.amount_total / 100).toFixed(2);
    const quantity = session.line_items?.data[0]?.description?.match(/(\d+)/)?.[1] || 'N/A';
    
    // Préparer les données pour l'email
    const emailData = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      quantity: parseInt(quantity),
      amount: amount,
      transactionId: sessionId
    };
    
    // Appeler le service de notification par email
    const mailServiceUrl = process.env.MAIL_SERVICE_URL || 'http://localhost:3004';
    const apiKey = process.env.MAIL_SERVICE_API_KEY || 'your-api-key';
    
    const response = await fetch(`${mailServiceUrl}/api/mail/send-purchase-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur du service de mail: ${errorData.error || response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Email de confirmation envoyé avec succès:', responseData);
    
    res.json({ 
      message: 'Email de confirmation envoyé avec succès',
      emailSent: true 
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    res.status(500).json({ 
      error: 'Erreur interne lors de l\'envoi de l\'email',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Stripe Checkout démarré sur le port ${PORT}`);
  // console.log(`📋 Endpoints disponibles:`);
  // console.log(`   GET  /health - Test de connexion`);
  // console.log(`   POST /create-checkout-session - Créer une session de paiement`);
  // console.log(`   GET  /session/:sessionId - Récupérer les détails d'une session`);
  // console.log(`⚠️  N'oubliez pas de configurer votre clé Stripe dans STRIPE_SECRET_KEY`);
}); 