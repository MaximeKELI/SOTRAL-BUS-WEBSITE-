const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  depart: { type: String, required: true },
  arrivee: { type: String, required: true },
  date: { type: Date, required: true },
  heure: { type: String, required: true },
  places: { type: Number, required: true },
  classe: { type: String, enum: ['Economique', 'Confort', 'VIP'], default: 'Economique' },
  prixTotal: { type: Number, required: true },
  statut: { type: String, enum: ['confirmé', 'payé', 'annulé'], default: 'confirmé' },
  paymentId: String,
  qrCodeData: String
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);