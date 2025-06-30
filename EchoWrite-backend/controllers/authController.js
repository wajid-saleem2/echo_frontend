// // backend/controllers/authController.js
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// // Helper function to generate JWT
// const generateToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET, {
//         expiresIn: '30d' // Token expires in 30 days
//     });
// };

// // @desc    Register a new user
// // @route   POST /api/auth/register
// // @access  Public
// exports.registerUser = async (req, res) => {
//     const { username, email, password } = req.body;

//     try {
//         // Check if user already exists
//         const userExists = await User.findOne({ email });
//         if (userExists) {
//             return res.status(400).json({ message: 'User already exists with this email' });
//         }

//         // Create new user
//         const user = await User.create({
//             username,
//             email,
//             password,
//         });

//         if (user) {
//             res.status(201).json({
//                 _id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 token: generateToken(user._id)
//             });
//         } else {
//             res.status(400).json({ message: 'Invalid user data' });
//         }
//     } catch (error) {
//         console.error('Registration Error:', error);
//         // Handle Mongoose validation errors more gracefully
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ message: messages.join(', ') });
//         }
//         res.status(500).json({ message: 'Server error during registration' });
//     }
// };

// // @desc    Authenticate user & get token (Login)
// // @route   POST /api/auth/login
// // @access  Public
// exports.loginUser = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         // Check if email and password are provided
//         if (!email || !password) {
//             return res.status(400).json({ message: 'Please provide email and password' });
//         }

//         // Check for user
//         const user = await User.findOne({ email }); // .select('+password') if password select is false in schema

//         if (user && (await user.comparePassword(password))) {
//             res.json({
//                 _id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 token: generateToken(user._id),
//                 // Add the API key status flags here:
//                 hasOpenAiApiKey: !!user.openAiApiKey,
//                 hasGeminiApiKey: !!user.geminiApiKey,
//                 hasPerplexityApiKey: !!user.perplexityApiKey,
//                 createdAt: user.createdAt // If you need this on the frontend too
//             });
//         } else {
//             res.status(401).json({ message: 'Invalid email or password' });
//         }
//     } catch (error) {
//         console.error('Login Error:', error);
//         res.status(500).json({ message: 'Server error during login' });
//     }
// };


// // @desc    Update user profile (including API keys)
// // @route   PUT /api/auth/profile
// // @access  Private
// exports.updateUserProfile = async (req, res) => {
//     const { username, email, openAiApiKey, geminiApiKey, perplexityApiKey } = req.body;

//     try {
//         const user = await User.findById(req.user.id);

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Check if email is being changed and if it's already taken
//         if (email && email !== user.email) {
//             const emailExists = await User.findOne({ email });
//             if (emailExists) {
//                 return res.status(400).json({ message: 'Email already in use' });
//             }
//             user.email = email;
//         }

//         if (username) user.username = username;
      
//         // Update API keys - they will be encrypted by the pre-save hook
//         if (openAiApiKey !== undefined) user.openAiApiKey = openAiApiKey; // Allow empty string to clear
//         // Add other API keys here
//         if (geminiApiKey !== undefined) user.geminiApiKey = geminiApiKey;
//         if (perplexityApiKey !== undefined) user.perplexityApiKey = perplexityApiKey;

//         const updatedUser = await user.save();

//         res.json({
//             _id: updatedUser._id,
//             username: updatedUser.username,
//             email: updatedUser.email,
//             // IMPORTANT: DO NOT send back API keys, even encrypted ones, unless absolutely necessary
//             // and you have a specific use case for the client to have them.
//             // For BYOK, the client usually just needs to know if a key is set.
//             hasOpenAiApiKey: !!updatedUser.openAiApiKey, // Send a boolean indicating if key exists
//             hasGeminiApiKey: !!updatedUser.geminiApiKey,
//             hasPerplexityApiKey: !!updatedUser.perplexityApiKey,
//         });

//     } catch (error) {
//         console.error('Update Profile Error:', error);
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ message: messages.join(', ') });
//         }
//         res.status(500).json({ message: 'Server error while updating profile' });
//     }
// };

// // Modify getMe to also indicate if API keys are set
// exports.getMe = async (req, res) => {
//     try {
//         const user = await User.findById(req.user.id).select('-password'); // Keep -password
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }
//         // Reset monthly usage if needed
//     user.resetMonthlyUsage();
//     await user.save();
//         res.json({
//             _id: user._id,
//             username: user.username,
//             email: user.email,
           
//         createdAt: user.createdAt,
            
//             // Send boolean flags indicating if keys are present
//             hasOpenAiApiKey: !!user.openAiApiKey,
//             hasGeminiApiKey: !!user.geminiApiKey,
//             hasPerplexityApiKey: !!user.perplexityApiKey,
//               // --- ADD THIS ---
//             hasTwitterOAuth: !!(user.twitterOAuth && user.twitterOAuth.accessToken),
//             // subscription: user.subscription
//             // hasCohereApiKey: !!user.cohereApiKey,
//         });
//     } catch (error) {
//         console.error('GetMe Error:', error);
//         res.status(500).json({ message: 'Server error' });
//     }
// };


// backend/controllers/authController.js (UPDATED)
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Helper function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const user = await User.create({
            username,
            email,
            password,
            subscription: {
                isActive: false,
                plan: 'basic',
                paymentStatus: 'pending'
            }
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
                subscription: user.subscription,
                hasActiveSubscription: user.hasActiveSubscription()
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
                hasOpenAiApiKey: !!user.openAiApiKey,
                hasGeminiApiKey: !!user.geminiApiKey,
                hasPerplexityApiKey: !!user.perplexityApiKey,
                hasTwitterOAuth: !!(user.twitterOAuth && user.twitterOAuth.accessToken),
                subscription: user.subscription,
                hasActiveSubscription: user.hasActiveSubscription(),
                createdAt: user.createdAt
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Update user profile (including API keys and subscription)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    const {
        username,
        email,
        openAiApiKey,
        geminiApiKey,
        perplexityApiKey,
        twitterOAuth,
        subscription
    } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        if (username) user.username = username;
        if (openAiApiKey !== undefined) user.openAiApiKey = openAiApiKey;
        if (geminiApiKey !== undefined) user.geminiApiKey = geminiApiKey;
        if (perplexityApiKey !== undefined) user.perplexityApiKey = perplexityApiKey;
        if (twitterOAuth !== undefined) user.twitterOAuth = twitterOAuth;
        if (subscription !== undefined) user.subscription = { ...user.subscription, ...subscription };

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            hasOpenAiApiKey: !!updatedUser.openAiApiKey,
            hasGeminiApiKey: !!updatedUser.geminiApiKey,
            hasPerplexityApiKey: !!updatedUser.perplexityApiKey,
            hasTwitterOAuth: !!(updatedUser.twitterOAuth && updatedUser.twitterOAuth.accessToken),
            subscription: updatedUser.subscription,
            hasActiveSubscription: updatedUser.hasActiveSubscription()
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Optional: Reset usage if needed
        // user.resetMonthlyUsage();
        // await user.save();

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            hasOpenAiApiKey: !!user.openAiApiKey,
            hasGeminiApiKey: !!user.geminiApiKey,
            hasPerplexityApiKey: !!user.perplexityApiKey,
            hasTwitterOAuth: !!(user.twitterOAuth && user.twitterOAuth.accessToken),
            subscription: user.subscription,
            hasActiveSubscription: user.hasActiveSubscription()
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
