# Service de Paiement Stripe - Jetons

Service backend pour vendre des jetons via Stripe Checkout avec envoi automatique d'emails de confirmation.

## 🚀 Installation

1. **Installer les dépendances :**
```bash
npm install
```

2. **Configurer Stripe et le service de mail :**
   - Crée un compte sur [Stripe Dashboard](https://dashboard.stripe.com/register)
   - Récupère ta clé secrète (sk_test_... pour les tests, sk_live_... pour la production)
   - Crée un fichier `.env` à la racine du projet :
   ```
   STRIPE_SECRET_KEY=sk_test_ta_cle_secrete_ici
   MAIL_SERVICE_URL=http://localhost:3004
   MAIL_SERVICE_API_KEY=votre-cle-api-secrete
   PORT=3003
   ```

3. **Lancer le serveur :**
```bash
npm start
```

## 📋 Endpoints

- `GET /health` - Test de connexion
- `POST /create-checkout-session` - Créer une session de paiement
- `GET /session/:sessionId` - Récupérer les détails d'une session
- `POST /send-purchase-email` - Envoyer un email de confirmation d'achat

## 💰 Offres disponibles

- **Pack 10 jetons** : 5,00 €
- **Pack 20 jetons** : 9,00 €  
- **Pack 30 jetons** : 12,00 €

## 🔧 Utilisation

### Créer une session de paiement :
```javascript
fetch('http://localhost:3003/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 20 }) // 10, 20 ou 30
})
.then(res => res.json())
.then(data => window.location.href = data.url);
```

### Envoyer un email de confirmation :
```javascript
fetch('http://localhost:3003/send-purchase-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'cs_test_...',
    userData: {
      email: 'client@example.com',
      firstName: 'Prénom',
      lastName: 'Nom'
    }
  })
});
```

## 📧 Fonctionnalité d'email automatique

Après un paiement réussi, le service :
1. Récupère automatiquement les détails de la session Stripe
2. Extrait les informations de l'achat (quantité, montant)
3. Envoie un email de confirmation avec tous les détails
4. L'email contient un template HTML professionnel

## 🧪 Tester avec les cartes Stripe :
- **Succès** : 4242 4242 4242 4242
- **Échec** : 4000 0000 0000 0002

## ⚠️ Important

- Remplace `sk_test_votre_cle_secrete_ici` par ta vraie clé Stripe
- En production, utilise `sk_live_...` au lieu de `sk_test_...`
- Configure les URLs de succès/échec selon ton domaine 