// backend/utils/apiKeyHelper.js
const User = require('../models/User');

const getAllUserApiKeys = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;
    return {
        openai: user.getDecryptedOpenAiApiKey(),
        gemini: user.getDecryptedGeminiApiKey(),
        perplexity: user.getDecryptedPerplexityApiKey(),
    };
};

module.exports = { getAllUserApiKeys };