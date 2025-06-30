// // backend/routes/paymentRoutes.js
// const express = require('express');
// const router = express.Router();
// const { createPaddlePayLink, paddleWebhookHandler } = require('../controllers/paddleController');
// const { protect } = require('../middleware/authMiddleware');

// // Endpoint for frontend to get a pay link
// router.post('/paddle-pay-link', protect, createPaddlePayLink);

// // Paddle webhook needs to be public and use x-www-form-urlencoded (default for Express if no other parser is first)
// // Ensure express.urlencoded is used before this route or specifically for it if needed.
// router.post('/paddle-webhook', paddleWebhookHandler); // No express.raw needed, Paddle sends form data

// module.exports = router;


const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
    createPayment,
    checkSolanaPayment,
    adminConfirmPayment,
    getPendingPayments,
    testEmail,
    testAllEmailFunctions
} = require('../controllers/paymentController');

// @route   POST /api/payment/create
// @desc    Create a new payment request
// @access  Private
router.post('/create', protect, createPayment);

// @route   GET /api/payment/check-solana/:paymentId
// @desc    Check Solana payment status
// @access  Private
router.get('/check-solana/:paymentId', protect, checkSolanaPayment);

// @route   POST /api/payment/admin-confirm/:paymentId
// @desc    Admin confirm payment
// @access  Private (Admin only)
router.post('/admin-confirm/:paymentId', protect, adminOnly, adminConfirmPayment);

// @route   GET /api/payment/admin/pending
// @desc    Get pending payments for admin
// @access  Private (Admin only)
router.get('/admin/pending', protect, adminOnly, getPendingPayments);

// @route   POST /api/payment/test-email
// @desc    Test email sending
// @access  Public
router.post('/test-email', testEmail);

router.post('/test-all-emails', protect, testAllEmailFunctions);

module.exports = router;