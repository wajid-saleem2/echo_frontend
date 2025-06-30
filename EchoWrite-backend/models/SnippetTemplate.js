// backend/models/SnippetTemplate.js
const mongoose = require('mongoose');

const SnippetTemplateSchema = new mongoose.Schema({
    name: { // User-given name for the template
        type: String,
        required: [true, 'Template name is required.'],
        trim: true,
        maxlength: [100, 'Template name cannot be more than 100 characters.']
    },
    content: { // The template string with placeholders
        type: String,
        required: [true, 'Template content is required.'],
        trim: true,
        maxlength: [2000, 'Template content is too long.'] // Adjust as needed
    },
    description: { // <<<< ADD THIS FIELD
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot be more than 500 characters.'] // Optional: add a max length
    },
    // Example placeholders: {title}, {excerpt}, {key_takeaway_1}, {key_takeaway_2}, {original_url}, {custom_field_1}
    // We'll need a defined set of placeholders or a way for users to define them.
    // For now, let's assume a few common ones.
    platformHint: { // Optional: a hint for which platform this template is best suited
        type: String,
        enum: ['twitter', 'linkedin', 'email', 'general', null],
        default: 'general'
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
      // --- Fields for Community Sharing ---
      isShared: { type: Boolean, default: false, index: true },
      sharedAt: { type: Date },
      communityUses: { type: Number, default: 0 }, // How many times it's been cloned/used by others
      // Optional: communityRating (can be added later if desired)
      category: { // User-defined or predefined categories for discoverability
          type: String,
          trim: true,
          lowercase: true,
          index: true,
          maxlength: 50
      },
      communityTags: [{ // Tags specifically for community discovery, separate from user's private tags
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 30
      }],
      // --- End Community Fields ---
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

SnippetTemplateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.isModified('isShared') && this.isShared && !this.sharedAt) {
        this.sharedAt = Date.now();
    }
    if (this.category) this.category = this.category.toLowerCase().trim();
    if (this.communityTags) this.communityTags = this.communityTags.map(t => t.toLowerCase().trim()).filter(t => t);
    next();
});

SnippetTemplateSchema.index({ user: 1, name: 1 }, { unique: true }); // User can't have two templates with the same name
// Add indexes for community querying
SnippetTemplateSchema.index({ isShared: 1, category: 1, sharedAt: -1 });
SnippetTemplateSchema.index({ isShared: 1, communityTags: 1, sharedAt: -1 });
module.exports = mongoose.model('SnippetTemplate', SnippetTemplateSchema);