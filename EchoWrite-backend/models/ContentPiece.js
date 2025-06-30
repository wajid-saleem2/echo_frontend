// backend/models/ContentPiece.js
const mongoose = require('mongoose');

const ContentPieceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    originalText: {
        type: String,
        required: [true, 'Original text content is required']
    },
    sourceUrl: {
        type: String,
        trim: true,
        // Basic URL validation (can be more robust)
        match: [/^(ftp|http|https):\/\/[^ "]+$/, 'Please enter a valid URL for the source (optional)']
    },
    contentType: {
        type: String,
        enum: ['blog_post', 'video_script', 'podcast_transcript', 'general_text', 'ai_ig_caption', 'ai_marketing_email', 'ai_cold_email', 'ai_content_outline', 'ai_paragraph_rewriter', 'ai_paragraph_generator', 'ai_blog_idea', 'ai_generated', 'other'],
        default: 'general_text'
    },
    excerpt: {
        type: String,
        maxlength: [500, 'Excerpt cannot be more than 500 characters'] // Example length
    },
    tags: [{
        type: String,
        trim: true
    }],
    user: { // Renamed from userId for clarity, referencing the User model
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    folder: { // The folder this content piece belongs to
        type: mongoose.Schema.ObjectId,
        ref: 'Folder',
        default: null // Can be null if not in any folder
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

// Middleware to update `updatedAt` field on save
ContentPieceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Middleware to update `updatedAt` field on findOneAndUpdate
ContentPieceSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

ContentPieceSchema.index({user: 1, createdAt: -1});


module.exports = mongoose.model('ContentPiece', ContentPieceSchema);