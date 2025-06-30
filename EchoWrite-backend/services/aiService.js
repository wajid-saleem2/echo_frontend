// backend/services/aiService.js
const { OpenAI } = require('openai');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const axios = require('axios'); // For Perplexity or other HTTP APIs
const { v4: uuidv4 } = require('uuid'); // If needed for any unique IDs, though not directly in AI calls

// --- Helper: Word Count (can be moved to a shared utils file) ---
const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
};

// --- Helper: Calculate estimated tokens based on words
// GPT models generally use ~1.5 tokens per word
const estimateTokens = (text) => {
    return Math.ceil(getWordCount(text) * 1.5);
};

// --- Helper: Dynamically calculate required output tokens for AI response
const calculateRequiredOutputTokens = (inputText, outputRatio = 1.0) => {
    // Base minimum token count
    const baseTokens = 250;
    
    // Calculate tokens based on input length and desired output ratio
    const inputTokens = estimateTokens(inputText);
    const dynamicTokens = Math.ceil(inputTokens * outputRatio);
    
    // Return the greater of base or dynamic tokens, with a reasonable max cap
    return Math.min(Math.max(baseTokens, dynamicTokens), 4000);
};

// --- Specific AI Provider Call Functions ---

const callOpenAI = async (userApiKey, messages, model = "gpt-3.5-turbo", temperature = 0.7, max_tokens = null) => {
    if (!userApiKey) throw new Error("OpenAI API key is required for this operation.");
    const openai = new OpenAI({ apiKey: userApiKey });

    // If no max_tokens specified, calculate based on input
    if (max_tokens === null) {
        const inputText = messages.map(m => m.content).join(' ');
        max_tokens = calculateRequiredOutputTokens(inputText);
    }

    try {
        const completion = await openai.chat.completions.create({ model, messages, temperature, max_tokens });
        return completion.choices[0]?.message?.content?.trim();
    } catch (error) {
        console.error("OpenAI API Error:", error.response ? JSON.stringify(error.response.data) : error.message);
        if (error.response && error.response.status === 401) {
            throw new Error("OpenAI API: Invalid API Key or insufficient credits.");
        }
        throw new Error(`OpenAI API request failed: ${error.message}`);
    }
};

const callGemini = async (userApiKey, promptText, modelName = "gemini-2.0-flash", temperature = 0.7, maxOutputTokens = null) => {
    if (!userApiKey) throw new Error("Gemini API key is required for this operation.");
    const genAI = new GoogleGenerativeAI(userApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Calculate output tokens if not provided
    if (maxOutputTokens === null) {
        maxOutputTokens = calculateRequiredOutputTokens(promptText);
    }

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    try {
        const generationConfig = { temperature, maxOutputTokens };
        const result = await model.generateContent(promptText, generationConfig, { safetySettings });
        const response = result.response;
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            throw new Error(`Gemini: Content generation blocked - ${response.promptFeedback.blockReason}. Revise prompt.`);
        }
        return response.text()?.trim();
    } catch (error) {
        console.error("Gemini API Error:", error);
        if (error.message && error.message.includes("API key not valid")) {
            throw new Error("Gemini API: Invalid API Key.");
        }
        throw new Error(`Gemini API request failed: ${error.message}`);
    }
};

