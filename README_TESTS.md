# Tests du Service de Paiement

## 📁 Structure des Tests

```
tests-simples/
└── simple.test.js         # Tests simples du service
```

## 🚀 Exécution des Tests

### Installation des dépendances
```bash
npm install
```

### Lancer les tests
```bash
npm test
```

## 📋 Description des Tests

### **simple.test.js**
- Validation des offres de jetons
- Validation des montants
- Vérification des endpoints
- Tests de base

## 🎯 Philosophie des Tests

Tests simples et basiques :
- **Pas de dépendances externes**
- **Validation de base** des données
- **Structure simple** et lisible

## 🔧 Configuration Jest

Le fichier `jest.config.js` est configuré pour :
- Cibler les fichiers dans `tests-simples/`
- Utiliser l'environnement Node.js
- Tests simples et rapides 