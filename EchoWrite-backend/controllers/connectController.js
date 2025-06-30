// // backend/controllers/connectController.js
// const { TwitterApi } = require('twitter-api-v2');
// // const pkceChallenge = require('pkce-challenge');
// const User = require('../models/User');

// const CALLBACK_URL = process.env.TWITTER_CALLBACK_URL;
// const FRONTEND_URL = process.env.FRONTEND_URL;

// // In-memory store for state and codeVerifier, or use Redis, or session store
// // NOT SUITABLE FOR PRODUCTION / CLUSTERED ENVIRONMENTS
// // const tempStore = {};

// // @desc    Step 1: Generate Twitter Auth URL
// // @route   GET /api/connect/twitter
// // @access  Private
// exports.getTwitterAuthUrl = async (req, res) => {
//     try {
//         const twitterClient = new TwitterApi({
//             clientId: process.env.TWITTER_CLIENT_ID,
//             // clientSecret: process.env.TWITTER_CLIENT_SECRET,
//         });

//         const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
//             CALLBACK_URL,
//             {
//                 scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
//                 // response_type: 'code',
//             }
//         );
//         console.log(`[AUTH URL] Session ID BEFORE save: ${req.sessionID}`);
//       // Store codeVerifier and state in session
//       req.session.twitterOAuth = {
//         state: state,
//         codeVerifier: codeVerifier,
//         // We don't need to store userId here anymore, as the session is tied to the user
//         // if they are already logged into your app when initiating this.
//         // If this can be initiated by a non-logged-in user, you might need a different flow
//         // or ensure login happens first. Assuming user is logged in (route is protected).
//     };
//     console.log(`[AUTH URL] Storing in session (SID ${req.sessionID}):`, req.session.twitterOAuth);

//     // Ensure session is saved before redirecting if your session store needs it
//     req.session.save(err => {
//         if (err) {
//             console.error("Session save error before Twitter redirect:", err);
//             return res.status(500).json({ message: "Error preparing Twitter connection." });
//         }
//         console.log(`[AUTH URL] Session successfully saved for SID ${req.sessionID}. Cookie should be set now.`);
//         console.log(`[AUTH URL] Session object after save (from callback):`, req.session);
//         res.json({ authUrl: url });
//     });

//     } catch (error) {
//         console.error("Twitter Auth URL Error:", error);
//         res.status(500).json({ message: "Error generating Twitter Auth URL." });
//     }
// };

// // @desc    Step 1: Generate Twitter Auth URL and return it to frontend
// // @route   GET /api/connect/twitter/initiate
// // @access  Private
// exports.initiateTwitterOAuth = async (req, res) => { // Renamed function
//     try {
//         const twitterClient = new TwitterApi({
//             clientId: process.env.TWITTER_CLIENT_ID,
//         });

//         const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
//             CALLBACK_URL, // Your backend's callback URL
//             { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
//         );

//         // req.user is available here because the route is 'protect'ed
//         req.session.twitterOAuth = {
//             state: state,
//             codeVerifier: codeVerifier,
//             userId: req.user.id // Store userId to link session back if needed, though session itself is key
//         };
//         console.log(`[INITIATE OAUTH] Storing in session (SID ${req.sessionID}) for user ${req.user.id}:`, req.session.twitterOAuth);

//         req.session.save(err => {
//             if (err) {
//                 console.error("[INITIATE OAUTH] Session save error:", err);
//                 return res.status(500).json({ message: "Error preparing Twitter connection." });
//             }
//             console.log(`[INITIATE OAUTH] Session saved. Returning authUrl to frontend.`);
//             // Return the Twitter URL to the frontend
//             res.json({ authUrl: url });
//         });

//     } catch (error) {
//         console.error("Initiate Twitter OAuth Error:", error);
//         res.status(500).json({ message: "Error generating Twitter Auth URL." });
//     }
// };


// // @desc    Step 2: Handle Twitter Callback, get tokens, save to user
// // @route   GET /api/connect/twitter/callback
// // @access  Public (Called by Twitter)
// exports.handleTwitterCallback = async (req, res) => {
//     const { state: returnedState, code } = req.query;
//     const storedOAuthData = req.session.twitterOAuth;

