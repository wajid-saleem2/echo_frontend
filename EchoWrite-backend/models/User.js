// // // backend/models/User.js
// // const mongoose = require('mongoose');
// // const bcrypt = require('bcryptjs');
// // const CryptoJS = require('crypto-js'); // For API key encryption
// // require('dotenv').config(); // For ENCRYPTION_KEY

// // const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET;

// // if (!ENCRYPTION_KEY) {
// //     console.warn("Warning: API_KEY_ENCRYPTION_SECRET is not set in .env. API keys will not be securely stored.");
// // }

// // const UserSchema = new mongoose.Schema({
// //     username: {
// //         type: String,
// //         required: [true, 'Username is required'],
// //         trim: true,
// //         minlength: [3, 'Username must be at least 3 characters long']
// //     },
// //     email: {
// //         type: String,
// //         required: [true, 'Email is required'],
// //         unique: true,
// //         trim: true,
// //         lowercase: true,
// //         match: [
// //             /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
// //             'Please fill a valid email address'
// //         ]
// //     },
// //     password: {
// //         type: String,
// //         required: [true, 'Password is required'],
// //         minlength: [6, 'Password must be at least 6 characters long']
// //         // Do not select password by default when querying users
// //         // select: false 
// //     },
// //      // --- New fields for API Keys ---
// //      openAiApiKey: {
// //         type: String,
// //         trim: true,
// //         // select: false // Good practice to not select by default
// //     },
// //     geminiApiKey: { // For Google AI Studio Gemini Pro
// //         type: String,
// //         trim: true,
// //     },
// //     perplexityApiKey: { // For Perplexity API (if available/pplx-api)
// //         type: String,
// //         trim: true,
// //     },
// //     // Add other API keys as needed, e.g., cohereApiKey, etc.
// //     twitterOAuth: {
// //         accessToken: String, // Encrypted
// //         refreshToken: String, // Encrypted
// //         expiresAt: Number, // Timestamp (ms) when access token expires
// //         // select: false // Strongly recommended
// //     },
// //     createdAt: {
// //         type: Date,
// //         default: Date.now
// //     }
// // });

// // // Encrypt API keys before saving
// // UserSchema.pre('save', function(next) {
// //     if (!ENCRYPTION_KEY) {
// //         console.warn("API_KEY_ENCRYPTION_SECRET not set. API keys will not be securely stored.");
// //         // return next(); // Allow password hashing to proceed if it's separate
// //     }

// //     const encryptKey = (keyField) => {
// //         if (ENCRYPTION_KEY && this.isModified(keyField) && this[keyField]) {
// //             try {
// //                 this[keyField] = CryptoJS.AES.encrypt(this[keyField], ENCRYPTION_KEY).toString();
// //             } catch (error) {
// //                 console.error(`Error encrypting ${keyField}:`, error);
// //             }
// //         }
// //     };

// //     encryptKey('openAiApiKey');
// //     encryptKey('geminiApiKey');
// //     encryptKey('perplexityApiKey');

// //      // Encrypt Twitter Tokens if they have been modified
// //      if (this.isModified('twitterOAuth.accessToken') && this.twitterOAuth.accessToken) {
// //         encryptKey('twitterOAuth.accessToken');
// //     }
// //      if (this.isModified('twitterOAuth.refreshToken') && this.twitterOAuth.refreshToken) {
// //         encryptKey('twitterOAuth.refreshToken');
// //     }

// //     // Ensure password hashing still runs if it's in a separate pre-save or handled differently
// //     // If password hashing is also a pre-save hook, Mongoose handles calling them in order.
// //     next(); // Call next once after all modifications in this hook
// // });

// // // Method to decrypt API key (DO NOT send decrypted key to frontend unless absolutely necessary and over HTTPS)
// // // This method would typically be used server-side only when making calls to the AI API.
// // // Decryption methods
// // UserSchema.methods.getDecryptedApiKey = function(keyField) {
// //     if (!ENCRYPTION_KEY || !this[keyField]) return null;
// //     try {
// //         const bytes = CryptoJS.AES.decrypt(this[keyField], ENCRYPTION_KEY);
// //         const decryptedKey = bytes.toString(CryptoJS.enc.Utf8);
// //         return decryptedKey || null; // Ensure empty string after decryption is null
// //     } catch (error) {
// //         console.error(`Error decrypting ${keyField}:`, error);
// //         return null;
// //     }
// // };

