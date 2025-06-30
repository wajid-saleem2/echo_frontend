// // backend/controllers/paymentController.js
// const User = require('../models/User');
// const nodemailer = require('nodemailer');
// const PDFDocument = require('pdfkit');
// const fs = require('fs');
// const path = require('path');
// const axios = require('axios');
// require('dotenv').config();

// // Configure nodemailer
// const transporter = nodemailer.createTransport({
//     service: 'gmail', // or your email service
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//     }
// });

// // Solana RPC endpoint - you can use QuickNode, Alchemy, or public RPC
// const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

// // Your wallet addresses
// const PAYMENT_ADDRESSES = {
//     SOL: '9Lk4WFB2cDpeGfMaX5Qt9kf3ThKj8vyFVbtE6zrH3HoT',
//     BTC: '1GfP9erqWFhQEBMZV1LaxpqhaJnppJEwZ1'
// };

// // Pricing plans (in USD)
// const PRICING_PLANS = {
//     basic: { price: 29, name: 'Basic Plan', duration: 30 }, // 30 days
//     pro: { price: 59, name: 'Pro Plan', duration: 30 },
//     premium: { price: 99, name: 'Premium Plan', duration: 30 }
// };

// // @desc    Create payment request
// // @route   POST /api/payment/create
// // @access  Private
// exports.createPayment = async (req, res) => {
//     try {
//         const { plan, paymentMethod } = req.body; // paymentMethod: 'SOL' or 'BTC'
//         const userId = req.user.id;

//         // Validate plan
//         if (!PRICING_PLANS[plan]) {
//             return res.status(400).json({ message: 'Invalid plan selected' });
//         }

//         // Validate payment method
//         if (!['SOL', 'BTC'].includes(paymentMethod)) {
//             return res.status(400).json({ message: 'Invalid payment method' });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Get current SOL/BTC price from CoinGecko
//         let cryptoPrice;
//         try {
//             const coinId = paymentMethod === 'SOL' ? 'solana' : 'bitcoin';
//             const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
//             cryptoPrice = response.data[coinId].usd;
//         } catch (error) {
//             console.error('Failed to fetch crypto price:', error);
//             return res.status(500).json({ message: 'Failed to fetch current crypto prices' });
//         }

//         // Calculate amount in crypto
//         const usdAmount = PRICING_PLANS[plan].price;
//         const cryptoAmount = (usdAmount / cryptoPrice).toFixed(6);

//         // Create payment record
//         const payment = {
//             amount: parseFloat(cryptoAmount),
//             currency: paymentMethod,
//             toAddress: PAYMENT_ADDRESSES[paymentMethod],
//             status: 'pending'
//         };

//         user.payments.push(payment);
//         user.subscription.plan = plan;
//         user.subscription.paymentStatus = 'pending';
        
//         await user.save();

//         // Get the created payment ID
//         const latestPayment = user.getLatestPayment();

//         res.json({
//             paymentId: latestPayment._id,
//             amount: cryptoAmount,
//             currency: paymentMethod,
//             toAddress: PAYMENT_ADDRESSES[paymentMethod],
//             plan: PRICING_PLANS[plan],
//             usdAmount,
//             message: `Please send exactly ${cryptoAmount} ${paymentMethod} to the address above`
//         });

//     } catch (error) {
//         console.error('Create payment error:', error);
//         res.status(500).json({ message: 'Server error creating payment' });
//     }
// };

// // @desc    Check Solana payment status
// // @route   GET /api/payment/check-solana/:paymentId
// // @access  Private
// exports.checkSolanaPayment = async (req, res) => {
//     try {
//         const { paymentId } = req.params;
//         const userId = req.user.id;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const payment = user.payments.id(paymentId);
//         if (!payment) {
//             return res.status(404).json({ message: 'Payment not found' });
//         }

//         if (payment.status === 'confirmed') {
//             return res.json({ status: 'confirmed', payment });
//         }

//         // Check Solana blockchain for transactions to our address
//         try {
//             const response = await axios.post(SOLANA_RPC_URL, {
//                 jsonrpc: '2.0',
//                 id: 1,
//                 method: 'getSignaturesForAddress',
//                 params: [
//                     PAYMENT_ADDRESSES.SOL,
//                     {
//                         limit: 10,
//                         commitment: 'confirmed'
//                     }
//                 ]
//             });

//             const signatures = response.data.result;
            
//             // Check recent transactions
//             for (const sig of signatures) {
//                 // Get transaction details
//                 const txResponse = await axios.post(SOLANA_RPC_URL, {
//                     jsonrpc: '2.0',
//                     id: 1,
//                     method: 'getTransaction',
//                     params: [
//                         sig.signature,
//                         {
//                             encoding: 'json',
//                             commitment: 'confirmed',
//                             maxSupportedTransactionVersion: 0
//                         }
//                     ]
//                 });

