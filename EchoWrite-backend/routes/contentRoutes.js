// backend/routes/contentRoutes.js
const express = require('express');
const router = express.Router();
const {
    createContentPiece,
    getUserContentPieces,
    getContentPieceById,
    updateContentPiece,
    deleteContentPiece,
    getUniqueUserTags
} = require('../controllers/contentController');
const { protect } = require('../middleware/authMiddleware'); // Our JWT protection middleware

// All routes here are protected
router.route('/')
    .post(protect, createContentPiece)
    .get(protect, getUserContentPieces);
    
router.get('/tags/unique', protect, getUniqueUserTags); // Add before /:id route

router.route('/:id')
    .get(protect, getContentPieceById)
    .put(protect, updateContentPiece)
    .delete(protect, deleteContentPiece);

module.exports = router;