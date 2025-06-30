// backend/services/repurposingService.js
const { v4: uuidv4 } = require('uuid'); // For generating groupRef if needed

// --- Helper: Text Processing Utilities ---
const splitIntoSentences = (text) => {
    if (!text) return [];
    // Basic sentence splitting, can be improved with more sophisticated NLP libraries if needed
    return text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
};

const splitIntoParagraphs = (text) => {
    if (!text) return [];
    return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
};

const getWordCount = (text) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
};

// --- Rule-Based Extraction Functions ---

// Extracts H1, H2, H3 (simple markdown-like or common HTML patterns)
const extractHeadings = (text) => {
    const headings = [];
    const lines = text.split('\n');
    lines.forEach(line => {
        if (line.match(/^#\s.+/)) headings.push({ level: 1, text: line.substring(2).trim() });
        else if (line.match(/^##\s.+/)) headings.push({ level: 2, text: line.substring(3).trim() });
        else if (line.match(/^###\s.+/)) headings.push({ level: 3, text: line.substring(4).trim() });
    });
    // Could also add regex for <h1>, <h2> etc. if input might be HTML
    return headings;
};

// Extracts sentences that might be key takeaways (e.g., shorter, declarative)
const extractKeySentences = (text, count = 5) => {
    const sentences = splitIntoSentences(text);
    // Simple heuristic: shorter sentences, or sentences starting with common intro phrases
    // This is very basic and can be significantly improved.
    return sentences
        .filter(s => getWordCount(s) > 5 && getWordCount(s) < 25)
        .slice(0, count);
};

// Generates a very basic summary (e.g., first few and last few sentences)
const createShortSummary = (text, sentenceCount = 2) => {
    const sentences = splitIntoSentences(text);
    if (sentences.length <= sentenceCount * 2) return sentences.join(' ');
    return [...sentences.slice(0, sentenceCount), '...', ...sentences.slice(-sentenceCount)].join(' ');
};

// --- Templating Functions for Specific Platforms ---

const formatForTwitterThread = (originalText, options = {}) => {
    const MAX_TWEET_LENGTH = options.maxLength || 270; // Leave room for " (1/n)"
    const snippets = [];
    const paragraphs = splitIntoParagraphs(originalText);
    let currentTweet = "";
    let threadGroupId = uuidv4();

    paragraphs.forEach(paragraph => {
        const sentences = splitIntoSentences(paragraph);
        sentences.forEach(sentence => {
            if ((currentTweet + sentence).length <= MAX_TWEET_LENGTH) {
                currentTweet += sentence + " ";
            } else {
                if (currentTweet.trim()) {
                    snippets.push({
                        platform: 'twitter_thread_item',
                        generatedText: currentTweet.trim(),
                        groupRef: threadGroupId,
                        orderInGroup: snippets.length + 1
                    });
                }
                currentTweet = sentence + " "; // Start new tweet
            }
        });
        // After a paragraph, if currentTweet has content and is not too short, push it.
        // Or, force push if it's the end of significant content.
        if (currentTweet.trim().length > MAX_TWEET_LENGTH / 3) { // Avoid tiny tweets unless necessary
             snippets.push({
                platform: 'twitter_thread_item',
                generatedText: currentTweet.trim(),
                groupRef: threadGroupId,
                orderInGroup: snippets.length + 1
            });
            currentTweet = "";
        }
    });

    if (currentTweet.trim()) { // Add any remaining part
        snippets.push({
            platform: 'twitter_thread_item',
            generatedText: currentTweet.trim(),
            groupRef: threadGroupId,
            orderInGroup: snippets.length + 1
        });
    }

    // Add (n/total) to each tweet
    const totalTweets = snippets.length;
    return snippets.map((snippet, index) => ({
        ...snippet,
        generatedText: `${snippet.generatedText} (${index + 1}/${totalTweets})`
    }));
};

const formatForLinkedInPost = (originalText, options = {}) => {
    const summary = createShortSummary(originalText, 3);
    const keyPoints = extractKeySentences(originalText, 3);
    let post = `Key takeaways from my latest content:\n\n${summary}\n\n`;
    if (keyPoints.length > 0) {
        post += "Highlights:\n";
        keyPoints.forEach(point => {
            post += `• ${point.trim()}\n`;
        });
    }
    post += "\n#contentrepurposing #echowrite"; // Example hashtags
    return [{ platform: 'linkedin_post', generatedText: post.trim() }];
};

const formatAsKeyTakeawaysList = (originalText, options = {}) => {
    const keyPoints = extractKeySentences(originalText, options.count || 5);
    if (keyPoints.length === 0) return [{ platform: 'key_takeaways_list', generatedText: "Could not extract key takeaways automatically." }];

    let listText = "Here are the key takeaways:\n";
    keyPoints.forEach(point => {
        listText += `• ${point.trim()}\n`;
    });
    return [{ platform: 'key_takeaways_list', generatedText: listText.trim() }];
};

const formatAsShortSummary = (originalText, options = {}) => {
    const summary = createShortSummary(originalText, options.sentenceCount || 2);
    return [{ platform: 'short_summary', generatedText: summary.trim() }];
};


// --- Main Service Function ---
exports.generateRepurposedSnippets = (originalContentPiece, targetPlatform) => {
    const { originalText } = originalContentPiece;
    let generatedSnippets = [];

    switch (targetPlatform) {
        case 'twitter_thread':
            generatedSnippets = formatForTwitterThread(originalText);
            break;
        case 'linkedin_post':
            generatedSnippets = formatForLinkedInPost(originalText);
            break;
        case 'key_takeaways_list':
            generatedSnippets = formatAsKeyTakeawaysList(originalText);
            break;
        case 'short_summary':
            generatedSnippets = formatAsShortSummary(originalText);
            break;
        // Add more cases for other platforms
        // case 'email_snippet':
        // case 'blog_excerpt':
        // etc.
        default:
            throw new Error(`Unsupported target platform: ${targetPlatform}`);
    }

    // Attach user and originalContent IDs
    return generatedSnippets.map(snippet => ({
        ...snippet,
        user: originalContentPiece.user,
        originalContent: originalContentPiece._id,
    }));
};