//                 const transaction = txResponse.data.result;
//                 if (!transaction) continue;

//                 // Check if transaction amount matches expected payment
//                 const postBalances = transaction.meta.postBalances;
//                 const preBalances = transaction.meta.preBalances;
                
//                 // This is a simplified check - you might want to implement more robust verification
//                 const balanceChange = (postBalances[1] - preBalances[1]) / 1000000000; // Convert lamports to SOL
                
//                 if (Math.abs(balanceChange - payment.amount) < 0.001) { // Allow small difference for fees
//                     // Payment found!
//                     payment.status = 'confirmed';
//                     payment.confirmationDate = new Date();
//                     payment.blockchainTxHash = sig.signature;
                    
//                     // Don't activate subscription yet - wait for admin confirmation
//                     await user.save();
                    
//                     // Send email notifications
//                     await sendPaymentNotifications(user, payment);
                    
//                     return res.json({ 
//                         status: 'confirmed', 
//                         payment,
//                         message: 'Payment confirmed! Waiting for admin approval to activate subscription.' 
//                     });
//                 }
//             }

//             res.json({ status: 'pending', message: 'Payment not yet confirmed on blockchain' });

//         } catch (blockchainError) {
//             console.error('Blockchain check error:', blockchainError);
//             res.status(500).json({ message: 'Error checking blockchain' });
//         }

//     } catch (error) {
//         console.error('Check payment error:', error);
//         res.status(500).json({ message: 'Server error checking payment' });
//     }
// };

// // @desc    Admin confirm payment
// // @route   POST /api/payment/admin-confirm/:paymentId
// // @access  Private (Admin only)
// exports.adminConfirmPayment = async (req, res) => {
//     try {
//         const { paymentId } = req.params;
//         const { userId } = req.body;

//         // Check if current user is admin
//         if (req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Access denied. Admin only.' });
//         }

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const payment = user.payments.id(paymentId);
//         if (!payment) {
//             return res.status(404).json({ message: 'Payment not found' });
//         }

//         // Confirm payment and activate subscription
//         payment.adminConfirmed = true;
//         payment.adminConfirmedBy = req.user.id;
//         payment.adminConfirmedAt = new Date();

//         // Activate subscription
//         const planDuration = PRICING_PLANS[user.subscription.plan].duration;
//         user.subscription.isActive = true;
//         user.subscription.paymentStatus = 'confirmed';
//         user.subscription.startDate = new Date();
//         user.subscription.expiryDate = new Date(Date.now() + planDuration * 24 * 60 * 60 * 1000);

//         await user.save();

//         // Send confirmation email to user
//         await sendSubscriptionActivatedEmail(user, payment);

//         res.json({
//             message: 'Payment confirmed and subscription activated',
//             user: {
//                 email: user.email,
//                 username: user.username,
//                 subscription: user.subscription
//             }
//         });

//     } catch (error) {
//         console.error('Admin confirm payment error:', error);
//         res.status(500).json({ message: 'Server error confirming payment' });
//     }
// };

// // @desc    Get pending payments for admin
// // @route   GET /api/payment/admin/pending
// // @access  Private (Admin only)
// exports.getPendingPayments = async (req, res) => {
//     try {
//         // Check if current user is admin
//         if (req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Access denied. Admin only.' });
//         }

//         const users = await User.find({
//             'payments': {
//                 $elemMatch: {
//                     status: 'confirmed',
//                     adminConfirmed: false
//                 }
//             }
//         }).select('username email payments subscription');

//         const pendingPayments = [];
//         users.forEach(user => {
//             user.payments.forEach(payment => {
//                 if (payment.status === 'confirmed' && !payment.adminConfirmed) {
//                     pendingPayments.push({
//                         userId: user._id,
//                         username: user.username,
//                         email: user.email,
//                         paymentId: payment._id,
//                         payment: payment,
//                         plan: user.subscription.plan
//                     });
//                 }
//             });
//         });

//         res.json(pendingPayments);

//     } catch (error) {
//         console.error('Get pending payments error:', error);
//         res.status(500).json({ message: 'Server error fetching pending payments' });
//     }
// };

// // Helper functions for email notifications
// const generateInvoicePDF = async (user, payment) => {
//     return new Promise((resolve, reject) => {
//         const doc = new PDFDocument();
//         const filename = `invoice-${payment._id}.pdf`;
//         const filepath = path.join(__dirname, '../temp', filename);