//     console.log(`[CALLBACK] Received state: ${returnedState}, code: ${code}`);
//     console.log(`[CALLBACK] Session data for SID ${req.sessionID}:`, req.session);
//     console.log(`[CALLBACK] Stored OAuth data from session:`, storedOAuthData);


//     try {
//         if (!returnedState || !code || !storedOAuthData || returnedState !== storedOAuthData.state) {
//             console.error("Twitter Callback: State mismatch or session data missing.", { returnedState, storedState: storedOAuthData?.state });
//             throw new Error("Invalid state parameter or session expired. Please try connecting again.");
//         }

//         const { codeVerifier, userId: originalUserIdFromSession } = storedOAuthData; // Get original userId
//         // Clear data from session after use
//         delete req.session.twitterOAuth;
//         // req.session.destroy(); // Or just delete the specific part

//         const twitterClient = new TwitterApi({
//             clientId: process.env.TWITTER_CLIENT_ID,
//             clientSecret: process.env.TWITTER_CLIENT_SECRET, // Needed for token exchange
//         });

//         console.log("[CALLBACK] Attempting loginWithOAuth2 with:", {
//             code,
//             codeVerifier,
//             redirectUri: CALLBACK_URL,
//             clientId: process.env.TWITTER_CLIENT_ID, // For verification
//             // DO NOT LOG CLIENT_SECRET directly, but ensure it's being loaded by TwitterApi
//         });

//         const { client: loggedClient, accessToken, refreshToken, expiresIn } = await twitterClient.loginWithOAuth2({
//             code,
//             codeVerifier,
//             redirectUri: CALLBACK_URL,
//         });

//           // IMPORTANT: Verify the user from the session if possible, or ensure the flow is secure.
//         // The 'userId' stored in session during initiation is the EchoWrite user.
//         if (!originalUserIdFromSession) {
//             console.error("Twitter Callback: originalUserIdFromSession missing from session. This should not happen.");
//             throw new Error("Critical error: User context lost during OAuth flow.");
//         }

//         // // Get User's Twitter Profile info
//         // const { data: twitterUserInfo } = await loggedClient.v2.me();
//         // console.log("Twitter User Info:", twitterUserInfo);

//         // // req.user should be available if the user was logged into EchoWrite when they started the connect flow.
//         // // The session helps maintain this link.
//         // if (!req.user || !req.user.id) {
//         //     // This case should ideally not happen if the /api/connect/twitter route is protected
//         //     // and session correctly links back. If it does, it's a flow issue.
//         //     console.error("Twitter Callback: User not found in session after callback.");
//         //     throw new Error("User session not found after Twitter authorization. Please ensure you are logged in.");
//         // }
//         // const userId = req.user.id;

//         const user = await User.findById(originalUserIdFromSession); // Use the ID stored at initiation
//         if (!user) throw new Error(`User ${originalUserIdFromSession} not found.`);

//         user.twitterOAuth = { accessToken, refreshToken, expiresAt: Date.now() + (expiresIn * 1000) };
//         await user.save();

//         console.log(`Twitter tokens saved for user ${user.id}`);
//         req.session.save(err => { // Ensure session (with cleared twitterOAuth) is saved
//             if (err) console.error("Session save error after Twitter callback:", err);
//             res.redirect(`${FRONTEND_URL}/profile?twitter_connect=success`);
//         });

//     } catch (error) {
//         console.error("Twitter Callback Error Full Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2)); // Log the full error object
//     console.error("Twitter Callback Error Message:", error.message);
//     console.error("Twitter Callback Error Stack:", error.stack);

//     // Check for specific Twitter API error details if available
//     if (error.rateLimit) {
//         console.error('Rate limit error:', error.rateLimit);
//     }
//     if (error.data) { // Twitter API often returns error details in error.data
//         console.error('Twitter API error data:', error.data);
//     }

//         // console.error("Twitter Callback Error:", error.message, error.stack);
//         // Clear potentially sensitive data from session on error too
//         if (req.session && req.session.twitterOAuth) delete req.session.twitterOAuth;
//         req.session.save(err => {
//             if (err) console.error("Session save error on Twitter callback error:", err);
//             res.redirect(`${FRONTEND_URL}/profile?twitter_connect=error&message=${encodeURIComponent(error.message)}`);
//         });
//     }
// };

//  // @desc    Post a Tweet
// // @route   POST /api/connect/twitter/tweet
// // @access  Private
// exports.postTweet = async (req, res) => {
//      const { text } = req.body;
//      if (!text) return res.status(400).json({ message: "Tweet text is required."});

