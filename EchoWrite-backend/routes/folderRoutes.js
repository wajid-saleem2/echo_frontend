// backend/routes/folderRoutes.js
const express = require('express');
const router = express.Router();
const {
    createFolder,
    getUserFolders,
    updateFolder,
    deleteFolder
} = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createFolder)
    .get(protect, getUserFolders);

router.route('/:folderId')
    .put(protect, updateFolder)
    .delete(protect, deleteFolder);

module.exports = router;