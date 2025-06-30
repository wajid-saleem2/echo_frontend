// backend/models/RepurposedSnippet.js
const mongoose = require('mongoose');

const RepurposedSnippetSchema = new mongoose.Schema({
    originalContent: { // Reference to the parent ContentPiece
        type: mongoose.Schema.ObjectId,
        ref: 'ContentPiece',
        required: true
    },
    user: { // Denormalized for easier querying, or could be populated from originalContent.user
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    platform: { // The target platform for this snippet
        type: String,
        enum: [
            'twitter_thread_item', // Individual tweet in a thread
            'linkedin_post',
            'email_snippet',
            'short_summary',
            'key_takeaways_list', // Bullet points
            'blog_excerpt',
            'instagram_caption',
            'quora_answer_draft'
        ],
        required: true
    },
    generatedText: {
        type: String,
        required: true
    },
    // Optional: To group items, e.g., all tweets in one thread
    groupRef: {
        type: String, // Could be a UUID generated when a "thread" or "multi-part post" is created
        index: true, // Index if you plan to query by group often
        sparse: true // Allows documents without this field
    },
    orderInGroup: { // For ordered items like tweets in a thread
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'finalized', 'archived'],
        default: 'draft'
    },
    notes: { // User's personal notes about this snippet
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

RepurposedSnippetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

RepurposedSnippetSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

RepurposedSnippetSchema.index({originalContent: 1, createdAt: -1 });
RepurposedSnippetSchema.index({user: 1, platform: 1})

module.exports = mongoose.model('RepurposedSnippet', RepurposedSnippetSchema);