const callPerplexityOnline = async (userApiKey, messages, model = "pplx-7b-online") => {
    if (!userApiKey) throw new Error("Perplexity API key is required for this operation.");
    const PPLX_API_URL = "https://api.perplexity.ai/chat/completions";
    try {
        const response = await axios.post(PPLX_API_URL, {
            model: model,
            messages: messages,
        }, {
            headers: {
                'Authorization': `Bearer ${userApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            }
        });
        return response.data.choices[0]?.message?.content?.trim();
    } catch (error) {
        console.error("Perplexity API Error:", error.response ? JSON.stringify(error.response.data) : error.message);
        if (error.response && error.response.status === 401) {
            throw new Error("Perplexity API: Invalid API Key or unauthorized.");
        }
        const detail = error.response?.data?.error?.message || error.response?.data?.detail?.message || error.message;
        throw new Error(`Perplexity API request failed: ${detail}`);
    }
};

// --- Delegate to AI Provider ---
const delegateToAI = async (aiProvider, userApiKeys, taskFunctionForProvider, ...argsForTask) => {
    // This function now expects taskFunctionForProvider to be the actual function to call,
    // not an object with provider keys.
    let apiKey;
    switch (aiProvider) {
        case 'openai':
            apiKey = userApiKeys.openai;
            if (!apiKey) throw new Error("OpenAI API key not configured for your account.");
            break;
        case 'gemini':
            apiKey = userApiKeys.gemini;
            if (!apiKey) throw new Error("Gemini API key not configured for your account.");
            break;
        case 'perplexity':
            apiKey = userApiKeys.perplexity;
            if (!apiKey) throw new Error("Perplexity API key not configured for your account.");
            break;
        default:
            throw new Error(`Unsupported AI provider: ${aiProvider}`);
    }
    // Call the specific task function for the provider, passing the API key as the first of its specific args
    return taskFunctionForProvider(apiKey, ...argsForTask);
};


// --- EXPORTED AI Service Functions (Multi-Provider Ready) ---

/**
 * Summarizes a given text using the specified AI provider.
 * Enhanced to handle longer texts with dynamic token allocation.
 */
exports.summarizeTextWithAI = async (text, aiProvider, userApiKeys, length = "short") => {
    try {
        const taskFunction = (apiKey, currentText, summaryLength) => {
            // Adjust instruction based on text length
            let instruction = "Summarize this text concisely:";
            
            // Calculate required tokens based on input length and summary type
            let tokenMultiplier = 0.3; // Default for short summary
            
            if (summaryLength === "medium") {
                instruction = "Provide a medium-length summary (2-3 paragraphs) of this text:";
                tokenMultiplier = 0.5;
            } else if (summaryLength === "bullet_points") {
                instruction = "Summarize this text as a list of key bullet points:";
                tokenMultiplier = 0.4;
            }
            
            // Calculate dynamic tokens (min 200, max 2000)
            const estimatedRequiredTokens = Math.ceil(getWordCount(currentText) * tokenMultiplier);
            const maxTokens = Math.min(2000, Math.max(200, estimatedRequiredTokens));
            
            // Don't truncate text as severely, use at least 5000 chars
            const inputTextLength = Math.min(currentText.length, 5000);
            const inputText = currentText.substring(0, inputTextLength) + (currentText.length > inputTextLength ? "..." : "");

            if (aiProvider === 'openai') {
                const prompt = `${instruction}\n\nText:\n"${inputText}"\n\nSummary:`;
                return callOpenAI(apiKey, [{ role: "user", content: prompt }], "gpt-3.5-turbo", 0.5, maxTokens);
            } else if (aiProvider === 'gemini') {
                const prompt = `${instruction}\n\n${inputText}`;
                return callGemini(apiKey, prompt, "gemini-2.0-flash", 0.5, maxTokens);
            } else if (aiProvider === 'perplexity') {
                const messages = [
                    { role: "system", content: `${instruction} If it's a question, answer it with web context.` },
                    { role: "user", content: `Text: ${inputText}` }
                ];
                return callPerplexityOnline(apiKey, messages);
            }
        };
        
        const summary = await delegateToAI(aiProvider, userApiKeys, taskFunction, text, length);
        return { summary }; // Always return an object
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Generates alternative headlines for a given text using the specified AI provider.
 * Enhanced to dynamically adjust based on text length.
 */
exports.generateAlternativeHeadlines = async (text, aiProvider, userApiKeys, count = 3) => {
    try {
        const taskFunction = (apiKey, currentText, numHeadlines) => {
            // Calculate tokens based on input length and headline count
            const textLength = currentText.length;
            
            // Adjust prompt based on text length
            let promptPrefix;
            let tokensPerHeadline;
            
            if (textLength > 3000) {
                // For very long texts, be more specific
                promptPrefix = `Generate ${numHeadlines} compelling, specific headlines that capture the key insights from this longer text. `;
                tokensPerHeadline = 25; // More tokens for more specific headlines
            } else {
                promptPrefix = `Generate ${numHeadlines} alternative, compelling headlines for this text. `;
                tokensPerHeadline = 20; // Standard tokens per headline
            }
            
            // Calculate dynamic tokens with a minimum
            const maxTokens = Math.max(150, tokensPerHeadline * numHeadlines);
            
            // Use more of the text for context - at least 1500 chars for headline generation
            const inputTextLength = Math.min(Math.max(1500, textLength), 3000);
            const inputText = currentText.substring(0, inputTextLength) + (textLength > inputTextLength ? "..." : "");
            
            const commonPromptEnd = `Each headline should be on a new line.\n\nText:\n"${inputText}"\n\nHeadlines:`;
            
            if (aiProvider === 'openai') {
                const prompt = `${promptPrefix}${commonPromptEnd}`;
                return callOpenAI(apiKey, [{ role: "user", content: prompt }], "gpt-3.5-turbo", 0.7, maxTokens);
            } else if (aiProvider === 'gemini') {
                const prompt = `${promptPrefix}${commonPromptEnd}`;
                return callGemini(apiKey, prompt, "gemini-2.0-flash", 0.7, maxTokens);
            } else if (aiProvider === 'perplexity') {
                const messages = [
                    { role: "system", content: `You are a headline generation assistant. ${promptPrefix}` },
                    { role: "user", content: `Text: ${inputText}` }
                ];
                return callPerplexityOnline(apiKey, messages);
            }
        };
        
        const responseText = await delegateToAI(aiProvider, userApiKeys, taskFunction, text, count);
        return responseText ? responseText.split('\n').map(h => h.replace(/^- |^\d+\.\s*/, '').trim()).filter(h => h) : [];
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Rewrites text with a specific style or tone using the specified AI provider.
 */
exports.rewriteWithStyleAndTone = async (text, targetStyleOrTone, aiProvider, userApiKeys, referenceStyleText = null, personaDescription = null) => {
    try {
        const taskFunction = (apiKey, currentText, style, refText, personaDesc) => {
            // let systemMessage = `You are an expert content editor. Rewrite the provided text to adopt the specified style or tone: "${style}". Provide 3 distinct variations, each on a new line, separated by "---VARIATION---".`;
            // if (refText) {
                // systemMessage += `\nTry to match the style of this reference text: "${refText.substring(0, 500)}..."`;
            // }

            // Calculate length of text to estimate required output tokens
            const textLength = currentText.length;
            
            // Different behavior based on text length
            let systemMessage, tokenMultiplier;
            
            if (textLength > 2000) {
                // For long texts, request just one good variation
                systemMessage = `You are an expert content editor. Rewrite the provided text to adopt a ${style} style or tone. For this longer text, provide ONE excellent variation.`;
                tokenMultiplier = 1.2; // Just a bit more than the input length
            } else if (textLength > 1000) {
                // For medium texts, request two variations
                systemMessage = `You are an expert content editor. Rewrite the provided text to adopt a ${style} style or tone. Provide TWO distinct variations, separated by "---VARIATION---". Don't use any headings.`;
                tokenMultiplier = 2.5; // Need more tokens for multiple variations
            } else {
                // For shorter texts, provide three variations as original
                systemMessage = `You are an expert content editor. Rewrite the provided text to adopt a ${style} style or tone. Provide THREE distinct variations, each separated by "---VARIATION---". Don't use any headings.`;
                tokenMultiplier = 3.5; // Need significantly more tokens for multiple variations
            }
            
            // Add reference text if provided
            if (refText) {
                systemMessage += `\nTry to match the style of this reference text: "${refText.substring(0, 500)}..."`;
            }
            if (personaDesc) { // <<<< NEW: Incorporate Persona
                systemMessage += `\nIMPORTANT: Adapt the language, complexity, and focus for the following target audience persona: "${personaDesc.substring(0, 800)}..."`;
            }
            // const userPrompt = `Original Text:\n"${currentText}"`;

            const userPrompt = `Original Text:\n"${currentText}"\n\nRewritten Text (in "${style}" tone ${personaDesc ? 'for the specified persona' : ''}):`;

           // Calculate dynamic token allocation
            const estimatedRequiredTokens = Math.ceil(getWordCount(currentText) * tokenMultiplier);
            const maxTokens = Math.min(4000, Math.max(250, estimatedRequiredTokens)); // Cap at 4000 tokens

            if (aiProvider === 'openai') {
                const messages = [
                    { role: "system", content: systemMessage },
                    { role: "user", content: userPrompt }
                ];
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.7, maxTokens);
            } else if (aiProvider === 'gemini') {
                const fullPrompt = `${systemMessage}\n\n${userPrompt}`;
                return callGemini(apiKey, fullPrompt, "gemini-2.0-flash", 0.7, maxTokens);
            } else if (aiProvider === 'perplexity') {
                const messages = [
                    { role: "system", content: systemMessage },
                    { role: "user", content: userPrompt }
                ];
                return callPerplexityOnline(apiKey, messages);
            }
        };
        const rewrittenText = await delegateToAI(aiProvider, userApiKeys, taskFunction, text, targetStyleOrTone, referenceStyleText, personaDescription);
        return { rewrittenText }; // Always return an object
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Suggests related content topics based on existing content samples using the specified AI provider.
 */
exports.suggestRelatedTopics = async (existingContentSamples, aiProvider, userApiKeys, count = 5) => {
    if (!existingContentSamples || existingContentSamples.length === 0) {
        return { error: "No existing content provided to analyze for topic suggestions." };
    }
    let combinedText = "Based on the following themes and topics from existing content:\n";
    existingContentSamples.forEach(sample => {
        combinedText += `- Title: "${sample.title || 'Untitled'}". Snippet: ${sample.originalText.substring(0, 150)}...\n`;
    });
    combinedText = combinedText.substring(0, 2500); // Keep context reasonable

    try {
        const taskFunction = (apiKey, context, numTopics) => {
            const commonPromptEnd = `Suggest ${numTopics} new, distinct, and actionable content topics or blog post ideas based on these themes. List them one per line, without numbering or bullets.`;
            if (aiProvider === 'openai') {
                const prompt = `${context}\n\n${commonPromptEnd}`;
                return callOpenAI(apiKey, [{ role: "user", content: prompt }], "gpt-3.5-turbo", 0.8, 150 * numTopics);
            } else if (aiProvider === 'gemini') {
                const prompt = `${context}\n\n${commonPromptEnd}`;
                return callGemini(apiKey, prompt, "gemini-2.0-flash", 0.8, 150 * numTopics);
            } else if (aiProvider === 'perplexity') {
                const messages = [
                    { role: "system", content: `You are a content strategy assistant. ${commonPromptEnd} Consider current trends if possible.` },
                    { role: "user", content: context }
                ];
                return callPerplexityOnline(apiKey, messages);
            }
        };
        const responseText = await delegateToAI(aiProvider, userApiKeys, taskFunction, combinedText, count);
        return responseText ? responseText.split('\n').map(t => t.trim().replace(/^- |^\d+\.\s*/, '')).filter(t => t) : [];
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Suggests hashtags for a given text using the specified AI provider.
 */
exports.suggestHashtags = async (text, aiProvider, userApiKeys, count = 5) => {
    try {
        const taskFunction = (apiKey, currentText, numHashtags) => {
            const commonPrompt = `Based on the following text, suggest ${numHashtags} relevant hashtags. Provide them as a comma-separated list, without the '#' symbol.\n\nText:\n"${currentText.substring(0,1000)}..."\n\nHashtags:`;
            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [{role: "user", content: commonPrompt}], "gpt-3.5-turbo", 0.6, 50 + numHashtags * 5);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, commonPrompt, "gemini-2.0-flash", 0.6, 50 + numHashtags * 5);
            } else if (aiProvider === 'perplexity') {
                const messages = [
                    { role: "system", content: `You are a hashtag suggestion assistant. Provide ${numHashtags} relevant hashtags as a comma-separated list, without the '#' symbol.` },
                    { role: "user", content: `Text: ${currentText.substring(0,1000)}` }
                ];
                return callPerplexityOnline(apiKey, messages);
            }
        };
        const responseText = await delegateToAI(aiProvider, userApiKeys, taskFunction, text, count);
        return responseText ? responseText.split(',').map(h => h.trim().replace(/^#/, '')).filter(h => h) : [];
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Rephrases a given text using the specified AI provider.
 * Allows for an optional instruction to guide the rephrasing.
 */
exports.rephraseText = async (text, aiProvider, userApiKeys, instruction = "Rephrase the following text to improve clarity and conciseness, while maintaining the core meaning.") => {
    try {
        const taskFunction = (apiKey, currentText, rephraseInstruction) => {
            const textSnippet = currentText.substring(0, 2000); // Limit input text length

            if (aiProvider === 'openai') {
                const messages = [
                    { role: "system", content: rephraseInstruction }, // Use the provided instruction
                    { role: "user", content: textSnippet }
                ];
                // Adjust max_tokens based on expected output length (e.g., similar to input + a bit more)
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.7, Math.max(150, getWordCount(textSnippet) * 2 + 50));
            } else if (aiProvider === 'gemini') {
                const prompt = `${rephraseInstruction}\n\nOriginal Text:\n${textSnippet}`;
                return callGemini(apiKey, prompt, "gemini-1.5-flash-latest", 0.7, Math.max(150, getWordCount(textSnippet) * 2 + 50));
            } else if (aiProvider === 'perplexity') {
                // Perplexity might be better if the rephrasing needs web context, otherwise, a general prompt is fine.
                const messages = [
                    { role: "system", content: rephraseInstruction },
                    { role: "user", content: `Text to rephrase: ${textSnippet}` }
                ];
                return callPerplexityOnline(apiKey, messages); // Model can be adjusted
            }
            throw new Error(`Unsupported provider for rephraseText: ${aiProvider}`);
        };

        const rephrasedText = await delegateToAI(aiProvider, userApiKeys, taskFunction, text, instruction);

        // Ensure a consistent object response
        if (typeof rephrasedText === 'string') {
            return { rephrasedText: rephrasedText.trim() };
        } else if (rephrasedText && rephrasedText.error) {
            return rephrasedText; // Pass error object through
        } else {
            // Handle unexpected response from AI
            console.warn(`AI provider ${aiProvider} returned unexpected format for rephrase:`, rephrasedText);
            return { error: "AI returned an unexpected format for rephrasing." };
        }

    } catch (error) {
        console.error(`Error in rephraseText (${aiProvider}):`, error.message);
        return { error: error.message };
    }
};

/**
 * Analyzes text and inserts Markdown headings to structure it.
 */
exports.structureTextWithHeadings = async (text, aiProvider, userApiKeys) => {
    try {
        const taskFunction = (apiKey, currentText) => {
            const textSnippet = currentText.substring(0, 15000); // Allow longer text for structuring

            const commonSystemInstruction = "You are an expert content editor and structurer. Your task is to analyze the following text, identify logical sections and main ideas, and then insert appropriate Markdown headings (e.g., ## Main Section, ### Sub-section) to structure the content for better readability and organization. Preserve the original meaning and flow of the text as much as possible. If the text is already well-structured with headings, you can make minimal changes or simply return the original text with a note indicating it's already structured. Do not add a title or H1 heading unless the text clearly lacks one and implies a main topic. Focus on H2 and H3 level headings primarily. Do not add any introductory or concluding remarks outside of the structured text itself; only return the processed text with headings.";

            if (aiProvider === 'openai') {
                const messages = [
                    { role: "system", content: commonSystemInstruction },
                    { role: "user", content: textSnippet }
                ];
                // Allow more tokens for output as headings add to length
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.5, Math.max(1000, getWordCount(textSnippet) * 2 + 500));
            } else if (aiProvider === 'gemini') {
                const prompt = `${commonSystemInstruction}\n\nOriginal Text:\n${textSnippet}`;
                return callGemini(apiKey, prompt, "gemini-1.5-flash-latest", 0.5, Math.max(1000, getWordCount(textSnippet) * 2 + 500));
            } else if (aiProvider === 'perplexity') {
                // Perplexity might be less ideal for pure structuring without web search, but can try
                const messages = [
                    { role: "system", content: commonSystemInstruction },
                    { role: "user", content: `Please structure this text with Markdown headings:\n\n${textSnippet}` }
                ];
                return callPerplexityOnline(apiKey, messages); // Model can be adjusted
            }
            throw new Error(`Unsupported provider for structureTextWithHeadings: ${aiProvider}`);
        };

        const structuredText = await delegateToAI(aiProvider, userApiKeys, taskFunction, text);

        if (typeof structuredText === 'string') {
            return { structuredText: structuredText.trim() };
        } else if (structuredText && structuredText.error) {
            return structuredText; // Pass error object through
        } else {
            console.warn(`AI provider ${aiProvider} returned unexpected format for structuring:`, structuredText);
            return { error: "AI returned an unexpected format for content structuring." };
        }

    } catch (error) {
        console.error(`Error in structureTextWithHeadings (${aiProvider}):`, error.message);
        return { error: error.message };
    }
};

/**
 * Extracts relevant keywords from text suitable for image searching.
 */
exports.extractImageKeywordsFromText = async (text, aiProvider, userApiKeys, count = 5) => {
    try {
        const taskFunction = (apiKey, currentText, numKeywords) => {
            const textSnippet = currentText.substring(0, 1000); // Analyze a snippet for keywords

            const commonSystemInstruction = `You are an image keyword suggestion assistant. Analyze the following text and extract ${numKeywords} distinct, highly relevant keywords or short phrases (1-3 words each) that would be excellent for searching for stock photos or generating images related to the text's main themes or subjects. Provide the keywords as a comma-separated list. Focus on concrete nouns, descriptive adjectives, and key concepts.`;

            if (aiProvider === 'openai') {
                const messages = [
                    { role: "system", content: commonSystemInstruction },
                    { role: "user", content: `Text to analyze for image keywords:\n"${textSnippet}"\n\nKeywords:` }
                ];
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.5, 50 + numKeywords * 10);
            } else if (aiProvider === 'gemini') {
                const prompt = `${commonSystemInstruction}\n\nText to analyze:\n${textSnippet}\n\nKeywords:`;
                return callGemini(apiKey, prompt, "gemini-1.5-flash-latest", 0.5, 50 + numKeywords * 10);
            } else if (aiProvider === 'perplexity') {
                const messages = [
                    { role: "system", content: commonSystemInstruction },
                    { role: "user", content: `Text to analyze for image keywords:\n"${textSnippet}"` }
                ];
                return callPerplexityOnline(apiKey, messages);
            }
            throw new Error(`Unsupported provider for extractImageKeywordsFromText: ${aiProvider}`);
        };

        const responseText = await delegateToAI(aiProvider, userApiKeys, taskFunction, text, count);

        if (typeof responseText === 'string' && responseText.trim() !== '') {
            return responseText.split(',')
                .map(k => k.trim().toLowerCase()) // Normalize keywords
                .filter(k => k && k.length > 2); // Basic filter
        } else if (responseText && responseText.error) {
            throw new Error(responseText.error);
        } else {
            console.warn(`AI provider ${aiProvider} returned non-string or empty for image keywords:`, responseText);
            return []; // Return empty array if no valid keywords found
        }

    } catch (error) {
        console.error(`Error in extractImageKeywordsFromText (${aiProvider}):`, error.message);
        return { error: error.message }; // Return error object
    }
};

/**
 * Generates a Twitter thread from a given text using AI.
 * Returns an array of strings, where each string is a tweet.
 */
exports.generateTwitterThreadWithAI = async (originalText, aiProvider, userApiKeys, threadLengthHint = 5) => {
    try {
        const taskFunction = async (apiKey, text, lengthHint) => {
            const textSnippet = text.substring(0, 10000); // Allow more text for thread generation context
            const systemInstruction = `You are an expert social media content creator. Your task is to convert the following text into an engaging Twitter thread of approximately ${lengthHint} tweets. Each tweet should be concise, under 280 characters, and flow logically from the previous one. Use emojis where appropriate. Number each tweet like (1/N), (2/N), etc. Separate each tweet with "---TWEET_SEPARATOR---".`;

            let prompt, messages;
            if (aiProvider === 'openai') {
                messages = [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: `Original Text:\n${textSnippet}` }
                ];
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.7, 300 * lengthHint); // Generous token limit
            } else if (aiProvider === 'gemini') {
                prompt = `${systemInstruction}\n\nOriginal Text:\n${textSnippet}\n\nTwitter Thread:`;
                return callGemini(apiKey, prompt, "gemini-1.5-flash-latest", 0.7, 300 * lengthHint);
            } else if (aiProvider === 'perplexity') {
                // Perplexity might need more guidance for multi-part output
                messages = [
                    { role: "system", content: systemInstruction + " Ensure each tweet is clearly separated by '---TWEET_SEPARATOR---'." },
                    { role: "user", content: `Original Text:\n${textSnippet}` }
                ];
                return callPerplexityOnline(apiKey, messages);
            }
            throw new Error(`Unsupported provider for Twitter thread: ${aiProvider}`);
        };

        const responseText = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalText, threadLengthHint);

        if (typeof responseText === 'string' && responseText.trim() !== '') {
            const tweets = responseText.split('---TWEET_SEPARATOR---').map(t => t.trim()).filter(t => t);
            // Ensure numbering is correct if AI didn't do it perfectly
            return tweets.map((tweet, index, arr) => {
                // Remove existing numbering like (x/y) before adding new one
                let cleanTweet = tweet.replace(/\(\d+\/\d+\)\s*$/, '').trim();
                return `${cleanTweet} (${index + 1}/${arr.length})`;
            });
        } else if (responseText && responseText.error) {
            throw new Error(responseText.error);
        }
        console.warn(`AI provider ${aiProvider} returned non-string or empty for Twitter thread:`, responseText);
        return [];
    } catch (error) {
        console.error(`Error in generateTwitterThreadWithAI (${aiProvider}):`, error.message);
        return { error: error.message };
    }
};

/**
 * Generates a LinkedIn post from a given text using AI.
 */
exports.generateLinkedInPostWithAI = async (originalText, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, text) => {
            const textSnippet = text.substring(0, 8000);
            const systemInstruction = "You are a professional content writer specializing in LinkedIn posts. Convert the following text into an engaging and insightful LinkedIn post. Use clear paragraphs, bullet points if appropriate, and relevant professional hashtags (3-5). Aim for a professional yet approachable tone.";

            if (aiProvider === 'openai') {
                const messages = [{ role: "system", content: systemInstruction }, { role: "user", content: `Original Text:\n${textSnippet}` }];
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.6, 600);
            } else if (aiProvider === 'gemini') {
                const prompt = `${systemInstruction}\n\nOriginal Text:\n${textSnippet}\n\nLinkedIn Post:`;
                return callGemini(apiKey, prompt, "gemini-1.5-flash-latest", 0.6, 600);
            } else if (aiProvider === 'perplexity') {
                const messages = [{ role: "system", content: systemInstruction }, { role: "user", content: `Original Text:\n${textSnippet}` }];
                return callPerplexityOnline(apiKey, messages);
            }
            throw new Error(`Unsupported provider for LinkedIn post: ${aiProvider}`);
        };
        const postText = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalText);
        return (postText && typeof postText === 'string') ? { linkedInPost: postText.trim() } : (postText || { error: "Failed to generate LinkedIn post." });
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Generates key takeaways (bullet points) from a given text using AI.
 */