//         // Ensure temp directory exists
//         const tempDir = path.dirname(filepath);
//         if (!fs.existsSync(tempDir)) {
//             fs.mkdirSync(tempDir, { recursive: true });
//         }

//         doc.pipe(fs.createWriteStream(filepath));

//         // PDF content
//         doc.fontSize(20).text('EchoWrite - Payment Invoice', 50, 50);
//         doc.fontSize(12)
//            .text(`Invoice ID: ${payment._id}`, 50, 100)
//            .text(`Customer: ${user.username}`, 50, 120)
//            .text(`Email: ${user.email}`, 50, 140)
//            .text(`Plan: ${PRICING_PLANS[user.subscription.plan].name}`, 50, 160)
//            .text(`Amount: ${payment.amount} ${payment.currency}`, 50, 180)
//            .text(`Payment Date: ${payment.paymentDate.toLocaleDateString()}`, 50, 200)
//            .text(`Status: ${payment.status}`, 50, 220)
//            .text(`Transaction Hash: ${payment.blockchainTxHash || 'Pending'}`, 50, 240);

//         doc.end();

//         doc.on('end', () => resolve(filepath));
//         doc.on('error', reject);
//     });
// };

// const sendPaymentNotifications = async (user, payment) => {
//     try {
//         // Generate PDF invoice
//         const invoicePath = await generateInvoicePDF(user, payment);

//         // Send email to customer
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: user.email,
//             subject: 'EchoWrite - Payment Confirmation',
//             html: `
//                 <h2>Payment Confirmed!</h2>
//                 <p>Dear ${user.username},</p>
//                 <p>We have confirmed your payment of ${payment.amount} ${payment.currency}.</p>
//                 <p>Your payment is now waiting for admin approval to activate your subscription.</p>
//                 <p><strong>Transaction Details:</strong></p>
//                 <ul>
//                     <li>Amount: ${payment.amount} ${payment.currency}</li>
//                     <li>Plan: ${PRICING_PLANS[user.subscription.plan].name}</li>
//                     <li>Transaction Hash: ${payment.blockchainTxHash}</li>
//                 </ul>
//                 <p>You will receive another email once your subscription is activated.</p>
//                 <p>Thank you for choosing EchoWrite!</p>
//             `,
//             attachments: [
//                 {
//                     filename: 'invoice.pdf',
//                     path: invoicePath
//                 }
//             ]
//         });

//         // Send email to admin
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: process.env.ADMIN_EMAIL,
//             subject: 'EchoWrite - New Payment Confirmation Required',
//             html: `
//                 <h2>New Payment Awaiting Confirmation</h2>
//                 <p><strong>Customer Details:</strong></p>
//                 <ul>
//                     <li>Username: ${user.username}</li>
//                     <li>Email: ${user.email}</li>
//                     <li>Plan: ${PRICING_PLANS[user.subscription.plan].name}</li>
//                 </ul>
//                 <p><strong>Payment Details:</strong></p>
//                 <ul>
//                     <li>Amount: ${payment.amount} ${payment.currency}</li>
//                     <li>To Address: ${payment.toAddress}</li>
//                     <li>Transaction Hash: ${payment.blockchainTxHash}</li>
//                     <li>Payment Date: ${payment.paymentDate}</li>
//                 </ul>
//                 <p>Please verify the payment in your wallet and confirm via the admin panel.</p>
//             `,
//             attachments: [
//                 {
//                     filename: 'invoice.pdf',
//                     path: invoicePath
//                 }
//             ]
//         });

//         // Clean up temporary file
//         setTimeout(() => {
//             if (fs.existsSync(invoicePath)) {
//                 fs.unlinkSync(invoicePath);
//             }
//         }, 5000);

//     } catch (error) {
//         console.error('Error sending payment notifications:', error);
//     }
// };

// const sendSubscriptionActivatedEmail = async (user, payment) => {
//     try {
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: user.email,
//             subject: 'EchoWrite - Subscription Activated!',
//             html: `
//                 <h2>Welcome to EchoWrite ${PRICING_PLANS[user.subscription.plan].name}!</h2>
//                 <p>Dear ${user.username},</p>
//                 <p>Great news! Your subscription has been activated.</p>
//                 <p><strong>Subscription Details:</strong></p>
//                 <ul>
//                     <li>Plan: ${PRICING_PLANS[user.subscription.plan].name}</li>
//                     <li>Start Date: ${user.subscription.startDate.toLocaleDateString()}</li>
//                     <li>Expiry Date: ${user.subscription.expiryDate.toLocaleDateString()}</li>
//                 </ul>
//                 <p>You can now access all premium features of your account.</p>
//                 <p><a href="${process.env.FRONTEND_URL}/dashboard">Login to your dashboard</a></p>
//                 <p>Thank you for choosing EchoWrite!</p>
//             `
//         });
//     } catch (error) {
//         console.error('Error sending subscription activated email:', error);
//     }
// };

