const Paydunya = require('paydunya');
const Ticket = require('../models/Ticket');

const setup = new Paydunya.Setup({
  masterKey: process.env.PAYDUNYA_MASTER_KEY,
  privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
  publicKey: process.env.PAYDUNYA_PUBLIC_KEY,
  token: process.env.PAYDUNYA_TOKEN,
  mode: 'test' // 'live' en production
});

exports.initPayment = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId);

    const invoice = new Paydunya.Checkout.Invoice(setup);
    invoice.addItem(ticket.classe, 1, ticket.prixTotal, ticket.prixTotal);
    invoice.totalAmount = ticket.prixTotal;
    invoice.description = `Ticket SOTRAL ${ticket.depart} → ${ticket.arrivee}`;
    
    // Custom data pour le webhook
    invoice.customData = { ticketId: ticket._id.toString() };

    await invoice.create();
    
    // Sauvegarder l'ID de paiement
    ticket.paymentId = invoice.token;
    await ticket.save();

    res.json({ success: true, paymentUrl: invoice.getResponseText().response_text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.paymentWebhook = async (req, res) => {
  const { data } = req.body;
  
  try {
    const ticket = await Ticket.findOne({ paymentId: data.token });
    if (!ticket) return res.status(404).send('Ticket non trouvé');

    if (data.status === 'completed') {
      ticket.statut = 'payé';
      await ticket.save();
      
      // Envoyer le ticket par email/SMS
      // await sendTicketConfirmation(ticket);
    }

    res.status(200).send('Webhook reçu');
  } catch (error) {
    console.error('Erreur webhook:', error);
    res.status(500).send('Erreur du serveur');
  }
};