exports.generateKeyTakeawaysWithAI = async (originalText, aiProvider, userApiKeys, count = 5) => {
    try {
        const taskFunction = async (apiKey, text, numTakeaways) => {
            const textSnippet = text.substring(0, 8000);
            const systemInstruction = `Analyze the following text and extract the ${numTakeaways} most important key takeaways or main points. Present them as a bulleted list (each takeaway starting with a '*' or '-'). Each takeaway should be concise.`;

            if (aiProvider === 'openai') {
                const messages = [{ role: "system", content: systemInstruction }, { role: "user", content: `Original Text:\n${textSnippet}` }];
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.5, 100 + 50 * numTakeaways);
            } else if (aiProvider === 'gemini') {
                const prompt = `${systemInstruction}\n\nOriginal Text:\n${textSnippet}\n\nKey Takeaways:`;
                return callGemini(apiKey, prompt, "gemini-1.5-flash-latest", 0.5, 100 + 50 * numTakeaways);
            } else if (aiProvider === 'perplexity') {
                const messages = [{ role: "system", content: systemInstruction }, { role: "user", content: `Original Text:\n${textSnippet}` }];
                return callPerplexityOnline(apiKey, messages);
            }
            throw new Error(`Unsupported provider for key takeaways: ${aiProvider}`);
        };
        const takeawaysText = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalText, count);
        return (takeawaysText && typeof takeawaysText === 'string') ? { keyTakeaways: takeawaysText.trim() } : (takeawaysText || { error: "Failed to generate key takeaways." });
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * Generates content expansion ideas (outlines, questions, related topics)
 * based on a given text.
 */