// // UserSchema.methods.getDecryptedOpenAiApiKey = function() { return this.getDecryptedApiKey('openAiApiKey'); };
// // UserSchema.methods.getDecryptedGeminiApiKey = function() { return this.getDecryptedApiKey('geminiApiKey'); };
// // UserSchema.methods.getDecryptedPerplexityApiKey = function() { return this.getDecryptedApiKey('perplexityApiKey'); };


// // // Helper inside User Model
// // const decrypt = (encryptedText) => {
// //     if (!ENCRYPTION_KEY || !encryptedText) return null;
// //     try {
// //          const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
// //          return bytes.toString(CryptoJS.enc.Utf8);
// //     } catch (error) {
// //          console.error(`Error decrypting:`, error);
// //          return null;
// //     }
// // };

// // UserSchema.methods.getDecryptedTwitterOAuth = function() {
// //    if (!this.twitterOAuth || !this.twitterOAuth.accessToken) return null;
// //     return {
// //         accessToken: decrypt(this.twitterOAuth.accessToken),
// //         refreshToken: decrypt(this.twitterOAuth.refreshToken), // Will return null if encrypted refreshToken is null/undefined
// //         expiresAt: this.twitterOAuth.expiresAt
// //     };
// // };

// // // Hash password before saving
// // UserSchema.pre('save', async function(next) {
// //     // Only run this function if password was actually modified
// //     if (!this.isModified('password')) return next();

// //     // Hash the password with cost of 12
// //     const salt = await bcrypt.genSalt(10);
// //     this.password = await bcrypt.hash(this.password, salt);
// //     next();
// // });

// // // Method to compare entered password with hashed password in DB
// // UserSchema.methods.comparePassword = async function(enteredPassword) {
// //     return await bcrypt.compare(enteredPassword, this.password);
// // };

// // module.exports = mongoose.model('User', UserSchema);

// // backend/models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const CryptoJS = require('crypto-js'); // For API key encryption
// require('dotenv').config(); // For ENCRYPTION_KEY

// const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET;

// if (!ENCRYPTION_KEY) {
//     console.warn("Warning: API_KEY_ENCRYPTION_SECRET is not set in .env. API keys will not be securely stored.");
// }

// const UserSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         required: [true, 'Username is required'],
//         trim: true,
//         minlength: [3, 'Username must be at least 3 characters long']
//     },
//     email: {
//         type: String,
//         required: [true, 'Email is required'],
//         unique: true,
//         trim: true,
//         lowercase: true,
//         match: [
//             /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//             'Please fill a valid email address'
//         ]
//     },
//     password: {
//         type: String,
//         // required: [true, 'Password is required'],
//         minlength: [6, 'Password must be at least 6 characters long']
//     },
//     // --- API Keys ---
//     openAiApiKey: {
//         type: String,
//         trim: true,
//     },
//     geminiApiKey: {
//         type: String,
//         trim: true,
//     },
//     perplexityApiKey: {
//         type: String,
//         trim: true,
//     },
//     // Twitter OAuth tokens
//     twitterOAuth: {
//         accessToken: String, // Encrypted
//         refreshToken: String, // Encrypted
//         expiresAt: Number, // Timestamp (ms) when access token expires
//         twitterUsername: String, // Store username for reference
//         twitterId: String // Store Twitter user ID
//     },
//     googleId: {
//         type: String,
//         unique: true,
//         sparse: true // Allows multiple null values, but unique if value exists
//     },
//     isEmailVerified: {
//         type: Boolean,
//         default: false
//     },
//     // paddleSubscription: { // Changed from stripeSubscription
//     //     planId: String,         // Paddle Plan ID
//     //     status: {
//     //         type: String,
//     //         enum: ['active', 'trialing', 'past_due', 'paused', 'deleted', 'inactive'], // Paddle statuses
//     //         default: 'inactive'
//     //     },
//     //     paddleSubscriptionId: String, // Paddle's subscription ID
//     //     nextBilledAt: Date,
//     //     updateUrl: String,      // URL to update payment method
//     //     cancelUrl: String,      // URL to cancel subscription
//     //     pausedFrom: Date,
//     // },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// // COMBINED pre-save hook for both encryption and password hashing
// UserSchema.pre('save', async function(next) {
//     try {
//         // 1. Handle API key encryption first
//         if (ENCRYPTION_KEY) {
//             const encryptKey = (keyField) => {
//                 if (this.isModified(keyField) && this[keyField]) {
//                     try {
//                         this[keyField] = CryptoJS.AES.encrypt(this[keyField], ENCRYPTION_KEY).toString();
//                     } catch (error) {
//                         console.error(`Error encrypting ${keyField}:`, error);
//                     }
//                 }
//             };

