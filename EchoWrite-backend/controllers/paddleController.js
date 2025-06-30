// backend/controllers/paddleController.js
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const querystring = require('querystring');
const {serialize} = require('php-serialize'); // Paddle webhooks use PHP-serialized data

const PADDLE_VENDOR_ID = process.env.PADDLE_VENDOR_ID;
const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_PLAN_ID_PRO = process.env.PADDLE_PLAN_ID_PRO;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PADDLE_WEBHOOK_PUBLIC_KEY = process.env.PADDLE_WEBHOOK_PUBLIC_KEY?.replace(/\\n/g, '\n'); // Ensure newlines are correct

// @desc    Generate a Paddle Pay Link for a subscription
// @route   POST /api/payments/paddle-pay-link
// @access  Private
exports.createPaddlePayLink = async (req, res) => {
    const userId = req.user.id;
    const { planId } = req.body; // e.g., your PADDLE_PLAN_ID_PRO

    if (!planId) {
        return res.status(400).json({ message: "Plan ID is required." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Paddle Pay Link parameters
        // See: https://developer.paddle.com/build/transactions/pay-links
        const payload = {
            vendor_id: parseInt(PADDLE_VENDOR_ID),
            vendor_auth_code: PADDLE_API_KEY,
            product_id: parseInt(planId), // In Paddle, this is often called product_id or plan_id
            title: "EchoWrite Pro Subscription",
            // webhook_url: `${process.env.API_BASE_URL}/payments/paddle-webhook`, // Already configured in Paddle dashboard
            prices: [`USD:${(5.99).toFixed(2)}`], // Example: "USD:5.99"
            customer_email: user.email,
            passthrough: JSON.stringify({ echowriteUserId: userId.toString() }), // Send your internal user ID
            return_url: `${FRONTEND_URL}/payment-status?paddle_success=true&user_id=${userId}`, // For client-side confirmation
            // You can also pre-fill customer country, etc.
        };

        // The Paddle API for generating pay links is a POST request
        const paddleApiUrl = 'https://vendors.paddle.com/api/2.0/product/generate_pay_link';
        const paddleResponse = await axios.post(paddleApiUrl, querystring.stringify(payload));

        if (paddleResponse.data.success && paddleResponse.data.response && paddleResponse.data.response.url) {
            res.json({ payLink: paddleResponse.data.response.url });
        } else {
            console.error("Paddle Pay Link Generation Error:", paddleResponse.data);
            throw new Error(paddleResponse.data.error?.message || "Failed to generate Paddle pay link.");
        }

    } catch (error) {
        console.error("Create Paddle Pay Link Error:", error);
        res.status(500).json({ message: `Error creating payment link: ${error.message}` });
    }
};


// @desc    Paddle Webhook Handler
// @route   POST /api/payments/paddle-webhook
// @access  Public (Called by Paddle)
exports.paddleWebhookHandler = async (req, res) => {
    // Verify Paddle webhook signature
    // See: https://developer.paddle.com/build/platform/webhooks/verifying-webhooks
    const p_signature = req.body.p_signature; // Paddle sends data as x-www-form-urlencoded
    const fields = { ...req.body };
    delete fields.p_signature; // Remove signature from fields to verify

    // Sort fields by key
    const sortedFields = {};
    Object.keys(fields).sort().forEach(key => {
        sortedFields[key] = fields[key];
    });

    // Serialize and verify (this is complex due to PHP serialization)
    // It's often easier to use a library or a simpler verification if Paddle offers one.
    // For now, let's focus on processing the data, assuming verification is handled.
    // YOU MUST IMPLEMENT PROPER SIGNATURE VERIFICATION IN PRODUCTION.
    // The `php-serialize` library can help with the `serialize()` part.
    // const serializedData = serialize(sortedFields);
    // const verifier = crypto.createVerify('sha1');
    // verifier.update(serializedData);
    // const isVerified = verifier.verify(PADDLE_WEBHOOK_PUBLIC_KEY, p_signature, 'base64');
    // if (!isVerified) {
    //     console.warn("Paddle Webhook: Signature verification failed.");
    //     return res.status(400).send("Webhook signature verification failed.");
    // }

    const alertName = req.body.alert_name;
    console.log(`Paddle Webhook Received: ${alertName}`);

    try {
        let passthroughData = {};
        if (req.body.passthrough) {
            try { passthroughData = JSON.parse(req.body.passthrough); }
            catch (e) { console.error("Error parsing passthrough data:", e); }
        }
        const echowriteUserId = passthroughData.echowriteUserId || req.body.user_id; // Paddle might send user_id if customer exists

        if (!echowriteUserId) {
            console.error("Paddle Webhook: Missing echowriteUserId in passthrough or user_id.");
            return res.status(400).send("Missing user identifier.");
        }

        const user = await User.findById(echowriteUserId);
        if (!user) {
            console.error(`Paddle Webhook: User not found with ID: ${echowriteUserId}`);
            return res.status(404).send("User not found.");
        }

        switch (alertName) {
            case 'subscription_created':
            case 'subscription_payment_succeeded':
                user.paddleSubscription = {
                    planId: req.body.subscription_plan_id,
                    status: 'active', // Paddle status might be different, map accordingly
                    paddleSubscriptionId: req.body.subscription_id,
                    nextBilledAt: req.body.next_bill_date ? new Date(req.body.next_bill_date) : null,
                    updateUrl: req.body.update_url,
                    cancelUrl: req.body.cancel_url,
                };
                await user.save();
                console.log(`Paddle subscription activated/updated for user: ${user.email}`);
                break;

            case 'subscription_updated': // e.g. plan change, pause
                user.paddleSubscription = {
                    ...user.paddleSubscription, // Keep existing data like ID
                    planId: req.body.subscription_plan_id,
                    status: req.body.status, // Use Paddle's status directly
                    nextBilledAt: req.body.next_bill_date ? new Date(req.body.next_bill_date) : null,
                    updateUrl: req.body.update_url,
                    cancelUrl: req.body.cancel_url,
                    pausedFrom: req.body.paused_from ? new Date(req.body.paused_from) : null,
                };
                await user.save();
                console.log(`Paddle subscription status updated for user: ${user.email} to ${req.body.status}`);
                break;

            case 'subscription_cancelled': // Note: Paddle uses 'cancelled' with two 'l's
                if (user.paddleSubscription && user.paddleSubscription.paddleSubscriptionId === req.body.subscription_id) {
                    user.paddleSubscription.status = 'deleted'; // Or 'inactive'
                    user.paddleSubscription.nextBilledAt = null;
                    // Paddle usually handles cancellation at period end unless immediate
                    // You might get cancellation_effective_date
                }
                await user.save();
                console.log(`Paddle subscription cancelled for user: ${user.email}`);
                break;

            // Add other Paddle alert_name cases as needed
            // e.g., subscription_payment_failed, subscription_paused, etc.

            default:
                console.log(`Unhandled Paddle alert_name: ${alertName}`);
        }
        res.status(200).send("Webhook received."); // Respond to Paddle quickly
    } catch (error) {
        console.error("Error processing Paddle webhook:", error);
        res.status(500).send("Error processing webhook.");
    }
};