exports.generateContentExpansionIdeas = async (originalText, aiProvider, userApiKeys, ideaType = "outlines", count = 3) => {
    // ideaType can be: "outlines", "questions", "subtopics", "follow_ups"
    try {
        const taskFunction = async (apiKey, text, type, numIdeas) => {
            const textSnippet = text.substring(0, 8000); // Analyze a substantial portion
            let systemInstruction = "You are an expert content strategist and idea generator.";
            let userActionPrompt = "";

            switch (type) {
                case "outlines":
                    userActionPrompt = `Based on the following text, generate ${numIdeas} distinct blog post titles and brief 2-3 point outlines for new articles that expand on key themes or sections within this text. Format each as: Title: [Generated Title]\nOutline:\n- Point 1\n- Point 2\nSeparate each full idea (title + outline) with "---IDEA_SEPARATOR---".`;
                    break;
                case "questions":
                    userActionPrompt = `Analyze the following text. Generate ${numIdeas} insightful questions that this content could answer in more detail, or that a reader might have after reading it. These questions could form the basis of a Q&A section or a follow-up article. List one question per line.`;
                    break;
                case "subtopics":
                    userActionPrompt = `Identify ${numIdeas} related sub-topics or niche areas from the following text that could be explored in more depth for separate content pieces. List one sub-topic per line.`;
                    break;
                case "follow_ups":
                    userActionPrompt = `Suggest ${numIdeas} ideas for follow-up content pieces (e.g., sequels, different angles, case studies) based on the themes in the following text. List one idea per line.`;
                    break;
                default:
                    throw new Error("Invalid ideaType for content expansion.");
            }

            const fullUserPrompt = `${userActionPrompt}\n\nOriginal Text Context:\n"${textSnippet}"\n\nGenerated Ideas:`;

            if (aiProvider === 'openai') {
                const messages = [{ role: "system", content: systemInstruction }, { role: "user", content: fullUserPrompt }];
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.7, 200 * numIdeas + 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${fullUserPrompt}`, "gemini-1.5-flash-latest", 0.7, 200 * numIdeas + 500);
            } else if (aiProvider === 'perplexity') {
                const messages = [{ role: "system", content: systemInstruction }, { role: "user", content: fullUserPrompt }];
                return callPerplexityOnline(apiKey, messages);
            }
            throw new Error(`Unsupported provider for content expansion: ${aiProvider}`);
        };

        const responseText = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalText, ideaType, count);

        if (typeof responseText === 'string' && responseText.trim() !== '') {
            if (ideaType === "outlines") {
                return responseText.split('---IDEA_SEPARATOR---')
                    .map(ideaString => { // Renamed 'idea' to 'ideaString' for clarity in this map
                        const parts = ideaString.split('Outline:');
                        const title = parts[0]?.replace(/Title:/gi, '').trim();
                        const outlinePoints = parts[1]?.split('\n').map(p => p.replace(/^- /, '').trim()).filter(p => p);
                        return { title, outlinePoints: outlinePoints || [] }; // Returns an object
                    })
                    .filter(i => i.title && i.outlinePoints.length > 0); // Returns an array of these objects
            }
            // For other types, it returns an array of strings
            return responseText.split('\n').map(item => item.replace(/^- |^\d+\.\s*/, '').trim()).filter(item => item);
        } else if (responseText && responseText.error) {
            throw new Error(responseText.error);
        }
        console.warn(`AI provider ${aiProvider} returned non-string or empty for content expansion:`, responseText);
        return []; // Return empty array if no valid ideas found
    } catch (error) {
        console.error(`Error in generateContentExpansionIdeas (${aiProvider}, type: ${ideaType}):`, error.message);
        return { error: error.message };
    }
};

/**
 * Generates a marketing email.
 */
exports.generateMarketingEmail = async (productOrService, targetAudience, keyMessage, desiredTone, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, pOrS, aud, msg, tone) => {
            const systemInstruction = `You are an expert marketing copywriter. Write a compelling marketing email.`;
            const userPrompt = `Product/Service: ${pOrS}\nTarget Audience: ${aud}\nKey Message/Offer: ${msg}\nDesired Tone: ${tone}\n\nGenerate a marketing email based on this information. Include a subject line, an engaging body, and a clear call to action. Format the subject line as: Subject: [Your Subject Line]`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.7, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
            }
            throw new Error(`Unsupported provider for marketing email: ${aiProvider}`);
        };
        const emailText = await delegateToAI(aiProvider, userApiKeys, taskFunction, productOrService, targetAudience, keyMessage, desiredTone);
        return (emailText && typeof emailText === 'string') ? { email: emailText.trim() } : (emailText || { error: "Failed to generate marketing email." });
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates Instagram captions.
 */
exports.generateInstagramCaption = async (imageDescription, desiredVibe, includeHashtags, aiProvider, userApiKeys, count = 3) => {
    try {
        const taskFunction = async (apiKey, desc, vibe, addHashtags, numCaptions) => {
            const systemInstruction = `You are a witty and engaging social media expert specializing in Instagram. Generate ${numCaptions} Instagram caption options.`;
            let userPrompt = `Image Description: ${desc}\nDesired Vibe/Tone: ${vibe}\n`;
            if (addHashtags) userPrompt += "Include 3-5 relevant hashtags at the end of each caption.\n";
            userPrompt += `\nGenerate ${numCaptions} distinct caption options, each separated by "---CAPTION_SEPARATOR---".`;

            let responseText;
            if (aiProvider === 'openai') {
                responseText = await callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.8, 150 * numCaptions);
            } else if (aiProvider === 'gemini') {
                responseText = await callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.8, 150 * numCaptions);
            } else if (aiProvider === 'perplexity') {
                responseText = await callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
            } else {
                throw new Error(`Unsupported provider for Instagram caption: ${aiProvider}`);
            }
            return responseText ? responseText.split('---CAPTION_SEPARATOR---').map(c => c.trim()).filter(c => c) : [];
        };
        const captions = await delegateToAI(aiProvider, userApiKeys, taskFunction, imageDescription, desiredVibe, includeHashtags, count);
        return (captions && Array.isArray(captions)) ? { captions } : (captions || { error: "Failed to generate Instagram captions." });
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates blog post ideas.
 */
exports.generateBlogPostIdeas = async (mainTopic, targetAudience, aiProvider, userApiKeys, count = 5) => {
    try {
        const taskFunction = async (apiKey, topic, aud, numIdeas) => {
            const systemInstruction = `You are a creative content strategist specializing in blog content.`;
            const userPrompt = `Main Topic/Keyword: ${topic}\nTarget Audience: ${aud}\n\nGenerate ${numIdeas} engaging and unique blog post ideas (titles or brief concepts) based on this information. List one idea per line.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.9, 75 * numIdeas);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.9, 75 * numIdeas);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
            }
            throw new Error(`Unsupported provider for blog post ideas: ${aiProvider}`);
        };
        const ideasText = await delegateToAI(aiProvider, userApiKeys, taskFunction, mainTopic, targetAudience, count);
        const ideas = ideasText ? ideasText.split('\n').map(i => i.replace(/^- |^\d+\.\s*/, '').trim()).filter(i => i) : [];
        return { ideas };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates cold emails.
 */
exports.generateColdEmail = async (productService, targetPersona, painPoint, valueProposition, callToAction, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, ps, tp, pp, vp, cta) => {
            const systemInstruction = "You are an expert B2B sales copywriter specializing in effective cold emails.";
            const userPrompt = `Objective: Write a concise and personalized cold email.\nProduct/Service: ${ps}\nTarget Persona: ${tp}\nTheir Pain Point: ${pp}\nOur Value Proposition (how we solve it): ${vp}\nDesired Call to Action: ${cta}\n\nGenerate a cold email including a compelling subject line. Format as: Subject: [Subject]\n\n[Email Body]`;
            // ... (callOpenAI, callGemini, callPerplexityOnline similar to generateMarketingEmail)
            if (aiProvider === 'openai'){ return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.7, 400);
            // ... add Gemini and Perplexity
        } else if (aiProvider === 'gemini') {
            return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
        } else if (aiProvider === 'perplexity') {
            return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
        }
            
            throw new Error(`Unsupported provider for cold email: ${aiProvider}`);
        };
        const emailText = await delegateToAI(aiProvider, userApiKeys, taskFunction, productService, targetPersona, painPoint, valueProposition, callToAction);
        return (emailText && typeof emailText === 'string') ? { email: emailText.trim() } : (emailText || { error: "Failed to generate cold email." });
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates a content outline.
 */
exports.generateContentOutline = async (mainTopic, keywords, targetAudience, desiredSections, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, topic, kws, aud, sections) => {
            const systemInstruction = "You are an expert content planner. Create a detailed hierarchical outline for a blog post or article.";
            const userPrompt = `Main Topic: ${topic}\nKeywords to include: ${kws}\nTarget Audience: ${aud}\nApproximate number of main sections desired: ${sections}\n\nGenerate a structured outline with main headings (e.g., ## Heading) and sub-points (e.g., - Sub-point).`;
            // ... (callOpenAI, callGemini, callPerplexityOnline)
            if (aiProvider === 'openai'){ return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.6, 600);
            // ... add Gemini and Perplexity
        } else if (aiProvider === 'gemini') {
            return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
        } else if (aiProvider === 'perplexity') {
            return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
        }
            
            throw new Error(`Unsupported provider for outline: ${aiProvider}`);
        };
        const outlineText = await delegateToAI(aiProvider, userApiKeys, taskFunction, mainTopic, keywords, targetAudience, desiredSections);
        return (outlineText && typeof outlineText === 'string') ? { outline: outlineText.trim() } : (outlineText || { error: "Failed to generate outline." });
    } catch (error) { return { error: error.message }; }
};


/**
 * Rewrites a paragraph with specific instructions.
 */
exports.rewriteParagraph = async (originalParagraph, rewriteInstruction, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, para, instruction) => {
            const systemInstruction = "You are an expert text editor. Rewrite the given paragraph based on the provided instruction.";
            const userPrompt = `Original Paragraph:\n"${para}"\n\nRewrite Instruction: ${instruction}\n\nRewritten Paragraph:`;
            // ... (callOpenAI, callGemini, callPerplexityOnline)
            if (aiProvider === 'openai'){ return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.6, 600);
            // ... add Gemini and Perplexity
        } else if (aiProvider === 'gemini') {
            return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
        } else if (aiProvider === 'perplexity') {
            return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
        }
            if (aiProvider === 'openai') return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.7, getWordCount(para) * 2 + 100);
            // ... add Gemini and Perplexity
            throw new Error(`Unsupported provider for paragraph rewrite: ${aiProvider}`);
        };
        const rewrittenText = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalParagraph, rewriteInstruction);
        return (rewrittenText && typeof rewrittenText === 'string') ? { rewrittenParagraph: rewrittenText.trim() } : (rewrittenText || { error: "Failed to rewrite paragraph." });
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates a paragraph based on instructions.
 */
exports.generateParagraph = async (topic, keywords, desiredTone, desiredLength, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, t, k, tone, len) => {
            const systemInstruction = "You are a skilled content writer. Generate a well-structured paragraph.";
            const userPrompt = `Topic/Subject: ${t}\nKeywords to include: ${k}\nDesired Tone: ${tone}\nDesired Length: ${len} (e.g., short, medium, long - interpret appropriately)\n\nGenerated Paragraph:`;
            // ... (callOpenAI, callGemini, callPerplexityOnline)
            if (aiProvider === 'openai'){ return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.6, 600);
            // ... add Gemini and Perplexity
        } else if (aiProvider === 'gemini') {
            return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
        } else if (aiProvider === 'perplexity') {
            return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
        }
            let maxTokens = 150;
            if (len === 'medium') maxTokens = 250;
            if (len === 'long') maxTokens = 400;
            if (aiProvider === 'openai') return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.7, maxTokens);
            // ... add Gemini and Perplexity
            throw new Error(`Unsupported provider for paragraph generation: ${aiProvider}`);
        };
        const paragraphText = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, keywords, desiredTone, desiredLength);
        return (paragraphText && typeof paragraphText === 'string') ? { paragraph: paragraphText.trim() } : (paragraphText || { error: "Failed to generate paragraph." });
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates product descriptions.
 */
exports.generateProductDescription = async (productName, features, targetAudience, tone, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, pName, ftrs, aud, t) => {
            const systemInstruction = "You are an expert e-commerce copywriter. Create a compelling product description.";
            const userPrompt = `Product Name: ${pName}\nKey Features & Benefits (list them):\n${ftrs}\nTarget Audience: ${aud}\nDesired Tone: ${t}\n\nGenerate a product description that highlights benefits and encourages purchase.`;
            // ... (callOpenAI, callGemini, callPerplexityOnline)
            if (aiProvider === 'openai'){ return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.6, 600);
            // ... add Gemini and Perplexity
        } else if (aiProvider === 'gemini') {
            return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
        } else if (aiProvider === 'perplexity') {
            return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
        }
            if (aiProvider === 'openai') return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.7, 400);
            // ... add Gemini and Perplexity
            throw new Error(`Unsupported provider for product description: ${aiProvider}`);
        };
        const descriptionText = await delegateToAI(aiProvider, userApiKeys, taskFunction, productName, features, targetAudience, tone);
        return (descriptionText && typeof descriptionText === 'string') ? { description: descriptionText.trim() } : (descriptionText || { error: "Failed to generate product description." });
    } catch (error) { return { error: error.message }; }
};


/**
 * Rewrites a sentence.
 */
exports.rewriteSentence = async (originalSentence, rewriteInstruction, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, sentence, instruction) => {
            const systemInstruction = "You are an expert text editor. Rewrite the given sentence based on the provided instruction.";
            const userPrompt = `Original Sentence:\n"${sentence}"\n\nRewrite Instruction: ${instruction}\n\nRewritten Sentence:`;
            if (aiProvider === 'openai') return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.7, getWordCount(sentence) * 3 + 50);
            // ... add Gemini and Perplexity
         else if (aiProvider === 'gemini') {
            return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7,  getWordCount(sentence) * 3 + 50);
        } else if (aiProvider === 'perplexity') {
            return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
        }
            throw new Error(`Unsupported provider for sentence rewrite: ${aiProvider}`);
        };
        const rewrittenText = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalSentence, rewriteInstruction);
        return (rewrittenText && typeof rewrittenText === 'string') ? { rewrittenSentence: rewrittenText.trim() } : (rewrittenText || { error: "Failed to rewrite sentence." });
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates meta descriptions.
 */
