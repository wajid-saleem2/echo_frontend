// // backend/routes/connectRoutes.js
// const express = require('express');
// const router = express.Router();
// const {
//     getTwitterAuthUrl,
//     handleTwitterCallback,
//     postTweet,
//     disconnectTwitter,
//     initiateTwitterOAuth
//  } = require('../controllers/connectController');
// const { protect } = require('../middleware/authMiddleware');

// // --- Twitter ---
// router.get('/twitter/initiate', protect, initiateTwitterOAuth); // Protected endpoint to start
// router.get('/twitter', protect, getTwitterAuthUrl);
// router.get('/twitter/callback', handleTwitterCallback); // Public callback
// router.post('/twitter/tweet', protect, postTweet);
// router.post('/twitter/disconnect', protect, disconnectTwitter);

// // --- Add LinkedIn routes here later ---

// module.exports = router;

// backend/routes/connectRoutes.js
const express = require('express');
const router = express.Router();
const {
    handleTwitterCallback,
    postTweet,
    disconnectTwitter,
    initiateTwitterOAuth,
    cleanupExpiredOAuthStates
} = require('../controllers/connectController');
const { protect } = require('../middleware/authMiddleware');

// --- Twitter ---
router.get('/twitter/initiate', protect, initiateTwitterOAuth); // Protected endpoint to start
router.get('/twitter/callback', handleTwitterCallback); // Public callback
router.post('/twitter/tweet', protect, postTweet);
router.post('/twitter/disconnect', protect, disconnectTwitter);
router.delete('/twitter/cleanup', protect, cleanupExpiredOAuthStates); // Optional cleanup endpoint

// --- Add LinkedIn routes here later ---

module.exports = router;
