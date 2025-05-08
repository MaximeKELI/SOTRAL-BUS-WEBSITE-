// routes/authRoutes.js

const express = require('express');
const router = express.Router();

// Exemple : connexion utilisateur
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Juste pour test (remplace plus tard par ta logique réelle)
  if (email === 'test@example.com' && password === 'password') {
    res.json({ message: 'Connexion réussie', token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ message: 'Identifiants invalides' });
  }
});

module.exports = router;