exports.generateMetaDescription = async (pageTitle, pageContentSummary, keywords, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, title, summary, kws) => {
            const systemInstruction = "You are an SEO expert. Generate a concise and compelling meta description (around 155 characters).";
            const userPrompt = `Page Title: ${title}\nPage Content Summary: ${summary.substring(0,500)}\nKeywords to include: ${kws}\n\nMeta Description:`;
            if (aiProvider === 'openai') return callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.6, 100); // Max tokens for meta desc
            // ... add Gemini and Perplexity
            else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.6,  100);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
            }
            throw new Error(`Unsupported provider for meta description: ${aiProvider}`);
        };
        const metaText = await delegateToAI(aiProvider, userApiKeys, taskFunction, pageTitle, pageContentSummary, keywords);
        return (metaText && typeof metaText === 'string') ? { metaDescription: metaText.trim() } : (metaText || { error: "Failed to generate meta description." });
    } catch (error) { return { error: error.message }; }
};


/**
 * Generates slogans.
 */
exports.generateSlogan = async (companyOrProduct, coreValues, targetAudience, aiProvider, userApiKeys, count = 5) => {
    try {
        const taskFunction = async (apiKey, name, values, aud, numSlogans) => {
            const systemInstruction = `You are a creative branding expert. Generate ${numSlogans} catchy and memorable slogans.`;
            const userPrompt = `Company/Product Name: ${name}\nCore Values/Keywords: ${values}\nTarget Audience: ${aud}\n\nGenerate ${numSlogans} slogans, each on a new line.`;
            let responseText;
            if (aiProvider === 'openai') responseText = await callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.9, 50 * numSlogans);
            // ... add Gemini and Perplexity
            else if (aiProvider === 'gemini') {
                responseText = await callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.9, 50 * numSlogans);
            } else if (aiProvider === 'perplexity') {
                responseText =  await callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
            }
            else throw new Error(`Unsupported provider for slogan generation: ${aiProvider}`);
            return responseText ? responseText.split('\n').map(s => s.trim()).filter(s => s) : [];
        };
        const slogans = await delegateToAI(aiProvider, userApiKeys, taskFunction, companyOrProduct, coreValues, targetAudience, count);
        return (slogans && Array.isArray(slogans)) ? { slogans } : (slogans || { error: "Failed to generate slogans." });
    } catch (error) { return { error: error.message }; }
};

// ... AND SO ON FOR THE REST OF THE GENERATORS ...
// Content Idea Generator (similar to blog post ideas, maybe broader)
// Sales Copy Generator
// Motto Generator
// Ad Copy Generator
// Hook Generator
// Instagram Hashtag Generator (similar to suggestHashtags, but maybe more focused on IG trends)
// Business Name Generator
// Paraphrasing Tool (similar to rephraseText or rewriteParagraph)
// AI Rewriter Tool (generic rewriter, could use rephraseText with more open instructions)
// AI Video Script Generator (similar to podcast)
// AI FAQ Schema Generator (input: topic/product, output: JSON-LD or list of Q&As)
// AI Icebreaker Generator (input: prospect info, output: personalized lines)
// YouTube Keyword Tool (input: video topic, output: keywords + description draft)
// Create Content from a Transcript (input: transcript, output: blog post, summary, etc. - complex)
// Create a Webinar Brief (input: topic, audience, goals, output: structured brief)
// AI Contact Intelligence Tool (This sounds more like data enrichment than generation)
// Free AI Account Plan Builder (This sounds like a structured planning tool, AI could assist parts)
// Free AI Humanizer (input: AI text, output: more human-like text - complex NLP)
// Random Name Generator (can be rule-based or simple AI)
// Username Generator
// Lead Enrichment Tool (data retrieval, not generation)
// Sales Email Generator (similar to cold email or marketing email)
// Webinar Title Generator (similar to headline/blog title)
// Blog Title Generator (similar to headline)
// SEO Title Generator (similar to headline, with SEO focus)
// Acronym Generator

/**
 * Generates content ideas for various formats
 */