// backend/controllers/paymentController.js
const User = require('../models/User');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Multiple Solana RPC endpoints for redundancy
const SOLANA_RPC_ENDPOINTS = [
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana'
];

// Rate limiting configuration
const rateLimitConfig = {
    requestsPerMinute: 10,
    requestHistory: new Map(),
    lastEndpointUsed: 0
};

// Your wallet addresses
const PAYMENT_ADDRESSES = {
    SOL: '9Lk4WFB2cDpeGfMaX5Qt9kf3ThKj8vyFVbtE6zrH3HoT',
    BTC: '1GfP9erqWFhQEBMZ V1LaxpqhaJnppJEwZ1'
};

// Pricing plans (in USD)
const PRICING_PLANS = {
    basic: { price: 29, name: 'Basic Plan', duration: 30 }, // 30 days
    pro: { price: 59, name: 'Pro Plan', duration: 30 },
    premium: { price: 99, name: 'Premium Plan', duration: 30 }
};

// Helper function to manage rate limiting
const canMakeRequest = (endpoint) => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    if (!rateLimitConfig.requestHistory.has(endpoint)) {
        rateLimitConfig.requestHistory.set(endpoint, []);
    }
    
    const requests = rateLimitConfig.requestHistory.get(endpoint);
    
    // Remove requests older than 1 minute
    const recentRequests = requests.filter(timestamp => timestamp > oneMinuteAgo);
    rateLimitConfig.requestHistory.set(endpoint, recentRequests);
    
    return recentRequests.length < rateLimitConfig.requestsPerMinute;
};

// Helper function to record request
const recordRequest = (endpoint) => {
    if (!rateLimitConfig.requestHistory.has(endpoint)) {
        rateLimitConfig.requestHistory.set(endpoint, []);
    }
    
    const requests = rateLimitConfig.requestHistory.get(endpoint);
    requests.push(Date.now());
};

// Helper function to get next available endpoint
const getNextEndpoint = () => {
    const startIndex = rateLimitConfig.lastEndpointUsed;
    
    for (let i = 0; i < SOLANA_RPC_ENDPOINTS.length; i++) {
        const index = (startIndex + i) % SOLANA_RPC_ENDPOINTS.length;
        const endpoint = SOLANA_RPC_ENDPOINTS[index];
        
        if (canMakeRequest(endpoint)) {
            rateLimitConfig.lastEndpointUsed = index;
            return endpoint;
        }
    }
    
    return null; // No available endpoints
};