//      try {
//           const user = await User.findById(req.user.id);
//           const tokens = user?.getDecryptedTwitterOAuth();

//           if (!user || !tokens || !tokens.accessToken) {
//               return res.status(400).json({ message: "Twitter account not connected or tokens missing."});
//           }

//           // Instantiate client with user's tokens
//           let twitterClient = new TwitterApi(tokens.accessToken);

//           // TODO: Check if token is expired and use Refresh Token if necessary
//           // This requires storing and using the refreshToken with your clientId/Secret
//           // See twitter-api-v2 documentation for refreshing tokens.

//           // Post tweet
//           const { data: createdTweet } = await twitterClient.v2.tweet(text);

//           res.status(201).json(createdTweet);

//      } catch (error) {
//           console.error("Post Tweet Error:", error);
//           // Handle expired token errors specifically if possible
//           res.status(500).json({ message: `Failed to post tweet: ${error.message}` });
//      }
// };

// // @desc    Disconnect Twitter
// // @route   POST /api/connect/twitter/disconnect
// // @access  Private
//  exports.disconnectTwitter = async (req, res) => {
//      try {
//           const user = await User.findById(req.user.id);
//           if (user) {
//               user.twitterOAuth = undefined; // Remove the tokens
//               await user.save();
//           }
//           res.json({ message: "Twitter disconnected."});
//      } catch (error) {
//           console.error("Disconnect Twitter Error:", error);
//           res.status(500).json({ message: `Failed to disconnect Twitter: ${error.message}` });
//      }
//  };


// backend/controllers/connectController.js
const { TwitterApi } = require('twitter-api-v2');
const User = require('../models/User');
const crypto = require('crypto');
const RepurposedSnippet = require('../models/RepurposedSnippet');
// You'll need to create this model for temporary OAuth state storage
const TwitterOAuthState = require('../models/TwitterOAuthState'); // Create this model

const CALLBACK_URL = process.env.TWITTER_CALLBACK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;

// @desc    Step 1: Generate Twitter Auth URL and return it to frontend
// @route   GET /api/connect/twitter/initiate
// @access  Private
exports.initiateTwitterOAuth = async (req, res) => {
    try {
        const twitterClient = new TwitterApi({
            clientId: process.env.TWITTER_CLIENT_ID,
        });

        const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
            CALLBACK_URL,
            { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
        );

        // Store OAuth state in database instead of session
        // Create a unique identifier for this OAuth attempt
        const oauthStateId = crypto.randomUUID();
        
        await TwitterOAuthState.create({
            stateId: oauthStateId,
            state: state,
            codeVerifier: codeVerifier,
            userId: req.user.id,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes expiry
        });

        console.log(`[INITIATE OAUTH] Stored OAuth state in DB for user ${req.user.id}, stateId: ${oauthStateId}`);

        // Return the Twitter URL to the frontend
        res.json({ authUrl: url });

    } catch (error) {
        console.error("Initiate Twitter OAuth Error:", error);
        res.status(500).json({ message: "Error generating Twitter Auth URL." });
    }
};