exports.generateContentIdeas = async (topic, audience, contentTypes, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, aud, types, qty) => {
            const systemInstruction = "You are a creative content strategist who generates high-quality content ideas.";
            // const userPrompt = `Topic: ${tp}\nTarget Audience: ${aud}\nContent Types: ${types.join(', ')}\nNumber of Ideas: ${qty}\n\nGenerate creative, engaging content ideas that will resonate with the audience. For each idea, include a compelling title and a brief description.`;
            const userPrompt = `Topic: ${tp}\nTarget Audience: ${aud}\nContent Types: ${(Array.isArray(types) ? types : [types]).join(', ')}\nNumber of Ideas: ${qty}\n\nGenerate creative, engaging content ideas that will resonate with the audience. For each idea, include a compelling title and a brief description.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.7, 800);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 800);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for content ideas: ${aiProvider}`);
        };
        const ideas = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, audience, contentTypes, quantity);
        return ideas ? { ideas } : { error: "Failed to generate content ideas" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates compelling sales copy
 */
exports.generateSalesCopy = async (product, benefits, targetAudience, callToAction, wordCount, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, prod, ben, aud, cta, words) => {
            const systemInstruction = "Write persuasive sales copy that converts readers into customers.";
            const userPrompt = `Product/Service: ${prod}\nKey Benefits: ${ben}\nTarget Audience: ${aud}\nCall to Action: ${cta}\nApprox. Word Count: ${words}\n\nCreate compelling sales copy that highlights benefits, addresses pain points, and drives action.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.6, words * 1.5);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.6, words * 1.5);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for sales copy: ${aiProvider}`);
        };
        const salesCopy = await delegateToAI(aiProvider, userApiKeys, taskFunction, product, benefits, targetAudience, callToAction, wordCount);
        return salesCopy ? { salesCopy } : { error: "Failed to generate sales copy" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates memorable mottos or slogans
 */
exports.generateMotto = async (brand, industry, values, tone, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, br, ind, val, tn, qty) => {
            const systemInstruction = "Create memorable, impactful mottos and slogans that capture brand essence.";
            const userPrompt = `Brand Name: ${br}\nIndustry: ${ind}\nCore Values: ${val}\nTone: ${tn}\nNumber of Options: ${qty}\n\nGenerate concise, catchy mottos that will resonate with audiences and be easy to remember.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.8, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.8, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for mottos: ${aiProvider}`);
        };
        const mottos = await delegateToAI(aiProvider, userApiKeys, taskFunction, brand, industry, values, tone, quantity);
        return mottos ? { mottos: mottos.split('\n').filter(m => m.trim().length > 0) } : { error: "Failed to generate mottos" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates effective ad copy for various platforms
 */
exports.generateAdCopy = async (product, platform, audience, uniqueSellingPoints, characterLimit, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, prod, plat, aud, usp, limit) => {
            const systemInstruction = "Create high-converting ad copy optimized for specific platforms.";
            const userPrompt = `Product/Service: ${prod}\nPlatform: ${plat}\nTarget Audience: ${aud}\nUnique Selling Points: ${usp}\nCharacter Limit: ${limit}\n\nWrite compelling ad copy that drives clicks and conversions while respecting platform best practices.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.7, limit * 1.2);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, limit * 1.2);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for ad copy: ${aiProvider}`);
        };
        const adCopy = await delegateToAI(aiProvider, userApiKeys, taskFunction, product, platform, audience, uniqueSellingPoints, characterLimit);
        return adCopy ? { adCopy } : { error: "Failed to generate ad copy" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates attention-grabbing hooks
 */
exports.generateHook = async (topic, audience, contentType, tone, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, aud, type, tn, qty) => {
            const systemInstruction = "Create attention-grabbing hooks that captivate audiences immediately.";
            const userPrompt = `Topic: ${tp}\nAudience: ${aud}\nContent Type: ${type}\nTone: ${tn}\nNumber of Hooks: ${qty}\n\nGenerate powerful opening lines that grab attention and make people want to keep reading, watching, or listening.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.8, 400);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.8, 400);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for hooks: ${aiProvider}`);
        };
        const hooks = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, audience, contentType, tone, quantity);
        return hooks ? { hooks: hooks.split('\n').filter(h => h.trim().length > 0) } : { error: "Failed to generate hooks" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates relevant Instagram hashtags
 */
exports.generateInstagramHashtags = async (postTopic, niche, location, trendLevel, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, topic, nch, loc, trend, qty) => {
            const systemInstruction = "Generate strategic Instagram hashtags that increase content discoverability.";
            const userPrompt = `Post Topic: ${topic}\nNiche/Industry: ${nch}\nLocation (if relevant): ${loc}\nTrend Level (trending/evergreen/niche): ${trend}\nNumber of Hashtags: ${qty}\n\nProvide a mix of popular, moderately popular, and niche hashtags that will maximize reach and engagement on Instagram.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.5, 300);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.5, 300);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for Instagram hashtags: ${aiProvider}`);
        };
        const hashtagResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, postTopic, niche, location, trendLevel, quantity);
        
        // Extract hashtags (removing # if needed) and format them properly
        const hashtagPattern = /#?[\w\u0590-\u05FF]+/g;
        const matches = hashtagResponse.match(hashtagPattern) || [];
        const hashtags = matches.map(tag => tag.startsWith('#') ? tag : `#${tag}`).slice(0, quantity);
        
        return hashtags.length > 0 ? { hashtags } : { error: "Failed to generate hashtags" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates business name ideas
 */
exports.generateBusinessName = async (industry, keywords, brandValues, nameStyle, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, ind, keys, values, style, qty) => {
            const systemInstruction = "Generate creative and memorable business name ideas.";
            const userPrompt = `Industry/Niche: ${ind}\nKeywords to Include/Consider: ${keys}\nBrand Values: ${values}\nName Style (modern/classic/playful/etc): ${style}\nNumber of Names: ${qty}\n\nCreate unique business names that are memorable, available as domains, and align with the brand identity.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.9, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.9, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for business names: ${aiProvider}`);
        };
        const nameResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, industry, keywords, brandValues, nameStyle, quantity);
        
        // Extract names from the response and clean up
        const names = nameResponse.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(name => name.length > 0)
            .slice(0, quantity);
        
        return names.length > 0 ? { businessNames: names } : { error: "Failed to generate business names" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Paraphrases text while maintaining meaning
 */
exports.paraphraseText = async (originalText, tone, complexity, preserveKeywords, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, text, tn, cmplx, keywords) => {
            const systemInstruction = "Paraphrase text to maintain meaning while changing wording and structure.";
            const userPrompt = `Original Text: ${text}\nDesired Tone: ${tn}\nComplexity Level (simpler/similar/more complex): ${cmplx}\nKeywords to Preserve: ${keywords}\n\nParaphrase the text to avoid plagiarism while maintaining the original meaning and intent.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.6, text.length * 1.5);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.6, text.length * 1.5);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for paraphrasing: ${aiProvider}`);
        };
        const paraphrasedText = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalText, tone, complexity, preserveKeywords);
        return paraphrasedText ? { paraphrasedText } : { error: "Failed to paraphrase text" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Rewrites content with various options
 */
exports.rewriteContent = async (originalText, purpose, style, length, focusKeywords, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, text, purp, styl, len, keywords) => {
            const systemInstruction = "Rewrite content to match specific requirements while preserving core message.";
            const userPrompt = `Original Text: ${text}\nRewriting Purpose: ${purp}\nDesired Style: ${styl}\nTarget Length: ${len}\nFocus Keywords: ${keywords}\n\nRewrite the content to match the requirements while maintaining accuracy and improving quality.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.7, parseInt(len) * 7);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, parseInt(len) * 7);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for content rewriting: ${aiProvider}`);
        };
        const rewrittenContent = await delegateToAI(aiProvider, userApiKeys, taskFunction, originalText, purpose, style, length, focusKeywords);
        return rewrittenContent ? { rewrittenContent } : { error: "Failed to rewrite content" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates video scripts for various platforms
 */
exports.generateVideoScript = async (topic, audience, duration, style, callToAction, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, aud, dur, styl, cta) => {
            const systemInstruction = "Create engaging video scripts optimized for your platform and audience.";
            const userPrompt = `Topic: ${tp}\nTarget Audience: ${aud}\nVideo Duration (minutes): ${dur}\nStyle/Format: ${styl}\nCall to Action: ${cta}\n\nWrite a complete video script with sections for INTRO, MAIN CONTENT, and OUTRO. Include speaker notes and visual cues where appropriate.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.7, parseInt(dur) * 150);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, parseInt(dur) * 150);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for video scripts: ${aiProvider}`);
        };
        const videoScript = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, audience, duration, style, callToAction);
        return videoScript ? { videoScript } : { error: "Failed to generate video script" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates FAQ schema with questions and answers
 */
exports.generateFAQSchema = async (topic, audience, commonConcerns, depth, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, aud, concerns, dpth) => {
            const systemInstruction = "Create comprehensive FAQ content with structured JSON-LD schema.";
            const userPrompt = `Topic/Product: ${tp}\nTarget Audience: ${aud}\nCommon Concerns/Questions: ${concerns}\nDetail Level (basic/moderate/detailed): ${dpth}\n\nGenerate both a set of FAQ questions and answers and the corresponding JSON-LD schema for SEO.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.6, 1000);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.6, 1000);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for FAQ schema: ${aiProvider}`);
        };
        const rawResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, audience, commonConcerns, depth);
        
        // Parse the response to extract the JSON-LD schema
        let faqContent = { questions: [], jsonLdSchema: null };
        try {
            // Extract JSON-LD schema if present
            const jsonMatch = rawResponse.match(/```json([\s\S]*?)```/) || 
                              rawResponse.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
            
            if (jsonMatch && jsonMatch[1]) {
                faqContent.jsonLdSchema = JSON.parse(jsonMatch[1].trim());
            }
            
            // Extract Q&A pairs
            const lines = rawResponse.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.match(/^Q[:.]/i) || line.match(/^Question[:.]/i) || line.startsWith('**Q:')) {
                    const question = line.replace(/^Q[:.]\s*|^Question[:.]\s*|\*\*Q:\*\*\s*|\*\*Q:\s*|\*\*/g, '').trim();
                    let answer = '';
                    
                    // Look for the answer in the next lines
                    let j = i + 1;
                    while (j < lines.length) {
                        const nextLine = lines[j].trim();
                        if (nextLine.match(/^Q[:.]/i) || nextLine.match(/^Question[:.]/i) || nextLine.startsWith('**Q:')) {
                            break;
                        }
                        if (nextLine.match(/^A[:.]/i) || nextLine.match(/^Answer[:.]/i) || nextLine.startsWith('**A:')) {
                            answer = nextLine.replace(/^A[:.]\s*|^Answer[:.]\s*|\*\*A:\*\*\s*|\*\*A:\s*|\*\*/g, '').trim();
                        } else if (answer) {
                            answer += ' ' + nextLine;
                        }
                        j++;
                    }
                    
                    if (question && answer) {
                        faqContent.questions.push({ question, answer: answer.trim() });
                    }
                }
            }
            
            // If we couldn't extract structured Q&As but we have the JSON-LD
            if (faqContent.questions.length === 0 && faqContent.jsonLdSchema?.mainEntity) {
                faqContent.questions = faqContent.jsonLdSchema.mainEntity.map(item => ({
                    question: item.name,
                    answer: item.acceptedAnswer?.text || ''
                }));
            }
            
            // If we still don't have FAQ content, create a basic representation from the text
            if (faqContent.questions.length === 0) {
                // Create a fallback JSON-LD schema
                const basicQuestions = [];
                const lines = rawResponse.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line.endsWith('?')) {
                        const question = line;
                        let answer = '';
                        if (i + 1 < lines.length) {
                            answer = lines[i + 1].trim();
                            i++; // Skip the answer line in the next iteration
                        }
                        if (question && answer) {
                            basicQuestions.push({ question, answer });
                        }
                    }
                }
                
                if (basicQuestions.length > 0) {
                    faqContent.questions = basicQuestions;
                    
                    // Create a basic JSON-LD schema
                    faqContent.jsonLdSchema = {
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": basicQuestions.map(q => ({
                            "@type": "Question",
                            "name": q.question,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": q.answer
                            }
                        }))
                    };
                }
            }
        } catch (error) {
            console.error("Error processing FAQ content:", error);
            // Return the raw response if parsing fails
            return { faqContent: rawResponse, error: "Failed to structure FAQ content" };
        }
        
        return faqContent.questions.length > 0 || faqContent.jsonLdSchema 
            ? { faqContent } 
            : { rawResponse, error: "Failed to generate structured FAQ content" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates personalized icebreakers for outreach
 */
exports.generateIcebreakers = async (prospectInfo, context, tone, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, info, ctx, tn, qty) => {
            const systemInstruction = "Create personalized conversation starters for effective outreach.";
            const userPrompt = `Prospect Information: ${info}\nContext/Situation: ${ctx}\nTone: ${tn}\nNumber of Icebreakers: ${qty}\n\nGenerate personalized, non-generic icebreakers that reference specific details about the prospect to increase response rates.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.7, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for icebreakers: ${aiProvider}`);
        };
        const icebreakersResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, prospectInfo, context, tone, quantity);
        
        // Extract icebreakers from the response
        const icebreakers = icebreakersResponse.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(line => line.length > 0 && !line.toLowerCase().includes('icebreaker') && !line.match(/^example/i))
            .slice(0, quantity);
        
        return icebreakers.length > 0 ? { icebreakers } : { error: "Failed to generate icebreakers" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates YouTube keywords and description
 */
exports.generateYouTubeKeywords = async (videoTopic, targetAudience, competitors, descriptionLength, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, topic, audience, comps, descLen) => {
            const systemInstruction = "Generate optimized YouTube keywords and description draft for maximum discoverability.";
            const userPrompt = `Video Topic: ${topic}\nTarget Audience: ${audience}\nCompetitor Channels (if any): ${comps}\nDescription Length (short/medium/long): ${descLen}\n\nProvide both SEO-optimized keywords/tags and a draft description that incorporates these keywords naturally.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.6, 800);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.6, 800);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for YouTube keywords: ${aiProvider}`);
        };
        const response = await delegateToAI(aiProvider, userApiKeys, taskFunction, videoTopic, targetAudience, competitors, descriptionLength);
        
        // Process the response to extract keywords and description
        let result = { keywords: [], description: "" };
        const keywordsSection = response.match(/keywords:|tags:/i);
        const descriptionSection = response.match(/description:/i);
        
        if (keywordsSection && descriptionSection) {
            const keywordsStart = keywordsSection.index;
            const descriptionStart = descriptionSection.index;
            
            // Extract keywords
            const keywordsText = response.substring(keywordsStart, descriptionStart);
            result.keywords = keywordsText
                .replace(/keywords:|tags:/i, '')
                .split(/,|\n/)
                .map(k => k.trim())
                .filter(k => k.length > 0);
            
            // Extract description
            result.description = response.substring(descriptionStart)
                .replace(/description:/i, '')
                .trim();
        } else {
            // Fallback extraction if sections are not clearly marked
            const lines = response.split('\n');
            let inKeywords = false;
            let inDescription = false;
            
            for (const line of lines) {
                if (line.match(/keywords|tags/i)) {
                    inKeywords = true;
                    inDescription = false;
                    continue;
                } else if (line.match(/description/i)) {
                    inDescription = true;
                    inKeywords = false;
                    continue;
                }
                
                if (inKeywords) {
                    const keywords = line.split(/,|;/).map(k => k.trim()).filter(k => k.length > 0);
                    result.keywords.push(...keywords);
                } else if (inDescription) {
                    result.description += line + " ";
                }
            }
            
            // Clean up description
            result.description = result.description.trim();
            
            // If still no structured data found, make a best guess
            if (result.keywords.length === 0 || !result.description) {
                const words = response.split(/\s+/);
                // Look for comma-separated lists as potential keywords
                const commaGroups = response.match(/[\w\s,]+,[\w\s,]+(?:,[\w\s]+)+/g) || [];
                if (commaGroups.length > 0) {
                    result.keywords = commaGroups[0]
                        .split(',')
                        .map(k => k.trim())
                        .filter(k => k.length > 0);
                }
                
                // If no description identified, use the longest paragraph
                if (!result.description) {
                    const paragraphs = response.split(/\n\n+/);
                    result.description = paragraphs.reduce((longest, current) => 
                        current.length > longest.length ? current : longest, "");
                }
            }
        }
        
        return (result.keywords.length > 0 || result.description) 
            ? { youtubeKeywords: result.keywords, youtubeDescription: result.description } 
            : { error: "Failed to generate YouTube keywords and description" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Creates content from a transcript
 */
exports.createContentFromTranscript = async (transcript, contentType, audience, keyPoints, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, trans, type, aud, points) => {
            const systemInstruction = "Transform transcripts into polished, structured content.";
            const userPrompt = `Transcript: ${trans.substring(0, 8000)}...\nDesired Content Type: ${type}\nTarget Audience: ${aud}\nKey Points to Emphasize: ${points}\n\nConvert this transcript into well-structured, engaging content that feels intentionally written rather than transcribed.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.6, 3000);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.6, 3000);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for transcript content: ${aiProvider}`);
        };
        const content = await delegateToAI(aiProvider, userApiKeys, taskFunction, transcript, contentType, audience, keyPoints);
        return content ? { content } : { error: "Failed to generate content from transcript" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Creates a structured webinar brief
 */
exports.createWebinarBrief = async (topic, audience, goals, speakerInfo, duration, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, aud, gls, spkr, dur) => {
            const systemInstruction = "Create comprehensive webinar briefs with structured content outlines.";
            const userPrompt = `Webinar Topic: ${tp}\nTarget Audience: ${aud}\nKey Goals/Outcomes: ${gls}\nSpeaker Information: ${spkr}\nDuration: ${dur} minutes\n\nCreate a detailed webinar brief including agenda, talking points, and engagement strategies.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.7, 2000);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 2000);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for webinar brief: ${aiProvider}`);
        };
        const webinarBrief = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, audience, goals, speakerInfo, duration);
        return webinarBrief ? { webinarBrief } : { error: "Failed to generate webinar brief" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Makes AI-generated text appear more human
 */
exports.humanizeText = async (aiText, tone, complexity, audience, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, text, tn, cmplx, aud) => {
            const systemInstruction = "Make AI-generated text sound more natural and human-written.";
            const userPrompt = `AI-Generated Text: ${text}\nDesired Tone: ${tn}\nComplexity Level: ${cmplx}\nTarget Audience: ${aud}\n\nRewrite this text to sound more natural and human. Add nuance, occasional imperfections, varied sentence structures, and authentic voice.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.8, text.length * 1.2);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.8, text.length * 1.2);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for humanizing text: ${aiProvider}`);
        };
        const humanizedText = await delegateToAI(aiProvider, userApiKeys, taskFunction, aiText, tone, complexity, audience);
        return humanizedText ? { humanizedText } : { error: "Failed to humanize text" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates random names based on criteria
 */
exports.generateRandomNames = async (nameType, gender, origin, quantity, uniqueness, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, type, gen, orig, qty, uniq) => {
            const systemInstruction = "Generate realistic random names based on specific criteria.";
            const userPrompt = `Name Type (full/first/last/character): ${type}\nGender (if applicable): ${gen}\nCultural Origin/Ethnicity: ${orig}\nNumber of Names: ${qty}\nUniqueness Level (common/mixed/unique): ${uniq}\n\nGenerate random but realistic names matching these criteria.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.9, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.9, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for random names: ${aiProvider}`);
        };
        const namesResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, nameType, gender, origin, quantity, uniqueness);
        
        // Extract names from the response
        const names = namesResponse.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(name => name.length > 0 && !name.toLowerCase().includes('example'))
            .slice(0, quantity);
        
        return names.length > 0 ? { randomNames: names } : { error: "Failed to generate random names" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates creative usernames
 */
exports.generateUsernames = async (keywords, nameStyle, platform, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, keys, style, plat, qty) => {
            const systemInstruction = "Create unique, available usernames for various platforms.";
            const userPrompt = `Keywords/Themes: ${keys}\nUsername Style (professional/creative/gaming/etc): ${style}\nPlatform (if specific): ${plat}\nNumber of Usernames: ${qty}\n\nGenerate unique username ideas that are likely to be available and appropriate for the specified platform.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.9, 400);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.9, 400);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for usernames: ${aiProvider}`);
        };
        const usernamesResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, keywords, nameStyle, platform, quantity);
        
        // Extract usernames from the response
        const usernames = usernamesResponse.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(username => username.length > 0 && !username.toLowerCase().includes('example'))
            .slice(0, quantity);
        
        return usernames.length > 0 ? { usernames } : { error: "Failed to generate usernames" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates sales emails
 */
exports.generateSalesEmail = async (product, prospect, painPoints, callToAction, emailLength, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, prod, prosp, pain, cta, len) => {
            const systemInstruction = "Write high-converting sales emails that engage prospects.";
            const userPrompt = `Product/Service: ${prod}\nProspect Information: ${prosp}\nPain Points to Address: ${pain}\nDesired Call to Action: ${cta}\nEmail Length: ${len}\n\nCreate a personalized sales email that addresses the prospect's needs and leads to the desired action.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-4o", 0.7, len === 'short' ? 400 : (len === 'medium' ? 700 : 1000));
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, len === 'short' ? 400 : (len === 'medium' ? 700 : 1000));
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for sales emails: ${aiProvider}`);
        };
        const salesEmail = await delegateToAI(aiProvider, userApiKeys, taskFunction, product, prospect, painPoints, callToAction, emailLength);
        return salesEmail ? { salesEmail } : { error: "Failed to generate sales email" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates webinar titles
 */
exports.generateWebinarTitle = async (topic, audience, keyBenefits, tone, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, aud, benefits, tn, qty) => {
            const systemInstruction = "Create compelling webinar titles that drive registrations.";
            const userPrompt = `Webinar Topic: ${tp}\nTarget Audience: ${aud}\nKey Benefits/Takeaways: ${benefits}\nTone: ${tn}\nNumber of Titles: ${qty}\n\nGenerate attention-grabbing webinar titles that communicate value and encourage sign-ups.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.8, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.8, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for webinar titles: ${aiProvider}`);
        };
        const titlesResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, audience, keyBenefits, tone, quantity);
        
        // Extract titles from the response
        const titles = titlesResponse.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(title => title.length > 0 && !title.toLowerCase().includes('example') && !title.toLowerCase().includes('title'))
            .slice(0, quantity);
        
        return titles.length > 0 ? { webinarTitles: titles } : { error: "Failed to generate webinar titles" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates blog titles
 */
exports.generateBlogTitle = async (topic, audience, keywords, tone, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, aud, keys, tn, qty) => {
            const systemInstruction = "Generate click-worthy blog titles that incorporate SEO keywords.";
            const userPrompt = `Blog Topic: ${tp}\nTarget Audience: ${aud}\nTarget Keywords: ${keys}\nTone: ${tn}\nNumber of Titles: ${qty}\n\nCreate engaging blog post titles that will attract readers and incorporate SEO keywords naturally.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.8, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.8, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for blog titles: ${aiProvider}`);
        };
        const titlesResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, audience, keywords, tone, quantity);
        
        // Extract titles from the response
        const titles = titlesResponse.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(title => title.length > 0 && !title.toLowerCase().includes('example') && !title.toLowerCase().includes('title'))
            .slice(0, quantity);
        
        return titles.length > 0 ? { blogTitles: titles } : { error: "Failed to generate blog titles" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates SEO-optimized titles
 */
exports.generateSEOTitle = async (topic, targetKeywords, searchIntent, competitors, quantity, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, tp, keys, intent, comps, qty) => {
            const systemInstruction = "Create SEO-optimized page titles that maximize CTR and rankings.";
            const userPrompt = `Content Topic: ${tp}\nTarget Keywords: ${keys}\nSearch Intent (informational/commercial/etc): ${intent}\nCompetitor Titles (if any): ${comps}\nNumber of Title Options: ${qty}\n\nGenerate SEO-optimized page titles that balance keyword usage with click appeal. Titles should be under 60 characters.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.7, 500);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.7, 500);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for SEO titles: ${aiProvider}`);
        };
        const titlesResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, topic, targetKeywords, searchIntent, competitors, quantity);
        
        // Extract titles from the response and ensure they're under 60 chars
        const titles = titlesResponse.split('\n')
            .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
            .filter(title => title.length > 0 && title.length <= 60 && !title.toLowerCase().includes('example') && !title.toLowerCase().includes('title'))
            .slice(0, quantity);
        
        return titles.length > 0 ? { seoTitles: titles } : { error: "Failed to generate SEO titles" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Generates meaningful acronyms
 */
exports.generateAcronym = async (phrase, purpose, style, alternatives, aiProvider, userApiKeys) => {
    try {
        const taskFunction = async (apiKey, phr, purp, styl, alt) => {
            const systemInstruction = "Create meaningful acronyms from phrases or concepts.";
            const userPrompt = `Phrase/Concept: ${phr}\nPurpose/Context: ${purp}\nStyle (professional/creative/etc): ${styl}\nNumber of Alternatives: ${alt}\n\nGenerate memorable acronyms that represent the phrase/concept while being easy to remember.`;

            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ], "gpt-3.5-turbo", 0.8, 400);
            } else if (aiProvider === 'gemini') {
                return callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.8, 400);
            } else if (aiProvider === 'perplexity') {
                return callPerplexityOnline(apiKey, [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ]);
            }
            throw new Error(`Unsupported provider for acronyms: ${aiProvider}`);
        };
        const acronymsResponse = await delegateToAI(aiProvider, userApiKeys, taskFunction, phrase, purpose, style, alternatives);
        
        // Process the response to extract acronyms and their meanings
        const acronyms = [];
        const lines = acronymsResponse.split('\n');
        
        // Different patterns to detect acronyms
        for (const line of lines) {
            // Skip empty lines and headers
            if (!line.trim() || line.toLowerCase().includes('acronym') && line.includes(':')) continue;
            
            // Pattern 1: "ACRONYM: Actual Representation Of Named Your Method"
            const pattern1 = line.match(/^([A-Z]{2,})\s*:\s*(.+)$/);
            if (pattern1) {
                acronyms.push({
                    acronym: pattern1[1],
                    meaning: pattern1[2]
                });
                continue;
            }
            
            // Pattern 2: "1. ACRONYM - Actual Representation Of Named Your Method"
            const pattern2 = line.match(/^\d+\.\s*([A-Z]{2,})\s*[-–:]\s*(.+)$/);
            if (pattern2) {
                acronyms.push({
                    acronym: pattern2[1],
                    meaning: pattern2[2]
                });
                continue;
            }
            
            // Pattern 3: Just an uppercase word that looks like an acronym
            const pattern3 = line.match(/^([A-Z]{2,})$/);
            if (pattern3) {
                acronyms.push({
                    acronym: pattern3[1],
                    meaning: ""
                });
            }
        }
        
        // If we didn't find structured acronyms, try to extract any uppercase words
        if (acronyms.length === 0) {
            const potentialAcronyms = acronymsResponse.match(/\b[A-Z]{2,}\b/g) || [];
            for (const acronym of potentialAcronyms) {
                if (!acronyms.some(a => a.acronym === acronym)) {
                    acronyms.push({
                        acronym: acronym,
                        meaning: ""
                    });
                }
            }
        }
        
        // Limit to requested number of alternatives
        const result = acronyms.slice(0, parseInt(alternatives));
        
        return result.length > 0 ? { acronyms: result } : { error: "Failed to generate acronyms" };
    } catch (error) { return { error: error.message }; }
};