// Helper function to make RPC call with retry logic
const makeRpcCall = async (data, maxRetries = 3) => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const endpoint = getNextEndpoint();
        
        if (!endpoint) {
            // Wait for rate limit to reset
            console.log('All endpoints rate limited, waiting...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            continue;
        }
        
        try {
            recordRequest(endpoint);
            
            const response = await axios.post(endpoint, data, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            return response;
            
        } catch (error) {
            lastError = error;
            console.log(`RPC call failed on ${endpoint}:`, error.response?.status, error.message);
            
            if (error.response?.status === 429) {
                // Rate limited, try next endpoint
                console.log(`Rate limited on ${endpoint}, trying next...`);
                continue;
            }
            
            if (error.response?.status >= 500) {
                // Server error, try next endpoint
                console.log(`Server error on ${endpoint}, trying next...`);
                continue;
            }
            
            // For other errors, wait before retry
            if (attempt < maxRetries - 1) {
                const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`Waiting ${backoffTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }
    }
    
    throw lastError;
};

// @desc    Create payment request
// @route   POST /api/payment/create
// @access  Private
exports.createPayment = async (req, res) => {
    try {
        const { plan, paymentMethod } = req.body; // paymentMethod: 'SOL' or 'BTC'
        const userId = req.user.id;

        // Validate plan
        if (!PRICING_PLANS[plan]) {
            return res.status(400).json({ message: 'Invalid plan selected' });
        }

        // Validate payment method
        if (!['SOL', 'BTC'].includes(paymentMethod)) {
            return res.status(400).json({ message: 'Invalid payment method' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get current SOL/BTC price from CoinGecko
        let cryptoPrice;
        try {
            const coinId = paymentMethod === 'SOL' ? 'solana' : 'bitcoin';
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
                timeout: 10000
            });
            cryptoPrice = response.data[coinId].usd;
        } catch (error) {
            console.error('Failed to fetch crypto price:', error);
            return res.status(500).json({ message: 'Failed to fetch current crypto prices' });
        }

        // Calculate amount in crypto
        const usdAmount = PRICING_PLANS[plan].price;
        const cryptoAmount = (usdAmount / cryptoPrice).toFixed(6);

        // Create payment record
        const payment = {
            amount: parseFloat(cryptoAmount),
            currency: paymentMethod,
            toAddress: PAYMENT_ADDRESSES[paymentMethod],
            status: 'pending',
            paymentDate: new Date()
        };

        user.payments.push(payment);
        user.subscription.plan = plan;
        user.subscription.paymentStatus = 'pending';
        
        await user.save();

        // Get the created payment ID
        const latestPayment = user.getLatestPayment();

        res.json({
            paymentId: latestPayment._id,
            amount: cryptoAmount,
            currency: paymentMethod,
            toAddress: PAYMENT_ADDRESSES[paymentMethod],
            plan: PRICING_PLANS[plan],
            usdAmount,
            message: `Please send exactly ${cryptoAmount} ${paymentMethod} to the address above`
        });

    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ message: 'Server error creating payment' });
    }
};

// @desc    Check Solana payment status
// @route   GET /api/payment/check-solana/:paymentId
// @access  Private
const HELIUS_API_KEY = process.env.HELIUS_API_KEY; // Get free API key from helius.xyz
const HELIUS_RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

exports.checkSolanaPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        const payment = user.payments.id(paymentId);

        if (payment.status === 'confirmed') {
            return res.json({ status: 'confirmed', payment });
        }

        // Use Helius Enhanced Transactions API
        const response = await axios.get(`https://api.helius.xyz/v0/addresses/${PAYMENT_ADDRESSES.SOL}/transactions`, {
            params: {
                'api-key': HELIUS_API_KEY,
                limit: 10,
                commitment: 'confirmed'
            },
            timeout: 10000
        });

        const transactions = response.data;

        for (const tx of transactions) {
            // Check if transaction is recent (within payment window)
            const txTime = new Date(tx.timestamp * 1000);
            const timeDiff = Date.now() - txTime.getTime();
            
            if (timeDiff > 3600000) continue; // Skip old transactions

            // Check native transfers
            const nativeTransfers = tx.nativeTransfers || [];
            
            for (const transfer of nativeTransfers) {
                if (transfer.toUserAccount === PAYMENT_ADDRESSES.SOL) {
                    const receivedAmount = transfer.amount / 1000000000; // Convert lamports to SOL
                    const expectedAmount = payment.amount;
                    const tolerance = 0.01;

                    if (Math.abs(receivedAmount - expectedAmount) < tolerance) {
                        // Payment confirmed!
                        payment.status = 'confirmed';
                        payment.confirmationDate = new Date();
                        payment.blockchainTxHash = tx.signature;
                        payment.blockTime = txTime;
                        
                        await user.save();
                        await sendPaymentNotifications(user, payment);
                        
                        return res.json({ 
                            status: 'confirmed', 
                            payment,
                            message: 'Payment confirmed!' 
                        });
                    }
                }
            }
        }

        res.json({ status: 'pending', message: 'Payment not found yet' });

    } catch (error) {
        console.error('Helius payment check error:', error);
        res.status(500).json({ message: 'Error checking payment' });
    }
};
// exports.checkSolanaPayment = async (req, res) => {
//     try {
//         const { paymentId } = req.params;
//         const userId = req.user.id;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const payment = user.payments.id(paymentId);
//         if (!payment) {
//             return res.status(404).json({ message: 'Payment not found' });
//         }

//         if (payment.status === 'confirmed') {
//             return res.json({ status: 'confirmed', payment });
//         }

//         // Check if payment is too old (older than 1 hour)
//         const paymentAge = Date.now() - payment.paymentDate.getTime();
//         if (paymentAge > 3600000) { // 1 hour in milliseconds
//             return res.json({ 
//                 status: 'timeout', 
//                 message: 'Payment verification timeout. Please contact support if you have made the payment.' 
//             });
//         }

//         // Check Solana blockchain for transactions to our address
//         try {
//             console.log('Checking Solana payment for:', paymentId);
            
//             // Get signatures for address
//             const signaturesResponse = await makeRpcCall({
//                 jsonrpc: '2.0',
//                 id: 1,
//                 method: 'getSignaturesForAddress',
//                 params: [
//                     PAYMENT_ADDRESSES.SOL,
//                     {
//                         limit: 20,
//                         commitment: 'confirmed'
//                     }
//                 ]
//             });

//             const signatures = signaturesResponse.data.result;
            