//             // Encrypt API keys
//             encryptKey('openAiApiKey');
//             encryptKey('geminiApiKey');
//             encryptKey('perplexityApiKey');

//             // Encrypt Twitter OAuth tokens
//             if (this.twitterOAuth) {
//                 if (this.isModified('twitterOAuth.accessToken') && this.twitterOAuth.accessToken) {
//                     this.twitterOAuth.accessToken = CryptoJS.AES.encrypt(this.twitterOAuth.accessToken, ENCRYPTION_KEY).toString();
//                 }
//                 if (this.isModified('twitterOAuth.refreshToken') && this.twitterOAuth.refreshToken) {
//                     this.twitterOAuth.refreshToken = CryptoJS.AES.encrypt(this.twitterOAuth.refreshToken, ENCRYPTION_KEY).toString();
//                 }
//             }
//         }

//         // 2. Handle password hashing
//         if (this.isModified('password')) {
//             const salt = await bcrypt.genSalt(10);
//             this.password = await bcrypt.hash(this.password, salt);
//         }

//         next();
//     } catch (error) {
//         console.error('Error in pre-save hook:', error);
//         next(error);
//     }
// });

// // Helper function for decryption
// const decrypt = (encryptedText) => {
//     if (!ENCRYPTION_KEY || !encryptedText) return null;
//     try {
//         const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
//         const decrypted = bytes.toString(CryptoJS.enc.Utf8);
//         return decrypted || null;
//     } catch (error) {
//         console.error(`Error decrypting:`, error);
//         return null;
//     }
// };

// // Method to decrypt API key
// UserSchema.methods.getDecryptedApiKey = function(keyField) {
//     if (!ENCRYPTION_KEY || !this[keyField]) return null;
//     return decrypt(this[keyField]);
// };

// // Specific API key decryption methods
// UserSchema.methods.getDecryptedOpenAiApiKey = function() { 
//     return this.getDecryptedApiKey('openAiApiKey'); 
// };
// UserSchema.methods.getDecryptedGeminiApiKey = function() { 
//     return this.getDecryptedApiKey('geminiApiKey'); 
// };
// UserSchema.methods.getDecryptedPerplexityApiKey = function() { 
//     return this.getDecryptedApiKey('perplexityApiKey'); 
// };

// // Twitter OAuth decryption method
// UserSchema.methods.getDecryptedTwitterOAuth = function() {
//     if (!this.twitterOAuth || !this.twitterOAuth.accessToken) return null;
    
//     return {
//         accessToken: decrypt(this.twitterOAuth.accessToken),
//         refreshToken: decrypt(this.twitterOAuth.refreshToken),
//         expiresAt: this.twitterOAuth.expiresAt,
//         twitterUsername: this.twitterOAuth.twitterUsername,
//         twitterId: this.twitterOAuth.twitterId
//     };
// };

// // Method to compare entered password with hashed password in DB
// UserSchema.methods.comparePassword = async function(enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
// };

// // Virtual property to check if user has Twitter OAuth
// UserSchema.virtual('hasTwitterOAuth').get(function() {
//     return !!(this.twitterOAuth && this.twitterOAuth.accessToken);
// });

// // Ensure virtual fields are serialized
// UserSchema.set('toJSON', { virtuals: true });
// UserSchema.set('toObject', { virtuals: true });

  

// module.exports = mongoose.model('User', UserSchema);

// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET;

