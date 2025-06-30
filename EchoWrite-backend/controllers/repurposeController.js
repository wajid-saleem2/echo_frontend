// backend/controllers/repurposeController.js
const ContentPiece = require('../models/ContentPiece');
const RepurposedSnippet = require('../models/RepurposedSnippet');
const ruleBasedRepurposingService  = require('../services/repurposingService');
const { getAllUserApiKeys } = require('../utils/apiKeyHelper'); // To get user keys
const aiRepurposingService = require('../services/aiService'); // For AI-powered

// @desc    Generate and save repurposed snippets for a content piece
// @route   POST /api/repurpose/:contentId/generate
// @access  Private
exports.generateAndSaveSnippets = async (req, res) => {
    const { contentId } = req.params;
    const { targetPlatform, aiProvider } = req.body;


    if (!targetPlatform) {
        return res.status(400).json({ message: 'Target platform is required.' });
    }

    try {
        const originalContent = await ContentPiece.findById(contentId);
        if (!originalContent) {
            return res.status(404).json({ message: 'Original content piece not found.' });
        }
        if (originalContent.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized for this content piece.' });
        }
        let snippetBlueprints = [];
        const userApiKeys = await getAllUserApiKeys(req.user.id); // Get all keys

        // --- AI-Powered Repurposing ---
        if (targetPlatform.endsWith('_ai')) {
            if (!aiProvider) {
                return res.status(400).json({ message: 'AI provider selection is required for AI-powered repurposing.' });
            }
            // Check if selected provider's key is configured
            if (aiProvider === 'openai' && !userApiKeys?.openai) throw new Error("OpenAI API key not configured.");
            if (aiProvider === 'gemini' && !userApiKeys?.gemini) throw new Error("Gemini API key not configured.");
            if (aiProvider === 'perplexity' && !userApiKeys?.perplexity) throw new Error("Perplexity API key not configured.");


            switch (targetPlatform) {
                case 'twitter_thread_ai':
                    const tweetsResult = await aiRepurposingService.generateTwitterThreadWithAI(originalContent.originalText, aiProvider, userApiKeys);
                    if (tweetsResult.error) throw new Error(tweetsResult.error);
                    if (Array.isArray(tweetsResult)) {
                        snippetBlueprints = tweetsResult.map((tweetText, index) => ({
                            platform: 'twitter_thread_item', // Store as individual items
                            generatedText: tweetText,
                            groupRef: `thread-${Date.now()}`, // Simple group ref
                            orderInGroup: index + 1,
                        }));
                    }
                    break;
                case 'linkedin_post_ai':
                    const liResult = await aiRepurposingService.generateLinkedInPostWithAI(originalContent.originalText, aiProvider, userApiKeys);
                    if (liResult.error) throw new Error(liResult.error);
                    if (liResult.linkedInPost) {
                        snippetBlueprints.push({ platform: 'linkedin_post', generatedText: liResult.linkedInPost });
                    }
                    break;
                case 'key_takeaways_ai':
                    const ktResult = await aiRepurposingService.generateKeyTakeawaysWithAI(originalContent.originalText, aiProvider, userApiKeys);
                    if (ktResult.error) throw new Error(ktResult.error);
                    if (ktResult.keyTakeaways) {
                        snippetBlueprints.push({ platform: 'key_takeaways_list', generatedText: ktResult.keyTakeaways });
                    }
                    break;
                case 'summary_ai':
                    // Using the existing summarizeTextWithAI from aiService
                    const summaryResult = await aiRepurposingService.summarizeTextWithAI(originalContent.originalText, aiProvider, userApiKeys, 'medium'); // or 'short'
                    if (summaryResult.error) throw new Error(summaryResult.error);
                    if (summaryResult.summary) {
                        snippetBlueprints.push({ platform: 'short_summary', generatedText: summaryResult.summary });
                    }
                    break;
                default:
                    return res.status(400).json({ message: `Unsupported AI target platform: ${targetPlatform}` });
            }
        }
        // --- Rule-Based Repurposing (Fallback or if targetPlatform doesn't end with _ai) ---
        // You might choose to remove rule-based if AI is the primary path now, or keep it as an option.
        else {
            snippetBlueprints = ruleBasedRepurposingService.generateRepurposedSnippets(originalContent, targetPlatform);
        }


        if (!snippetBlueprints || snippetBlueprints.length === 0) {
            return res.status(400).json({ message: `Could not generate snippets for ${targetPlatform}. AI might have returned empty or failed.` });
        }

        // Attach user and originalContent IDs to all blueprints
        const finalBlueprints = snippetBlueprints.map(snippet => ({
            ...snippet,
            user: originalContent.user,
            originalContent: originalContent._id,
        }));

        const createdSnippets = await RepurposedSnippet.insertMany(finalBlueprints);
        res.status(201).json(createdSnippets);

    } catch (error) {
        console.error(`Generate Snippets Controller Error for ${targetPlatform}:`, error);
        res.status(500).json({ message: error.message || 'Server error while generating snippets.' });
    }
};

// @desc    Get all repurposed snippets for a specific original content piece
// @route   GET /api/repurpose/:contentId
// @access  Private
exports.getSnippetsForContent = async (req, res) => {
    const { contentId } = req.params;
    try {
        // Verify user owns the original content piece (optional, but good for security)
        const originalContent = await ContentPiece.findById(contentId);
        if (!originalContent || originalContent.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized or content not found.' });
        }

        const snippets = await RepurposedSnippet.find({ originalContent: contentId }).sort({ createdAt: -1, orderInGroup: 1 });
        res.json(snippets);
    } catch (error) {
        console.error('Get Snippets Error:', error);
        res.status(500).json({ message: 'Server error while fetching snippets.' });
    }
};

// @desc    Update a specific repurposed snippet
// @route   PUT /api/repurpose/snippet/:snippetId
// @access  Private
exports.updateSnippet = async (req, res) => {
    const { snippetId } = req.params;
    const { generatedText, status, notes } = req.body;

    try {
        const snippet = await RepurposedSnippet.findById(snippetId);
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }
        if (snippet.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this snippet.' });
        }

        if (generatedText !== undefined) snippet.generatedText = generatedText;
        if (status) snippet.status = status;
        if (notes !== undefined) snippet.notes = notes;

        const updatedSnippet = await snippet.save();
        res.json(updatedSnippet);
    } catch (error) {
        console.error('Update Snippet Error:', error);
        res.status(500).json({ message: 'Server error while updating snippet.' });
    }
};

// @desc    Delete a specific repurposed snippet
// @route   DELETE /api/repurpose/snippet/:snippetId
// @access  Private
exports.deleteSnippet = async (req, res) => {
    const { snippetId } = req.params;
    try {
        const snippet = await RepurposedSnippet.findById(snippetId);
        if (!snippet) {
            return res.status(404).json({ message: 'Snippet not found.' });
        }
        if (snippet.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this snippet.' });
        }

        await snippet.deleteOne();
        res.json({ message: 'Snippet deleted successfully.' });
    } catch (error) {
        console.error('Delete Snippet Error:', error);
        res.status(500).json({ message: 'Server error while deleting snippet.' });
    }
};