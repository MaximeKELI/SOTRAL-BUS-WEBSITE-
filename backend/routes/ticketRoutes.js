// routes/ticketRoutes.js

const express = require('express');
const router = express.Router();

// Exemple : obtenir tous les tickets
router.get('/', (req, res) => {
  // Exemple de données fictives
  const tickets = [
    { id: 1, titre: 'Ticket A', description: 'Premier ticket' },
    { id: 2, titre: 'Ticket B', description: 'Deuxième ticket' },
  ];

  res.json(tickets);
});

// Exemple : créer un nouveau ticket
router.post('/', (req, res) => {
  const { titre, description } = req.body;

  // Tu peux ajouter ici l'enregistrement en base de données
  res.status(201).json({ message: 'Ticket créé', ticket: { titre, description } });
});

module.exports = router;
