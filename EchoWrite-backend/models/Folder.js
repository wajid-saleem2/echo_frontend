// backend/models/Folder.js
const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Folder name is required.'],
        trim: true,
        maxlength: [100, 'Folder name cannot be more than 100 characters.']
    },
    user: { // The user who owns this folder
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    // Optional: For nested folders, though let's start with flat folders
    // parentFolder: {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Folder',
    //     default: null
    // },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

FolderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Index for efficient querying by user
FolderSchema.index({ user: 1, name: 1 }, { unique: true }); // User can't have two folders with the same name (at the same level if nesting)

module.exports = mongoose.model('Folder', FolderSchema);