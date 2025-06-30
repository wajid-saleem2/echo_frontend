// backend/routes/templateRoutes.js
const express = require('express');
const router = express.Router();
const {
    createSnippetTemplate,
    getUserSnippetTemplates,
    getSnippetTemplateById,
    updateSnippetTemplate,
    deleteSnippetTemplate,
    getCommunitySnippetTemplates,
    cloneCommunitySnippetTemplate,
    getCommunityTemplateCategories,
    getCommunityTemplateTags
} = require('../controllers/templateController');
const { protect } = require('../middleware/authMiddleware');

// --- Specific Community Routes FIRST ---
router.get('/community', protect, getCommunitySnippetTemplates);
router.post('/community/:templateId/clone', protect, cloneCommunitySnippetTemplate); // This :templateId is fine here as it's more specific
router.get('/community/categories', protect, getCommunityTemplateCategories);
router.get('/community/tags', protect, getCommunityTemplateTags);

// --- CRUD for user's own templates (generic :templateId route LAST for this level) ---
router.route('/')
    .post(protect, createSnippetTemplate)
    .get(protect, getUserSnippetTemplates);

router.route('/:templateId') // This will now only match actual template IDs
    .get(protect, getSnippetTemplateById)
    .put(protect, updateSnippetTemplate)
    .delete(protect, deleteSnippetTemplate);

module.exports = router;