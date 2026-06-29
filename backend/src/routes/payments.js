const router = require('express').Router();
const { createOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController');
const { optionalAuth } = require('../middleware/auth');

router.post('/order', optionalAuth, createOrder);
router.post('/verify', optionalAuth, verifyPayment);
router.post('/webhook', handleWebhook); // Razorpay webhook — no auth

module.exports = router;
