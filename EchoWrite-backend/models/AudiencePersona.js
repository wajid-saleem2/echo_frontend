// backend/models/AudiencePersona.js
const mongoose = require('mongoose');

const AudiencePersonaSchema = new mongoose.Schema({
    name: { // User-given name for the persona
        type: String,
        required: [true, 'Persona name is required.'],
        trim: true,
        maxlength: [100, 'Persona name cannot be more than 100 characters.']
    },
    description: { // Detailed description of the persona for the AI
        type: String,
        required: [true, 'Persona description is required.'],
        trim: true,
        maxlength: [1000, 'Persona description is too long.']
    },
    // You could add more structured fields later, e.g., demographics, pain points, goals, preferred channels
    // For now, a good description is key.
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

AudiencePersonaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

AudiencePersonaSchema.index({ user: 1, name: 1 }, { unique: true }); // User can't have two personas with the same name

module.exports = mongoose.model('AudiencePersona', AudiencePersonaSchema);