//             if (!signatures || signatures.length === 0) {
//                 return res.json({ status: 'pending', message: 'No transactions found yet' });
//             }
            
//             console.log(`Found ${signatures.length} signatures to check`);
            
//             // Check recent transactions (limit to prevent too many requests)
//             const recentSignatures = signatures.slice(0, 10);
            
//             for (const sig of recentSignatures) {
//                 try {
//                     // Add delay between requests to avoid rate limiting
//                     await new Promise(resolve => setTimeout(resolve, 1000));
                    
//                     // Get transaction details
//                     const txResponse = await makeRpcCall({
//                         jsonrpc: '2.0',
//                         id: 1,
//                         method: 'getTransaction',
//                         params: [
//                             sig.signature,
//                             {
//                                 encoding: 'json',
//                                 commitment: 'confirmed',
//                                 maxSupportedTransactionVersion: 0
//                             }
//                         ]
//                     });

//                     const transaction = txResponse.data.result;
//                     if (!transaction || !transaction.meta) {
//                         console.log(`No transaction data for signature: ${sig.signature}`);
//                         continue;
//                     }

//                     // More robust payment verification
//                     const { meta, transaction: txData } = transaction;
                    
//                     // Check if transaction is recent enough (within last hour)
//                     const blockTime = transaction.blockTime * 1000; // Convert to milliseconds
//                     const timeDiff = Date.now() - blockTime;
                    
//                     if (timeDiff > 3600000) { // Skip transactions older than 1 hour
//                         continue;
//                     }
                    
//                     // Check pre and post balances
//                     const preBalances = meta.preBalances;
//                     const postBalances = meta.postBalances;
                    
//                     if (!preBalances || !postBalances || preBalances.length !== postBalances.length) {
//                         continue;
//                     }
                    
//                     // Look for balance changes that match our expected payment
//                     for (let i = 0; i < preBalances.length; i++) {
//                         const balanceChange = (postBalances[i] - preBalances[i]) / 1000000000; // Convert lamports to SOL
                        
//                         // Check if this balance change matches our expected payment (with tolerance for fees)
//                         const expectedAmount = payment.amount;
//                         const tolerance = 0.01; // 0.01 SOL tolerance
                        
//                         if (Math.abs(Math.abs(balanceChange) - expectedAmount) < tolerance) {
//                             console.log(`Payment found! Expected: ${expectedAmount}, Found: ${Math.abs(balanceChange)}`);
                            
//                             // Payment found!
//                             payment.status = 'confirmed';
//                             payment.confirmationDate = new Date();
//                             payment.blockchainTxHash = sig.signature;
//                             payment.blockTime = new Date(blockTime);
                            
//                             await user.save();
                            
//                             // Send email notifications
//                             await sendPaymentNotifications(user, payment);
                            
//                             return res.json({ 
//                                 status: 'confirmed', 
//                                 payment,
//                                 message: 'Payment confirmed! Waiting for admin approval to activate subscription.' 
//                             });
//                         }
//                     }
                    
//                 } catch (txError) {
//                     console.error(`Error checking transaction ${sig.signature}:`, txError.message);
//                     continue; // Skip this transaction and continue with next
//                 }
//             }

//             res.json({ 
//                 status: 'pending', 
//                 message: 'Payment not yet confirmed on blockchain. Please wait a few minutes and try again.' 
//             });

//         } catch (blockchainError) {
//             console.error('Blockchain check error:', blockchainError);
            
//             // Check if it's a rate limiting error
//             if (blockchainError.response?.status === 429) {
//                 return res.json({ 
//                     status: 'rate_limited', 
//                     message: 'Too many requests. Please wait a minute and try again.',
//                     retryAfter: blockchainError.response.headers['retry-after'] || 60
//                 });
//             }
            
//             res.status(500).json({ 
//                 message: 'Error checking blockchain. Please try again later.',
//                 error: blockchainError.message 
//             });
//         }

//     } catch (error) {
//         console.error('Check payment error:', error);
//         res.status(500).json({ message: 'Server error checking payment' });
//     }
// };

// @desc    Admin confirm payment
// @route   POST /api/payment/admin-confirm/:paymentId
// @access  Private (Admin only)
exports.adminConfirmPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { userId } = req.body;

        // Check if current user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const payment = user.payments.id(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Confirm payment and activate subscription
        payment.adminConfirmed = true;
        payment.adminConfirmedBy = req.user.id;
        payment.adminConfirmedAt = new Date();

        // Activate subscription
        const planDuration = PRICING_PLANS[user.subscription.plan].duration;
        user.subscription.isActive = true;
        user.subscription.paymentStatus = 'confirmed';
        user.subscription.startDate = new Date();
        user.subscription.expiryDate = new Date(Date.now() + planDuration * 24 * 60 * 60 * 1000);

        await user.save();

        // Send confirmation email to user
        await sendSubscriptionActivatedEmail(user, payment);

        res.json({
            message: 'Payment confirmed and subscription activated',
            user: {
                email: user.email,
                username: user.username,
                subscription: user.subscription
            }
        });

    } catch (error) {
        console.error('Admin confirm payment error:', error);
        res.status(500).json({ message: 'Server error confirming payment' });
    }
};