// @desc    Step 2: Handle Twitter Callback, get tokens, save to user
// @route   GET /api/connect/twitter/callback
// @access  Public (Called by Twitter)
exports.handleTwitterCallback = async (req, res) => {
    const { state: returnedState, code } = req.query;

    console.log(`[CALLBACK] Received state: ${returnedState}, code: ${code}`);

    try {
        if (!returnedState || !code) {
            throw new Error("Missing required parameters from Twitter callback.");
        }

        // Find the OAuth state in database
        const oauthState = await TwitterOAuthState.findOne({ 
            state: returnedState,
            expiresAt: { $gt: new Date() } // Not expired
        });

        if (!oauthState) {
            console.error("Twitter Callback: OAuth state not found or expired.");
            throw new Error("Invalid state parameter or session expired. Please try connecting again.");
        }

        const { codeVerifier, userId } = oauthState;
        
        // Clean up the OAuth state record after use
        await TwitterOAuthState.deleteOne({ _id: oauthState._id });

        const twitterClient = new TwitterApi({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
        });

        console.log("[CALLBACK] Attempting loginWithOAuth2...");

        const { client: loggedClient, accessToken, refreshToken, expiresIn } = await twitterClient.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri: CALLBACK_URL,
        });

        // Find the user and update with Twitter tokens
        const user = await User.findById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found.`);
        }

        // Get Twitter user info for verification
        const { data: twitterUserInfo } = await loggedClient.v2.me();
        console.log("Twitter User Info:", twitterUserInfo);

        user.twitterOAuth = { 
            accessToken, 
            refreshToken, 
            expiresAt: Date.now() + (expiresIn * 1000),
            twitterUsername: twitterUserInfo.username,
            twitterId: twitterUserInfo.id
        };
        await user.save();

        console.log(`Twitter tokens saved for user ${user.id}`);
        
        res.redirect(`${FRONTEND_URL}/profile?twitter_connect=success`);

    } catch (error) {
        console.error("Twitter Callback Error:", error);
        
        // Clean up any OAuth state on error
        if (returnedState) {
            try {
                await TwitterOAuthState.deleteOne({ state: returnedState });
            } catch (cleanupError) {
                console.error("Error cleaning up OAuth state:", cleanupError);
            }
        }

        res.redirect(`${FRONTEND_URL}/profile?twitter_connect=error&message=${encodeURIComponent(error.message)}`);
    }
};

// @desc    Post a Tweet
// @route   POST /api/connect/twitter/tweet
// @access  Private
exports.postTweet = async (req, res) => {
    const { text, snippetId } = req.body;
    if (!text) return res.status(400).json({ message: "Tweet text is required." });

    try {
        const user = await User.findById(req.user.id);
        const tokens = user?.getDecryptedTwitterOAuth();

        if (!user || !tokens || !tokens.accessToken) {
            return res.status(400).json({ message: "Twitter account not connected or tokens missing." });
        }

        // Check if token is expired
        if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
            // Try to refresh the token
            if (tokens.refreshToken) {
                try {
                    const twitterClient = new TwitterApi({
                        clientId: process.env.TWITTER_CLIENT_ID,
                        clientSecret: process.env.TWITTER_CLIENT_SECRET,
                    });

                    const { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn } = 
                        await twitterClient.refreshOAuth2Token(tokens.refreshToken);

                    // Update user with new tokens
                    user.twitterOAuth = {
                        ...tokens,
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                        expiresAt: Date.now() + (expiresIn * 1000)
                    };
                    await user.save();

                    tokens.accessToken = newAccessToken;
                } catch (refreshError) {
                    console.error("Token refresh failed:", refreshError);
                    return res.status(401).json({ message: "Twitter token expired and refresh failed. Please reconnect your account." });
                }
            } else {
                return res.status(401).json({ message: "Twitter token expired. Please reconnect your account." });
            }
        }

        // Instantiate client with user's tokens
        let twitterClient = new TwitterApi(tokens.accessToken);

        // Post tweet
        const { data: createdTweet } = await twitterClient.v2.tweet(text);

        
        if (snippetId) {
            const snippet = await RepurposedSnippet.findById(snippetId);
            if (snippet && snippet.user.toString() === req.user.id) {
                snippet.status = 'finalized';
                snippet.notes = `Tweeted at ${new Date().toISOString()}`;
                await snippet.save();
            }
        }

        res.status(201).json(createdTweet);

    } catch (error) {
        console.error("Post Tweet Error:", error);
        res.status(500).json({ message: `Failed to post tweet: ${error.message}` });
    }
};

// @desc    Disconnect Twitter
// @route   POST /api/connect/twitter/disconnect
// @access  Private
exports.disconnectTwitter = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.twitterOAuth = undefined;
            await user.save();
        }
        res.json({ message: "Twitter disconnected." });
    } catch (error) {
        console.error("Disconnect Twitter Error:", error);
        res.status(500).json({ message: `Failed to disconnect Twitter: ${error.message}` });
    }
};

// @desc    Clean up expired OAuth states (call this periodically or via cron)
// @route   DELETE /api/connect/twitter/cleanup
// @access  Private (Admin only)
exports.cleanupExpiredOAuthStates = async (req, res) => {
    try {
        const result = await TwitterOAuthState.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        res.json({ message: `Cleaned up ${result.deletedCount} expired OAuth states.` });
    } catch (error) {
        console.error("Cleanup Error:", error);
        res.status(500).json({ message: "Failed to cleanup expired states." });
    }
};