/**
 * Suggests the best social media platform(s) for a given text snippet.
 * Returns an array of suggested platform objects { platform: string, reason: string }.
 */
exports.suggestBestPlatformsForSnippet = async (snippetText, aiProvider, userApiKeys, numSuggestions = 2) => {
    try {
        const taskFunction = async (apiKey, text, count) => {
            const textToAnalyze = text.substring(0, 1500); // Analyze a reasonable length

            // Describe platform characteristics to the AI
            const platformCharacteristics = `
                - Twitter (X): Short, concise, newsy, conversational, good for questions, threads for longer thoughts. Max ~280 chars (but aim for brevity). Hashtags are key.
                - LinkedIn: Professional, insightful, industry-focused, longer posts acceptable, articles, career-oriented. Good for thought leadership.
                - Instagram: Highly visual. Captions support text but should complement image/video. Storytelling, behind-the-scenes, engaging questions. Hashtags important.
                - Facebook: Versatile, community-focused, can be longer, good for storytelling, events, questions, links.
                - Medium/Blog: Long-form, detailed articles, thought leadership, storytelling.
                - Email Newsletter: Direct communication, can be personal or promotional, value-driven, clear call to action.
                - TikTok/Shorts Script: Very short, engaging, hook-driven, often for video.
            `;

            const systemInstruction = `You are a social media strategy expert. Analyze the provided text snippet and suggest the top ${count} social media platform(s) where it would perform best. For each suggested platform, provide a brief (1-sentence) reason why it's a good fit based on its content, length, and style, considering these platform characteristics:\n${platformCharacteristics}`;
            const userPrompt = `Text Snippet to Analyze:\n"${textToAnalyze}"\n\nSuggested Platforms (Format: Platform Name - Brief Reason):`;

            let responseText;
            if (aiProvider === 'openai') {
                responseText = await callOpenAI(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }], "gpt-3.5-turbo", 0.6, 150 * count);
            } else if (aiProvider === 'gemini') {
                responseText = await callGemini(apiKey, `${systemInstruction}\n\n${userPrompt}`, "gemini-1.5-flash-latest", 0.6, 150 * count);
            } else if (aiProvider === 'perplexity') { // Perplexity might leverage its web knowledge here
                responseText = await callPerplexityOnline(apiKey, [{ role: "system", content: systemInstruction }, { role: "user", content: userPrompt }]);
            } else {
                throw new Error(`Unsupported provider for platform suggestion: ${aiProvider}`);
            }

            // Parse the response (e.g., "Twitter - Concise and good for a quick update.")
            if (typeof responseText === 'string' && responseText.trim() !== '') {
                return responseText.split('\n')
                    .map(line => {
                        const parts = line.split(/ - | – /); // Split by ' - ' or ' – '
                        const platform = parts[0]?.replace(/^- |^\d+\.\s*/, '').trim();
                        const reason = parts.slice(1).join(' - ').trim(); // Join back if reason had ' - '
                        if (platform && reason) {
                            return { platform, reason };
                        }
                        return null;
                    })
                    .filter(p => p && p.platform && p.reason); // Ensure both parts exist
            }
            return []; // Return empty if no valid suggestions
        };

        const suggestions = await delegateToAI(aiProvider, userApiKeys, taskFunction, snippetText, numSuggestions);
        return (suggestions && Array.isArray(suggestions)) ? { suggestions } : (suggestions || { error: "Failed to suggest platforms." });
    } catch (error) {
        console.error(`Error in suggestBestPlatformsForSnippet (${aiProvider}):`, error.message);
        return { error: error.message };
    }
};