// @desc    Get pending payments for admin
// @route   GET /api/payment/admin/pending
// @access  Private (Admin only)
exports.getPendingPayments = async (req, res) => {
    try {
        // Check if current user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const users = await User.find({
            'payments': {
                $elemMatch: {
                    status: 'confirmed',
                    adminConfirmed: false
                }
            }
        }).select('username email payments subscription');

        const pendingPayments = [];
        users.forEach(user => {
            user.payments.forEach(payment => {
                if (payment.status === 'confirmed' && !payment.adminConfirmed) {
                    pendingPayments.push({
                        userId: user._id,
                        username: user.username,
                        email: user.email,
                        paymentId: payment._id,
                        payment: payment,
                        plan: user.subscription.plan
                    });
                }
            });
        });

        res.json(pendingPayments);

    } catch (error) {
        console.error('Get pending payments error:', error);
        res.status(500).json({ message: 'Server error fetching pending payments' });
    }
};

// Helper functions for email notifications
const generateInvoicePDF = async (user, payment) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const filename = `invoice-${payment._id}.pdf`;
        const filepath = path.join(__dirname, '../temp', filename);

        // Ensure temp directory exists
        const tempDir = path.dirname(filepath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        doc.pipe(fs.createWriteStream(filepath));

        // PDF content
        doc.fontSize(20).text('EchoWrite - Payment Invoice', 50, 50);
        doc.fontSize(12)
           .text(`Invoice ID: ${payment._id}`, 50, 100)
           .text(`Customer: ${user.username}`, 50, 120)
           .text(`Email: ${user.email}`, 50, 140)
           .text(`Plan: ${PRICING_PLANS[user.subscription.plan].name}`, 50, 160)
           .text(`Amount: ${payment.amount} ${payment.currency}`, 50, 180)
           .text(`Payment Date: ${payment.paymentDate.toLocaleDateString()}`, 50, 200)
           .text(`Status: ${payment.status}`, 50, 220)
           .text(`Transaction Hash: ${payment.blockchainTxHash || 'Pending'}`, 50, 240);

        doc.end();

        doc.on('end', () => resolve(filepath));
        doc.on('error', reject);
    });
};

const sendPaymentNotifications = async (user, payment) => {
    try {
        // Generate PDF invoice
        const invoicePath = await generateInvoicePDF(user, payment);

        // Send email to customer
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'EchoWrite - Payment Confirmation',
            html: `
                <h2>Payment Confirmed!</h2>
                <p>Dear ${user.username},</p>
                <p>We have confirmed your payment of ${payment.amount} ${payment.currency}.</p>
                <p>Your payment is now waiting for admin approval to activate your subscription.</p>
                <p><strong>Transaction Details:</strong></p>
                <ul>
                    <li>Amount: ${payment.amount} ${payment.currency}</li>
                    <li>Plan: ${PRICING_PLANS[user.subscription.plan].name}</li>
                    <li>Transaction Hash: ${payment.blockchainTxHash}</li>
                </ul>
                <p>You will receive another email once your subscription is activated.</p>
                <p>Thank you for choosing EchoWrite!</p>
            `,
            attachments: [
                {
                    filename: 'invoice.pdf',
                    path: invoicePath
                }
            ]
        });

        // Send email to admin
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: 'EchoWrite - New Payment Confirmation Required',
            html: `
                <h2>New Payment Awaiting Confirmation</h2>
                <p><strong>Customer Details:</strong></p>
                <ul>
                    <li>Username: ${user.username}</li>
                    <li>Email: ${user.email}</li>
                    <li>Plan: ${PRICING_PLANS[user.subscription.plan].name}</li>
                </ul>
                <p><strong>Payment Details:</strong></p>
                <ul>
                    <li>Amount: ${payment.amount} ${payment.currency}</li>
                    <li>To Address: ${payment.toAddress}</li>
                    <li>Transaction Hash: ${payment.blockchainTxHash}</li>
                    <li>Payment Date: ${payment.paymentDate}</li>
                </ul>
                <p>Please verify the payment in your wallet and confirm via the admin panel.</p>
            `,
            attachments: [
                {
                    filename: 'invoice.pdf',
                    path: invoicePath
                }
            ]
        });

        // Clean up temporary file
        setTimeout(() => {
            if (fs.existsSync(invoicePath)) {
                fs.unlinkSync(invoicePath);
            }
        }, 5000);

    } catch (error) {
        console.error('Error sending payment notifications:', error);
    }
};

