const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

router.post('/init', authMiddleware, paymentController.initPayment);
router.post('/webhook', paymentController.paymentWebhook);

module.exports = router;