if (!ENCRYPTION_KEY) {
    console.warn("Warning: API_KEY_ENCRYPTION_SECRET is not set in .env. API keys will not be securely stored.");
}

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please fill a valid email address'
        ]
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters long']
    },
    
    // --- Subscription & Payment Fields ---
    subscription: {
        isActive: {
            type: Boolean,
            default: false
        },
        plan: {
            type: String,
            enum: ['basic', 'pro', 'premium'],
            default: 'basic'
        },
        startDate: Date,
        expiryDate: Date,
        paymentStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'failed', 'expired'],
            default: 'pending'
        }
    },
    
    // Payment tracking
    payments: [{
        transactionId: String,
        amount: Number,
        currency: {
            type: String,
            enum: ['SOL', 'BTC'],
            default: 'SOL'
        },
        fromAddress: String, // Customer's wallet address
        toAddress: String,   // Your wallet address
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'failed'],
            default: 'pending'
        },
        paymentDate: {
            type: Date,
            default: Date.now
        },
        confirmationDate: Date,
        blockchainTxHash: String, // Transaction hash from blockchain
        adminConfirmed: {
            type: Boolean,
            default: false
        },
        adminConfirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        adminConfirmedAt: Date
    }],

    // --- API Keys ---
    openAiApiKey: {
        type: String,
        trim: true,
    },
    geminiApiKey: {
        type: String,
        trim: true,
    },
    perplexityApiKey: {
        type: String,
        trim: true,
    },
    
    // Twitter OAuth tokens
    twitterOAuth: {
        accessToken: String,
        refreshToken: String,
        expiresAt: Number,
        twitterUsername: String,
        twitterId: String
    },
    
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    // Admin role (you asked if you need this - YES for payment confirmation)
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// COMBINED pre-save hook for both encryption and password hashing
UserSchema.pre('save', async function(next) {
    try {
        // 1. Handle API key encryption first
        if (ENCRYPTION_KEY) {
            const encryptKey = (keyField) => {
                if (this.isModified(keyField) && this[keyField]) {
                    try {
                        this[keyField] = CryptoJS.AES.encrypt(this[keyField], ENCRYPTION_KEY).toString();
                    } catch (error) {
                        console.error(`Error encrypting ${keyField}:`, error);
                    }
                }
            };

            // Encrypt API keys
            encryptKey('openAiApiKey');
            encryptKey('geminiApiKey');
            encryptKey('perplexityApiKey');

            // Encrypt Twitter OAuth tokens
            if (this.twitterOAuth) {
                if (this.isModified('twitterOAuth.accessToken') && this.twitterOAuth.accessToken) {
                    this.twitterOAuth.accessToken = CryptoJS.AES.encrypt(this.twitterOAuth.accessToken, ENCRYPTION_KEY).toString();
                }
                if (this.isModified('twitterOAuth.refreshToken') && this.twitterOAuth.refreshToken) {
                    this.twitterOAuth.refreshToken = CryptoJS.AES.encrypt(this.twitterOAuth.refreshToken, ENCRYPTION_KEY).toString();
                }
            }
        }

        // 2. Handle password hashing
        if (this.isModified('password') && this.password) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }

        next();
    } catch (error) {
        console.error('Error in pre-save hook:', error);
        next(error);
    }
});

// Helper function for decryption
const decrypt = (encryptedText) => {
    if (!ENCRYPTION_KEY || !encryptedText) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || null;
    } catch (error) {
        console.error(`Error decrypting:`, error);
        return null;
    }
};

// Method to decrypt API key
UserSchema.methods.getDecryptedApiKey = function(keyField) {
    if (!ENCRYPTION_KEY || !this[keyField]) return null;
    return decrypt(this[keyField]);
};

// Specific API key decryption methods
UserSchema.methods.getDecryptedOpenAiApiKey = function() { 
    return this.getDecryptedApiKey('openAiApiKey'); 
};
UserSchema.methods.getDecryptedGeminiApiKey = function() { 
    return this.getDecryptedApiKey('geminiApiKey'); 
};
UserSchema.methods.getDecryptedPerplexityApiKey = function() { 
    return this.getDecryptedApiKey('perplexityApiKey'); 
};

// Twitter OAuth decryption method
UserSchema.methods.getDecryptedTwitterOAuth = function() {
    if (!this.twitterOAuth || !this.twitterOAuth.accessToken) return null;
    
    return {
        accessToken: decrypt(this.twitterOAuth.accessToken),
        refreshToken: decrypt(this.twitterOAuth.refreshToken),
        expiresAt: this.twitterOAuth.expiresAt,
        twitterUsername: this.twitterOAuth.twitterUsername,
        twitterId: this.twitterOAuth.twitterId
    };
};

// Method to compare entered password with hashed password in DB
UserSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if subscription is active and not expired
UserSchema.methods.hasActiveSubscription = function() {
    return this.subscription.isActive && 
           this.subscription.paymentStatus === 'confirmed' &&
           (!this.subscription.expiryDate || this.subscription.expiryDate > new Date());
};

// Method to get latest payment
UserSchema.methods.getLatestPayment = function() {
    if (!this.payments || this.payments.length === 0) return null;
    return this.payments[this.payments.length - 1];
};

// Virtual property to check if user has Twitter OAuth
UserSchema.virtual('hasTwitterOAuth').get(function() {
    return !!(this.twitterOAuth && this.twitterOAuth.accessToken);
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);