const sendSubscriptionActivatedEmail = async (user, payment) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'EchoWrite - Subscription Activated!',
            html: `
                <h2>Welcome to EchoWrite ${PRICING_PLANS[user.subscription.plan].name}!</h2>
                <p>Dear ${user.username},</p>
                <p>Great news! Your subscription has been activated.</p>
                <p><strong>Subscription Details:</strong></p>
                <ul>
                    <li>Plan: ${PRICING_PLANS[user.subscription.plan].name}</li>
                    <li>Start Date: ${user.subscription.startDate.toLocaleDateString()}</li>
                    <li>Expiry Date: ${user.subscription.expiryDate.toLocaleDateString()}</li>
                </ul>
                <p>You can now access all premium features of your account.</p>
                <p><a href="${process.env.FRONTEND_URL}/dashboard">Login to your dashboard</a></p>
                <p>Thank you for choosing EchoWrite!</p>
            `
        });
    } catch (error) {
        console.error('Error sending subscription activated email:', error);
    }
};

exports.testEmail = async (req, res) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: req.body.email,
            subject: 'Test Email',
            html: '<h1>Email is working!</h1>'
        });
        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Email test failed:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add this to the bottom of your paymentController.js file
exports.testAllEmailFunctions = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        console.log('🧪 Testing all email functions...');
        console.log('Test email will be sent to:', email);

        // Create mock user data (exactly like your real user model)
        const mockUser = {
            _id: 'test-user-id-123',
            username: 'TestUser',
            email: email,
            subscription: {
                plan: 'pro', // Test with 'pro' plan
                startDate: new Date(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }
        };

        // Create mock payment data (exactly like your real payment model)
        const mockPayment = {
            _id: 'test-payment-id-456',
            amount: 0.393333, // Example SOL amount for $59 Pro plan
            currency: 'SOL',
            toAddress: PAYMENT_ADDRESSES.SOL, // Your actual wallet address
            status: 'confirmed',
            blockchainTxHash: '4xK8Z2mN5vQ7rR3tY6wE1pL9cV8bA2hF5xS3dG7jN9mK1qW4eR6tY8uI0pL3cV5bN2hF9xS', // Mock transaction hash
            paymentDate: new Date(Date.now() - 300000), // 5 minutes ago
            confirmationDate: new Date(),
            blockTime: new Date()
        };

        console.log('Mock data created:');
        console.log('- User:', mockUser.username, mockUser.email);
        console.log('- Payment:', mockPayment.amount, mockPayment.currency);
        console.log('- Plan:', mockUser.subscription.plan);

        // Test 1: Payment Confirmation Email (to customer + admin)
        console.log('\n📧 Testing payment notification emails...');
        try {
            await sendPaymentNotifications(mockUser, mockPayment);
            console.log('✅ Payment notification emails sent successfully');
        } catch (error) {
            console.error('❌ Payment notification failed:', error.message);
            throw new Error('Payment notification test failed: ' + error.message);
        }

        // Test 2: Subscription Activated Email
        console.log('\n📧 Testing subscription activation email...');
        try {
            await sendSubscriptionActivatedEmail(mockUser, mockPayment);
            console.log('✅ Subscription activation email sent successfully');
        } catch (error) {
            console.error('❌ Subscription activation failed:', error.message);
            throw new Error('Subscription activation test failed: ' + error.message);
        }

        // Success response
        res.json({
            success: true,
            message: 'All email functions tested successfully! 🎉',
            emailsSent: [
                'Payment confirmation (to customer)',
                'Payment notification (to admin)', 
                'Subscription activation (to customer)'
            ],
            testData: {
                user: {
                    username: mockUser.username,
                    email: mockUser.email,
                    plan: mockUser.subscription.plan
                },
                payment: {
                    amount: mockPayment.amount,
                    currency: mockPayment.currency,
                    status: mockPayment.status
                }
            },
            note: 'Check your inbox and spam folder. You should receive 2 emails, and admin should receive 1 email.'
        });

    } catch (error) {
        console.error('❌ Email function test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Email function test failed',
            error: error.message,
            troubleshooting: {
                checkEnvVars: 'Verify EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL are set',
                checkGmail: 'Make sure you are using Gmail App Password (not regular password)',
                checkSpam: 'Check spam folder for test emails'
            }
        });
    }
};
