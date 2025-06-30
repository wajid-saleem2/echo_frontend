// backend/controllers/folderController.js
const Folder = require('../models/Folder');
const ContentPiece = require('../models/ContentPiece'); // To update content pieces when folder is deleted

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
exports.createFolder = async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Folder name is required.' });
    }
    try {
        const folderExists = await Folder.findOne({ name, user: req.user.id });
        if (folderExists) {
            return res.status(400).json({ message: 'A folder with this name already exists.' });
        }

        const folder = await Folder.create({ name, user: req.user.id });
        res.status(201).json(folder);
    } catch (error) {
        console.error("Create Folder Error:", error);
        if (error.code === 11000) return res.status(400).json({ message: 'Folder name already exists.' });
        res.status(500).json({ message: 'Server error creating folder.' });
    }
};

// @desc    Get all folders for the logged-in user
// @route   GET /api/folders
// @access  Private
exports.getUserFolders = async (req, res) => {
    try {
        const folders = await Folder.find({ user: req.user.id }).sort({ name: 1 });
        res.json(folders);
    } catch (error) {
        console.error("Get User Folders Error:", error);
        res.status(500).json({ message: 'Server error fetching folders.' });
    }
};

// @desc    Update a folder (e.g., rename)
// @route   PUT /api/folders/:folderId
// @access  Private
exports.updateFolder = async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'New folder name is required.' });
    }
    try {
        const folder = await Folder.findById(req.params.folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found.' });
        if (folder.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this folder.' });
        }

        // Check if new name already exists for this user (excluding current folder)
        const existingFolderWithNewName = await Folder.findOne({ name, user: req.user.id, _id: { $ne: req.params.folderId } });
        if (existingFolderWithNewName) {
            return res.status(400).json({ message: 'Another folder with this name already exists.' });
        }

        folder.name = name;
        await folder.save();
        res.json(folder);
    } catch (error) {
        console.error("Update Folder Error:", error);
        if (error.code === 11000) return res.status(400).json({ message: 'Folder name already exists.' });
        res.status(500).json({ message: 'Server error updating folder.' });
    }
};

// @desc    Delete a folder
// @route   DELETE /api/folders/:folderId
// @access  Private
exports.deleteFolder = async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.folderId);
        if (!folder) return res.status(404).json({ message: 'Folder not found.' });
        if (folder.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this folder.' });
        }

        // Option 1: Disassociate content pieces from this folder (set their folder field to null)
        await ContentPiece.updateMany({ folder: req.params.folderId, user: req.user.id }, { $set: { folder: null } });

        // Option 2: Delete content pieces within the folder (more destructive, ask user)
        // For now, let's go with disassociation.

        await folder.deleteOne();
        res.json({ message: 'Folder deleted successfully. Content pieces within it are now un-foldered.' });
    } catch (error) {
        console.error("Delete Folder Error:", error);
        res.status(500).json({ message: 'Server error deleting folder.' });
    }
};