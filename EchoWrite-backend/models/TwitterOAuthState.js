// backend/models/TwitterOAuthState.js
const mongoose = require('mongoose');

const twitterOAuthStateSchema = new mongoose.Schema({
    stateId: {
        type: String,
        required: true,
        unique: true
    },
    state: {
        type: String,
        required: true,
        unique: true
    },
    codeVerifier: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        // MongoDB TTL index will automatically delete documents after they expire
        index: { expireAfterSeconds: 0 }
    }
});

// Create compound index for faster lookups
twitterOAuthStateSchema.index({ state: 1, expiresAt: 1 });

module.exports = mongoose.model('TwitterOAuthState', twitterOAuthStateSchema);
