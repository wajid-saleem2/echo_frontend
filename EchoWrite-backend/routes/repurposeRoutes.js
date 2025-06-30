// backend/routes/repurposeRoutes.js
const express = require('express');
const router = express.Router();
const {
    generateAndSaveSnippets,
    getSnippetsForContent,
    updateSnippet,
    deleteSnippet
} = require('../controllers/repurposeController');
const { protect } = require('../middleware/authMiddleware');

// Generate snippets for a specific content piece and target platform
router.post('/:contentId/generate', protect, generateAndSaveSnippets);

// Get all snippets for a specific content piece
router.get('/:contentId', protect, getSnippetsForContent);

// Update a specific snippet
router.put('/snippet/:snippetId', protect, updateSnippet);

// Delete a specific snippet
router.delete('/snippet/:snippetId', protect, deleteSnippet);

module.exports = router;