/**
 * Translates text to a specified target language using AI.
 * targetLanguage should be the language name (e.g., "Spanish", "French", "Japanese")
 * or an ISO 639-1 code (e.g., "es", "fr", "ja") if the AI understands it better.
 * For LLMs, full language names are often more robust.
 */
exports.translateTextWithAI = async (textToTranslate, targetLanguage, aiProvider, userApiKeys, sourceLanguage = "auto") => {
    try {
        const taskFunction = async (apiKey, text, lang, srcLang) => {
            const textSnippet = text.substring(0, 10000); // Allow decent length for translation context

            let systemInstruction = `You are an expert multilingual translator. Translate the following text accurately and naturally into ${lang}.`;
            if (srcLang && srcLang !== "auto") {
                systemInstruction += ` The source text is in ${srcLang}.`;
            } else {
                systemInstruction += ` Detect the source language automatically if not specified.`;
            }
            // Ensure the AI only returns the translated text, no extra conversational fluff.
            systemInstruction += " Only provide the translated text as your response.";


            const userPrompt = `Text to translate:\n"${textSnippet}"`;

            let translatedText;
            if (aiProvider === 'openai') {
                // For OpenAI, it's often better to put the full instruction in the user message or a clear system message.
                // Let's try a combined approach.
                const messages = [
                    { role: "system", content: "You are an expert multilingual translator. Your sole task is to translate the provided text into the specified target language accurately and naturally. Only output the translated text." },
                    { role: "user", content: `Translate the following text ${srcLang && srcLang !== "auto" ? "from " + srcLang + " " : ""}to ${lang}:\n\n${textSnippet}` }
                ];
                translatedText = await callOpenAI(apiKey, messages, "gpt-3.5-turbo", 0.3, Math.max(500, getWordCount(textSnippet) * 3)); // Lower temp for more literal translation
            } else if (aiProvider === 'gemini') {
                const prompt = `${systemInstruction}\n\n${userPrompt}`;
                translatedText = await callGemini(apiKey, prompt, "gemini-1.5-flash-latest", 0.3, Math.max(500, getWordCount(textSnippet) * 3));
            } else if (aiProvider === 'perplexity') {
                // Perplexity might not be the primary choice for pure translation but can attempt it.
                const messages = [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: userPrompt }
                ];
                translatedText = await callPerplexityOnline(apiKey, messages);
            } else {
                throw new Error(`Unsupported provider for translation: ${aiProvider}`);
            }
            return translatedText;
        };

        const translationResult = await delegateToAI(aiProvider, userApiKeys, taskFunction, textToTranslate, targetLanguage, sourceLanguage);

        return (translationResult && typeof translationResult === 'string') ? { translatedText: translationResult.trim() } : (translationResult || { error: "Failed to translate text." });
    } catch (error) {
        console.error(`Error in translateTextWithAI (${aiProvider} to ${targetLanguage}):`, error.message);
        return { error: error.message };
    }
};

/**
 * Handles conversational content generation requests.
 * Takes the current conversation history and the new user prompt.
 */
exports.generateChatAssistedContent = async (
    userPrompt,
    conversationHistory = [], // Array of { role: 'user'/'assistant', content: '...' }
    generationTarget, // e.g., "blog_post_intro", "full_article_draft", "titles_only", "specific_paragraph_rewrite"
    existingTitle = "", // Context from the form
    existingBody = "",  // Context from the form
    aiProvider,
    userApiKeys,
    numVariations = 1 // How many options to generate
) => {
    try {
        const taskFunction = async (apiKey, uPrompt, convoHist, target, titleCtx, bodyCtx, variations) => {
            let systemInstruction = "You are a versatile AI content creation assistant. The user will provide a prompt, and potentially existing text from their title or body fields. Your goal is to help them generate or refine content. ";
            let specificInstruction = "";

            // Construct a more detailed prompt for the AI based on the target
            switch (target) {
                case "titles_only":
                    specificInstruction = `Based on the user's idea, generate ${variations} compelling title options. Each title on a new line.`;
                    break;
                case "blog_post_intro":
                    specificInstruction = `Write an engaging introduction (1-2 paragraphs) for a blog post based on the user's idea/prompt. If a title is provided as context, use it.`;
                    break;
                case "full_article_draft":
                    specificInstruction = `Generate a draft for a full article (introduction, several body paragraphs with potential subheadings, and a conclusion) based on the user's idea/prompt. Use Markdown for headings. If a title is provided, use it. Aim for approximately 500-800 words.`;
                    break;
                case "body_paragraph":
                    specificInstruction = `Generate a body paragraph for the current content based on the user's specific request or topic.`;
                    break;
                case "refine_selection": // If user selected text and wants to refine it via chat
                     specificInstruction = `The user has provided a text selection and a new prompt. Refine the selection based on their prompt. Selection: "${bodyCtx}"`; // bodyCtx here would be the selected text
                     break;
                default: // General assistance
                    specificInstruction = "Respond to the user's content creation request helpfully and creatively. If they ask for specific content like a title or paragraph, provide it.";
            }

            const fullUserQuery = `User's Request: ${uPrompt}\nTargeting: ${target}\n${titleCtx ? `Current Title Context: "${titleCtx}"\n` : ''}${bodyCtx && target !== 'refine_selection' ? `Current Body Context (first 200 chars): "${bodyCtx.substring(0,200)}..."\n` : ''}`;

            // Build messages array including history
            const messages = [
                { role: "system", content: systemInstruction + " " + specificInstruction }
            ];
            conversationHistory.forEach(msg => messages.push(msg)); // Add past conversation
            messages.push({ role: "user", content: fullUserQuery });

            let maxTokens = 500; // Default
            if (target === "full_article_draft") maxTokens = 1500;
            if (variations > 1 && target === "titles_only") maxTokens = 50 * variations + 50;


            if (aiProvider === 'openai') {
                return callOpenAI(apiKey, messages, "gpt-3.5-turbo-16k", 0.7, maxTokens);
            } else if (aiProvider === 'gemini') {
                // Gemini might prefer a simpler prompt structure without explicit roles for history,
                // or you might need to format the history differently.
                // For now, let's try sending the last few turns as part of the main prompt.
                let geminiPrompt = `${systemInstruction} ${specificInstruction}\n\n`;
                conversationHistory.slice(-4).forEach(msg => { // Last 2 user/assistant turns
                    geminiPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
                });
                geminiPrompt += `User: ${fullUserQuery}`;
                return callGemini(apiKey, geminiPrompt, "gemini-1.5-flash-latest", 0.7, maxTokens);
            } else if (aiProvider === 'perplexity') {
                // Perplexity might also need history formatted into the prompt or use its specific message structure
                return callPerplexityOnline(apiKey, messages); // Assuming messages format is okay
            }
            throw new Error(`Unsupported provider for chat-assisted content: ${aiProvider}`);
        };

        const generatedContent = await delegateToAI(aiProvider, userApiKeys, taskFunction, userPrompt, conversationHistory, generationTarget, existingTitle, existingBody, numVariations);

        // The AI might return one or more variations. If multiple, it should be instructed to separate them.
        // For simplicity, let's assume it returns a single string that might contain multiple options separated by a known delimiter.
        return (generatedContent && typeof generatedContent === 'string') ? { generatedText: generatedContent.trim() } : (generatedContent || { error: "Failed to generate content via chat." });

    } catch (error) {
        console.error(`Error in generateChatAssistedContent (${aiProvider}):`, error.message);
        return { error: error.message };
    }
};