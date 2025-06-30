// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const aiService = require('../services/aiService');
const ContentPiece = require('../models/ContentPiece');
const { getAllUserApiKeys } = require('../utils/apiKeyHelper'); // <<<< IMPORT THE HELPER

 // Helper ti Check if the selected provider's key is configured
 const aiProviderHelper = (aiProvider) => {

     if (aiProvider === 'openai' && !userApiKeys.openai) throw new Error("OpenAI API key not configured.");
     // ... (add checks for gemini and perplexity keys) ...
     if (aiProvider === 'gemini' && !userApiKeys.gemini) throw new Error("Gemini API key not configured.");
     if (aiProvider === 'perplexity' && !userApiKeys.perplexity) throw new Error("Perplexity API key not configured.");
 }

// @desc    AI Structure content with headings
// @route   POST /api/ai/structure-content
// @access  Private
router.post('/structure-content', protect, async (req, res) => {
    const { text, aiProvider } = req.body;

    if (!text || !aiProvider) {
        return res.status(400).json({ message: 'Text and AI provider are required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        if (!userApiKeys) {
            return res.status(404).json({ message: 'User not found or API keys inaccessible.' });
        }

        // Check if the selected provider's key is configured
        if (aiProvider === 'openai' && !userApiKeys.openai) throw new Error("OpenAI API key not configured.");
        if (aiProvider === 'gemini' && !userApiKeys.gemini) throw new Error("Gemini API key not configured.");
        if (aiProvider === 'perplexity' && !userApiKeys.perplexity) throw new Error("Perplexity API key not configured.");


        const result = await aiService.structureTextWithHeadings(text, aiProvider, userApiKeys);

        if (result && result.error) {
            return res.status(400).json({ message: result.error });
        }
        res.json(result); // Should be { structuredText: "..." }

    } catch (error) {
        console.error("AI Structure Content Error:", error);
        res.status(500).json({ message: error.message || 'Server error during content structuring.' });
    }
});

// @desc    AI Extract Image Keywords from text
// @route   POST /api/ai/image-keywords
// @access  Private
router.post('/image-keywords', protect, async (req, res) => {
    const { text, aiProvider, count = 5 } = req.body;

    if (!text || !aiProvider) {
        return res.status(400).json({ message: 'Text and AI provider are required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        if (!userApiKeys) {
            return res.status(404).json({ message: 'User not found or API keys inaccessible.' });
        }

        // Check if the selected provider's key is configured
        if (aiProvider === 'openai' && !userApiKeys.openai) throw new Error("OpenAI API key not configured.");
        if (aiProvider === 'gemini' && !userApiKeys.gemini) throw new Error("Gemini API key not configured.");
        if (aiProvider === 'perplexity' && !userApiKeys.perplexity) throw new Error("Perplexity API key not configured.");

        const keywords = await aiService.extractImageKeywordsFromText(text, aiProvider, userApiKeys, count);

        if (keywords && keywords.error) {
            return res.status(400).json({ message: keywords.error });
        }
        res.json(keywords || []); // Returns an array of keyword strings

    } catch (error) {
        console.error("AI Image Keywords Error:", error);
        res.status(500).json({ message: error.message || 'Server error during image keyword extraction.' });
    }
});

// @desc    Generic AI text enhancement
// @route   POST /api/ai/enhance-text
// @access  Private
router.post('/enhance-text', protect, async (req, res) => {
    const { text, action, aiProvider, options = {} } = req.body;
    // action: 'generate-headlines', 'summarize', 'suggest-hashtags'
    // aiProvider: 'openai', 'gemini', 'perplexity';
    // options: { count: 3, length: 'short' }

    if (!text || !action || !aiProvider) {
        return res.status(400).json({ message: 'Text, action, and AI provider are required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        if (!userApiKeys) return res.status(404).json({ message: 'User not found.' });

        let result;
        switch (action) {
            case 'generate-headlines':
                result = await aiService.generateAlternativeHeadlines(text, aiProvider, userApiKeys, options.count);
                break;
            case 'summarize':
                result = await aiService.summarizeTextWithAI(text, aiProvider, userApiKeys, options.length);
                break;
            case 'hashtags':
                // You'd create a similar multi-provider function in aiService.js for hashtags
                result = await aiService.suggestHashtags(text, aiProvider, userApiKeys, options.count);
                // return res.status(501).json({ message: 'Hashtag suggestion not fully implemented for multi-provider yet.' }); // Placeholder
                break;
            case 'rewrite-style-tone':
                console.log("Backend /enhance-text received options for rewrite-style-tone:", JSON.stringify(options, null, 2)); // Log this
                if (!options.targetStyleOrTone) {
                    return res.status(400).json({ message: 'Target style or tone is required for rewriting.' });
                }
                result = await aiService.rewriteWithStyleAndTone(text, options.targetStyleOrTone, aiProvider, userApiKeys, options.referenceStyleText, options.personaDescription);
                break;
            case 'rephrase': // <<<< NEW CASE
                result = await aiService.rephraseText(text, aiProvider, userApiKeys, options.instruction); // options.instruction can be passed from frontend
                break;
            default:
                return res.status(400).json({ message: 'Invalid AI action.' });
        }

        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);

    } catch (error) {
        console.error("AI Enhance Text Error:", error);
        res.status(500).json({ message: error.message || 'Server error during AI enhancement.' });
    }
});

// @desc    Suggest related content topics based on user's existing content
// @route   POST /api/ai/suggest-topics
// @access  Private
router.post('/suggest-topics', protect, async (req, res) => {
    const { aiProvider, count = 5, sampleSize = 3 } = req.body; // sampleSize: how many existing pieces to analyze

    if (!aiProvider) {
        return res.status(400).json({ message: 'AI provider is required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id); // Assumes this helper exists
        if (!userApiKeys) return res.status(404).json({ message: 'User not found or API keys inaccessible.' });

        // Fetch a few recent content pieces from the user
        const existingContent = await ContentPiece.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(sampleSize)
            .select('title originalText'); // Only fetch what's needed

        if (existingContent.length === 0) {
            return res.status(400).json({ message: "You don't have enough content yet for topic suggestions. Add some content pieces first!" });
        }

        const topics = await aiService.suggestRelatedTopics(existingContent, aiProvider, userApiKeys, count);

        if (topics && topics.error) return res.status(400).json({ message: topics.error });
        res.json(topics || []); // Ensure it's an array

    } catch (error) {
        console.error("Suggest Topics Error:", error);
        res.status(500).json({ message: error.message || 'Server error during topic suggestion.' });
    }
});

// @desc    AI Generate Content Expansion Ideas
// @route   POST /api/ai/expansion-ideas
// @access  Private
router.post('/expansion-ideas', protect, async (req, res) => {
    const { text, aiProvider, ideaType = "outlines", count = 3 } = req.body;

    if (!text || !aiProvider) {
        return res.status(400).json({ message: 'Text and AI provider are required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        if (!userApiKeys) return res.status(404).json({ message: 'User not found or API keys inaccessible.' });

        // Check if the selected provider's key is configured
        if (aiProvider === 'openai' && !userApiKeys.openai) throw new Error("OpenAI API key not configured.");
        // ... (add checks for gemini and perplexity keys) ...
        if (aiProvider === 'gemini' && !userApiKeys.gemini) throw new Error("Gemini API key not configured.");
        if (aiProvider === 'perplexity' && !userApiKeys.perplexity) throw new Error("Perplexity API key not configured.");

        const ideas = await aiService.generateContentExpansionIdeas(text, aiProvider, userApiKeys, ideaType, count);

        if (ideas && ideas.error) {
            return res.status(400).json({ message: ideas.error });
        }
        res.json(ideas || []); // Returns an array of strings or objects (for outlines)

    } catch (error) {
        console.error("AI Expansion Ideas Error:", error);
        res.status(500).json({ message: error.message || 'Server error during idea generation.' });
    }
});

// @desc    AI Generate Marketing Email
// @route   POST /api/ai/generate-marketing-email
// @access  Private
router.post('/generate-marketing-email', protect, async (req, res) => {
    const { productOrService, targetAudience, keyMessage, desiredTone, aiProvider } = req.body;
    if (!productOrService || !targetAudience || !keyMessage || !desiredTone || !aiProvider) {
        return res.status(400).json({ message: 'All fields and AI provider are required.' });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check for aiProvider)
          // Check if the selected provider's key is configured
          if (aiProvider === 'openai' && !userApiKeys.openai) throw new Error("OpenAI API key not configured.");
          // ... (add checks for gemini and perplexity keys) ...
          if (aiProvider === 'gemini' && !userApiKeys.gemini) throw new Error("Gemini API key not configured.");
          if (aiProvider === 'perplexity' && !userApiKeys.perplexity) throw new Error("Perplexity API key not configured.");
  
        const result = await aiService.generateMarketingEmail(productOrService, targetAudience, keyMessage, desiredTone, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { email: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @desc    AI Generate Instagram Captions
// @route   POST /api/ai/generate-ig-captions
// @access  Private
router.post('/generate-ig-captions', protect, async (req, res) => {
    const { imageDescription, desiredVibe, includeHashtags, aiProvider, count } = req.body;
    if (!imageDescription || !desiredVibe || !aiProvider) {
        return res.status(400).json({ message: 'Image description, vibe, and AI provider are required.' });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check for aiProvider)
          // Check if the selected provider's key is configured
       aiProviderHelper();
  
        const result = await aiService.generateInstagramCaption(imageDescription, desiredVibe, !!includeHashtags, aiProvider, userApiKeys, count);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { captions: ["...", "..."] }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @desc    AI Generate Blog Post Ideas
// @route   POST /api/ai/generate-blog-ideas
// @access  Private
router.post('/generate-blog-ideas', protect, async (req, res) => {
    const { mainTopic, targetAudience, aiProvider, count } = req.body;
    if (!mainTopic || !aiProvider) {
        return res.status(400).json({ message: 'Main topic and AI provider are required.' });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check for aiProvider)
          // Check if the selected provider's key is configured
          if (aiProvider === 'openai' && !userApiKeys.openai) throw new Error("OpenAI API key not configured.");
          // ... (add checks for gemini and perplexity keys) ...
          if (aiProvider === 'gemini' && !userApiKeys.gemini) throw new Error("Gemini API key not configured.");
          if (aiProvider === 'perplexity' && !userApiKeys.perplexity) throw new Error("Perplexity API key not configured.");
  
        const result = await aiService.generateBlogPostIdeas(mainTopic, targetAudience, aiProvider, userApiKeys, count);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { ideas: ["...", "..."] }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Example for Cold Email Generator
router.post('/generate-cold-email', protect, async (req, res) => {
    const { productService, targetPersona, painPoint, valueProposition, callToAction, aiProvider } = req.body;
    // Add validation for required fields
    if (!productService || !targetPersona || !painPoint || !valueProposition || !callToAction || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check for aiProvider)
        if (aiProvider === 'openai' && !userApiKeys.openai) throw new Error("OpenAI API key not configured.");
        // ... (add checks for gemini and perplexity keys) ...
        if (aiProvider === 'gemini' && !userApiKeys.gemini) throw new Error("Gemini API key not configured.");
        if (aiProvider === 'perplexity' && !userApiKeys.perplexity) throw new Error("Perplexity API key not configured.");
        const result = await aiService.generateColdEmail(productService, targetPersona, painPoint, valueProposition, callToAction, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { email: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Example for Content Outline Generator
router.post('/generate-outline', protect, async (req, res) => {
    const { mainTopic, keywords, targetAudience, desiredSections, aiProvider } = req.body;
    // ... (validation)
    if (!mainTopic || !keywords || !targetAudience || !desiredSections || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check)
        aiProviderHelper();
        const result = await aiService.generateContentOutline(mainTopic, keywords, targetAudience, desiredSections, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { outline: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Example forparagraph rewriter
router.post('/rewrite-paragraph', protect, async (req, res) => {
    const { originalParagraph, rewriteInstruction, aiProvider } = req.body;
    // ... (validation)
    if (!originalParagraph || !rewriteInstruction || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check)
        aiProviderHelper();
        const result = await aiService.rewriteParagraph(originalParagraph, rewriteInstruction, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { outline: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Example for paragraph generator
router.post('/generate-paragraph', protect, async (req, res) => {
    const { topic, keywords, desiredTone, desiredLength, aiProvider } = req.body;
    // ... (validation)
    if (!topic || !keywords || !desiredTone || !desiredLength || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check)
        aiProviderHelper();
        const result = await aiService.generateParagraph(topic, keywords, desiredTone, desiredLength, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { outline: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// Example for product description generator
router.post('/generate-product-description', protect, async (req, res) => {
    const { productName, features, targetAudience, tone, aiProvider } = req.body;
    // ... (validation)
    if (!productName || !features || !targetAudience || !tone || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check)
        aiProviderHelper();
        const result = await aiService.generateProductDescription(productName, features, targetAudience, tone, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { outline: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/rewrite-sentence', protect, async (req, res) => {
    const { originalSentence, rewriteInstruction, aiProvider } = req.body;
    // ... (validation)
    if (!originalSentence || !rewriteInstruction || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check)
        aiProviderHelper();
        const result = await aiService.rewriteSentence(originalSentence, rewriteInstruction, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { outline: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/generate-meta-description', protect, async (req, res) => {
    const { pageTitle, pageContentSummary, keywords, aiProvider } = req.body;
    // ... (validation)
    if (!pageTitle || !pageContentSummary || !keywords || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check)
        aiProviderHelper();
        const result = await aiService.generateMetaDescription(pageTitle, pageContentSummary, keywords, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { outline: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/generate-slogan', protect, async (req, res) => {
    const { companyOrProduct, coreValues, targetAudience, aiProvider } = req.body;
    // ... (validation)
    if (!companyOrProduct || !coreValues || !targetAudience || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check)
        aiProviderHelper();
        const result = await aiService.generateSlogan(companyOrProduct, coreValues, targetAudience, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result); // Expects { outline: "..." }
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate content ideas
 */
router.post('/generate-content-ideas', protect, async (req, res) => {
    const { topic, audience, contentTypes, quantity, aiProvider } = req.body;
    if (!topic || !audience || !contentTypes || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateContentIdeas(topic, audience, contentTypes, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate sales copy
 */
router.post('/generate-sales-copy', protect, async (req, res) => {
    const { product, benefits, targetAudience, callToAction, wordCount, aiProvider } = req.body;
    if (!product || !benefits || !targetAudience || !callToAction || !wordCount || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateSalesCopy(product, benefits, targetAudience, callToAction, wordCount, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate motto/slogan
 */
router.post('/generate-motto', protect, async (req, res) => {
    const { brand, industry, values, tone, quantity, aiProvider } = req.body;
    if (!brand || !industry || !values || !tone || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateMotto(brand, industry, values, tone, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate ad copy
 */
router.post('/generate-ad-copy', protect, async (req, res) => {
    const { product, platform, audience, uniqueSellingPoints, characterLimit, aiProvider } = req.body;
    if (!product || !platform || !audience || !uniqueSellingPoints || !characterLimit || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateAdCopy(product, platform, audience, uniqueSellingPoints, characterLimit, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate attention-grabbing hooks
 */
router.post('/generate-hook', protect, async (req, res) => {
    const { topic, audience, contentType, tone, quantity, aiProvider } = req.body;
    if (!topic || !audience || !contentType || !tone || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateHook(topic, audience, contentType, tone, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate Instagram hashtags
 */
router.post('/generate-instagram-hashtags', protect, async (req, res) => {
    const { postTopic, niche, location, trendLevel, quantity, aiProvider } = req.body;
    if (!postTopic || !niche || !trendLevel || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateInstagramHashtags(postTopic, niche, location, trendLevel, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate business name ideas
 */
router.post('/generate-business-name', protect, async (req, res) => {
    const { industry, keywords, brandValues, nameStyle, quantity, aiProvider } = req.body;
    if (!industry || !keywords || !brandValues || !nameStyle || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateBusinessName(industry, keywords, brandValues, nameStyle, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Paraphrase text
 */
router.post('/paraphrase-text', protect, async (req, res) => {
    const { originalText, tone, complexity, preserveKeywords, aiProvider } = req.body;
    if (!originalText || !tone || !complexity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.paraphraseText(originalText, tone, complexity, preserveKeywords, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Rewrite content
 */
router.post('/rewrite-content', protect, async (req, res) => {
    const { originalText, purpose, style, length, focusKeywords, aiProvider } = req.body;
    if (!originalText || !purpose || !style || !length || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.rewriteContent(originalText, purpose, style, length, focusKeywords, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate video script
 */
router.post('/generate-video-script', protect, async (req, res) => {
    const { topic, audience, duration, style, callToAction, aiProvider } = req.body;
    if (!topic || !audience || !duration || !style || !callToAction || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateVideoScript(topic, audience, duration, style, callToAction, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate FAQ schema
 */
router.post('/generate-faq-schema', protect, async (req, res) => {
    const { topic, audience, commonConcerns, depth, aiProvider } = req.body;
    if (!topic || !audience || !depth || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateFAQSchema(topic, audience, commonConcerns, depth, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate icebreakers for outreach
 */
router.post('/generate-icebreakers', protect, async (req, res) => {
    const { prospectInfo, context, tone, quantity, aiProvider } = req.body;
    if (!prospectInfo || !context || !tone || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateIcebreakers(prospectInfo, context, tone, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate YouTube keywords and description
 */
router.post('/generate-youtube-keywords', protect, async (req, res) => {
    const { videoTopic, targetAudience, competitors, descriptionLength, aiProvider } = req.body;
    if (!videoTopic || !targetAudience || !descriptionLength || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateYouTubeKeywords(videoTopic, targetAudience, competitors, descriptionLength, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Create content from transcript
 */
router.post('/create-content-from-transcript', protect, async (req, res) => {
    const { transcript, contentType, audience, keyPoints, aiProvider } = req.body;
    if (!transcript || !contentType || !audience || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.createContentFromTranscript(transcript, contentType, audience, keyPoints, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Create webinar brief
 */
router.post('/create-webinar-brief', protect, async (req, res) => {
    const { topic, audience, goals, speakerInfo, duration, aiProvider } = req.body;
    if (!topic || !audience || !goals || !speakerInfo || !duration || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.createWebinarBrief(topic, audience, goals, speakerInfo, duration, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Humanize AI-generated text
 */
router.post('/humanize-text', protect, async (req, res) => {
    const { aiText, tone, complexity, audience, aiProvider } = req.body;
    if (!aiText || !tone || !complexity || !audience || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.humanizeText(aiText, tone, complexity, audience, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate random names
 */
router.post('/generate-random-names', protect, async (req, res) => {
    const { nameType, gender, origin, quantity, uniqueness, aiProvider } = req.body;
    if (!nameType || !quantity || !uniqueness || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateRandomNames(nameType, gender, origin, quantity, uniqueness, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate usernames
 */
router.post('/generate-usernames', protect, async (req, res) => {
    const { keywords, nameStyle, platform, quantity, aiProvider } = req.body;
    if (!keywords || !nameStyle || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateUsernames(keywords, nameStyle, platform, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate sales email
 */
router.post('/generate-sales-email', protect, async (req, res) => {
    const { product, prospect, painPoints, callToAction, emailLength, aiProvider } = req.body;
    if (!product || !prospect || !callToAction || !emailLength || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateSalesEmail(product, prospect, painPoints, callToAction, emailLength, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate webinar titles
 */
router.post('/generate-webinar-title', protect, async (req, res) => {
    const { topic, audience, keyBenefits, tone, quantity, aiProvider } = req.body;
    if (!topic || !audience || !keyBenefits || !tone || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateWebinarTitle(topic, audience, keyBenefits, tone, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate blog titles
 */
router.post('/generate-blog-title', protect, async (req, res) => {
    const { topic, audience, keywords, tone, quantity, aiProvider } = req.body;
    if (!topic || !audience || !tone || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateBlogTitle(topic, audience, keywords, tone, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate SEO titles
 */
router.post('/generate-seo-title', protect, async (req, res) => {
    const { topic, targetKeywords, searchIntent, competitors, quantity, aiProvider } = req.body;
    if (!topic || !targetKeywords || !searchIntent || !quantity || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateSEOTitle(topic, targetKeywords, searchIntent, competitors, quantity, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

/**
 * Generate acronyms
 */
router.post('/generate-acronym', protect, async (req, res) => {
    const { phrase, purpose, style, alternatives, aiProvider } = req.body;
    if (!phrase || !purpose || !style || !alternatives || !aiProvider) {
        return res.status(400).json({ message: "All input fields and AI provider are required." });
    }
    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        aiProviderHelper();
        const result = await aiService.generateAcronym(phrase, purpose, style, alternatives, aiProvider, userApiKeys);
        if (result && result.error) return res.status(400).json({ message: result.error });
        res.json(result);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// @desc    AI Suggest Best Platform(s) for a Snippet
// @route   POST /api/ai/suggest-platforms
// @access  Private
router.post('/suggest-platforms', protect, async (req, res) => {
    const { text, aiProvider, count = 2 } = req.body; // text is the snippet content

    if (!text || !aiProvider) {
        return res.status(400).json({ message: 'Snippet text and AI provider are required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check for aiProvider - IMPORTANT to add this)
         let keyIsConfigured = false;
         if (aiProvider === 'openai' && userApiKeys?.openai) keyIsConfigured = true;
         else if (aiProvider === 'gemini' && userApiKeys?.gemini) keyIsConfigured = true;
         else if (aiProvider === 'perplexity' && userApiKeys?.perplexity) keyIsConfigured = true;

         if (!keyIsConfigured) {
             return res.status(400).json({ message: `Your ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API key is not configured.` });
         }


        const result = await aiService.suggestBestPlatformsForSnippet(text, aiProvider, userApiKeys, count);

        if (result && result.error) {
            return res.status(400).json({ message: result.error });
        }
        res.json(result); // Expects { suggestions: [{ platform: "...", reason: "..." }, ...] }

    } catch (error) {
        console.error("AI Suggest Platforms Error:", error);
        res.status(500).json({ message: error.message || 'Server error during platform suggestion.' });
    }
});

// @desc    AI Translate Text
// @route   POST /api/ai/translate-text
// @access  Private
router.post('/translate-text', protect, async (req, res) => {
    const { text, targetLanguage, sourceLanguage = "auto", aiProvider } = req.body;

    if (!text || !targetLanguage || !aiProvider) {
        return res.status(400).json({ message: 'Text to translate, target language, and AI provider are required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check for aiProvider - IMPORTANT to add this)
        let keyIsConfigured = false;
        if (aiProvider === 'openai' && userApiKeys?.openai) keyIsConfigured = true;
        else if (aiProvider === 'gemini' && userApiKeys?.gemini) keyIsConfigured = true;
        else if (aiProvider === 'perplexity' && userApiKeys?.perplexity) keyIsConfigured = true;

        if (!keyIsConfigured) {
            return res.status(400).json({ message: `Your ${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API key is not configured.` });
        }

        const result = await aiService.translateTextWithAI(text, targetLanguage, aiProvider, userApiKeys, sourceLanguage);

        if (result && result.error) {
            return res.status(400).json({ message: result.error });
        }
        res.json(result); // Expects { translatedText: "..." }

    } catch (error) {
        console.error("AI Translate Text Error:", error);
        res.status(500).json({ message: error.message || 'Server error during translation.' });
    }
});

// @desc    AI Chat-Assisted Content Generation
// @route   POST /api/ai/chat-content-assist
// @access  Private
router.post('/chat-content-assist', protect, async (req, res) => {
    const {
        userPrompt,
        conversationHistory = [],
        generationTarget, // e.g., "title", "introduction", "body_paragraph", "full_draft"
        existingTitle = "",
        existingBody = "",
        aiProvider,
        numVariations = 1
    } = req.body;

    if (!userPrompt || !generationTarget || !aiProvider) {
        return res.status(400).json({ message: 'User prompt, generation target, and AI provider are required.' });
    }

    try {
        const userApiKeys = await getAllUserApiKeys(req.user.id);
        // ... (API key configured check for aiProvider) ...
         let keyIsConfigured = false;
         if (aiProvider === 'openai' && userApiKeys?.openai) keyIsConfigured = true;
         else if (aiProvider === 'gemini' && userApiKeys?.gemini) keyIsConfigured = true;
         else if (aiProvider === 'perplexity' && userApiKeys?.perplexity) keyIsConfigured = true;
         if (!keyIsConfigured) {
             return res.status(400).json({ message: `Your ${aiProvider} API key is not configured.` });
         }


        const result = await aiService.generateChatAssistedContent(
            userPrompt, conversationHistory, generationTarget,
            existingTitle, existingBody, aiProvider, userApiKeys, numVariations
        );

        if (result && result.error) {
            return res.status(400).json({ message: result.error });
        }
        res.json(result); // Expects { generatedText: "..." }

    } catch (error) {
        console.error("AI Chat Content Assist Error:", error);
        res.status(500).json({ message: error.message || 'Server error during chat content assist.' });
    }
});


module.exports = router;