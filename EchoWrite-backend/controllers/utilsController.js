// backend/controllers/utilsController.js
const axios = require('axios');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const cheerio = require("cheerio"); // For scraper
const { getAllUserApiKeys } = require('../utils/apiKeyHelper'); // <<<< IMPORT THE HELPER
const aiService = require('../services/aiService');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const DatauriParser = require('datauri/parser'); // To convert buffer to data URI for Cloudinary
const path = require('path');
// const DatauriParser = require('datauri/parser');
const parser = new DatauriParser();

const bufferToDataUri = (fileFormat, buffer) => parser.format(fileFormat, buffer);

// You should configure these via environment variables for security
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// You might want to move the actual scrapeTextFromUrlWithReadability to a service if it gets complex
// Helper to get all relevant decrypted API keys for the user
// const getAllUserApiKeys = async (userId) => {
//     const user = await User.findById(userId);
//     if (!user) return null;
//     return {
//         openai: user.getDecryptedOpenAiApiKey(),
//         gemini: user.getDecryptedGeminiApiKey(),
//         perplexity: user.getDecryptedPerplexityApiKey(),
//     };
// };

const scrapeTextFromUrlWithReadability = async (url) => {
    try {
      const { data: htmlContent } = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
        timeout: 10000, // 10 second timeout
      });
  
      if (!htmlContent) {
        console.warn(`No HTML content fetched from ${url}`);
        return null;
      }
  
      // Create a JSDOM instance. Pass the URL for Readability to resolve relative links if needed.
      const dom = new JSDOM(htmlContent, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse(); // This is the core Readability object
  
      if (article && article.textContent) {
        let textContent = article.textContent.trim();
        // Basic cleanup: reduce multiple newlines to two, multiple spaces to one
        textContent = textContent.replace(/\n\s*\n/g, "\n\n");
        textContent = textContent.replace(/ {2,}/g, " ");
        return {
          title: article.title || "Scraped Content",
          textContent: textContent.substring(0, 30000), // Limit length
          excerpt: article.excerpt ? article.excerpt.substring(0, 500) : null,
          byline: article.byline || null,
        };
      } else {
        console.warn(`Readability could not parse main content from ${url}`);
        return null;
      }
    } catch (error) {
      console.error(`Scraping Error with Readability for ${url}:`, error.message);
      if (error.code === "ECONNABORTED") {
        throw new Error(`Timeout while trying to fetch content from URL: ${url}`);
      }
      if (error.response) {
        console.error(`Scraping HTTP Error: ${error.response.status} for ${url}`);
      }
      // Don't throw a generic error, let the controller decide based on null return
      return null;
    }
  };


exports.scrapeUrlContent = async (req, res) => {
    const { url } = req.body;
     // req.user should be populated by the 'protect' middleware
     if (!req.user || !req.user.id) {
        console.error("Authentication error: req.user or req.user.id is missing in scrapeUrlContent.");
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    const userId = req.user.id; // Assuming 'protect' middleware adds req.user
    if (!url) {
        return res.status(400).json({ message: 'URL is required for scraping.' });
    }

    try {
        let scrapedData = await scrapeTextFromUrlWithReadability(url);

        if (scrapedData && scrapedData.textContent) {
            let finalTitle = scrapedData.title;
            let finalContent = scrapedData.textContent;
            let extractedImages = [];

            const userApiKeys = await getAllUserApiKeys(userId);

            let preferredAiProvider = '';
            if (userApiKeys?.openai) preferredAiProvider = 'openai';
            else if (userApiKeys?.gemini) preferredAiProvider = 'gemini';
            else if (userApiKeys?.perplexity) preferredAiProvider = 'perplexity';

            if (preferredAiProvider && userApiKeys && finalContent.trim().length > 50) {
                console.log(`Attempting AI structuring for scraped content with ${preferredAiProvider}`);
                const structureResult = await aiService.structureTextWithHeadings(finalContent, preferredAiProvider, userApiKeys);
                if (structureResult && structureResult.structuredText) {
                    finalContent = structureResult.structuredText;
                    console.log("Scraped content AI structured.");
                } else {
                    console.warn("AI structuring failed for scraped content:", structureResult?.error);
                }
            }

            if (scrapedData.contentHtml) {
                const dom = new JSDOM(scrapedData.contentHtml, { url }); // Use the original URL for base
                imagesInArticle = Array.from(dom.window.document.querySelectorAll('img'))
                    .map(img => {
                        let imgSrc = img.getAttribute('src'); // Use getAttribute for robustness
                        if (imgSrc) {
                            try {
                                // Resolve relative URLs against the base URL of the scraped page
                                imgSrc = new URL(imgSrc, url).href;
                            } catch (e) {
                                // If it's already an absolute URL or invalid, keep it as is or skip
                                console.warn(`Could not resolve image URL: ${imgSrc} relative to ${url}`);
                            }
                        }
                        return { src: imgSrc, alt: img.alt || '' };
                    })
                    .filter(img => img.src && !img.src.startsWith('data:') && (img.src.startsWith('http:') || img.src.startsWith('https:')));
                extractedImages = imagesInArticle.slice(0, 5);
            }

            res.json({
                title: finalTitle,
                textContent: finalContent,
                excerpt: scrapedData.excerpt,
                extractedImages: extractedImages
            });
        } else {
            res.status(404).json({ message: 'Could not extract main content from the URL.' });
        }
    } catch (error) {
        console.error("Scrape URL Controller Error:", error);
        res.status(500).json({ message: error.message || 'Server error during scraping.' });
    }
};


// exports.uploadMediaFile = (req, res) => {
//   if (req.file) {
//       // In production, req.file.path would be a URL from S3, Cloudinary, etc.
//       // For local, it's a local path. You need to serve this 'uploads' folder statically
//       // or return a URL that points to it.
//       // Example: http://localhost:5001/uploads/filename.jpg
//       const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
//       res.json({ fileUrl: fileUrl, fileName: req.file.filename });
//   } else {
//       res.status(400).json({ message: 'File upload failed.' });
//   }
// };

exports.uploadMediaFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Convert buffer to data URI
    const fileExt = path.extname(req.file.originalname).toString();
    const file64 = bufferToDataUri(fileExt, req.file.buffer).content;

    // Upload to Cloudinary (you can customize folder, resource_type, etc.)
    const result = await cloudinary.uploader.upload(file64, {
      folder: 'your_app_uploads', // optional folder in Cloudinary
      resource_type: 'auto',       // handles images and videos
      public_id: path.basename(req.file.originalname, fileExt) + '-' + Date.now()
    });

    // result.url is the direct Cloudinary URL
    res.json({ fileUrl: result.secure_url, fileName: req.file.originalname });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: 'Cloudinary upload failed.', error: error.message });
  }
};


