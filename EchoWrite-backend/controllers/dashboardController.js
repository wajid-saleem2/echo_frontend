// // backend/controllers/dashboardController.js (New File)
// const ContentPiece = require('../models/ContentPiece');
// const RepurposedSnippet = require('../models/RepurposedSnippet');

// // @desc    Get dashboard statistics for the logged-in user
// // @route   GET /api/dashboard/stats
// // @access  Private
// exports.getDashboardStats = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         const totalContentPieces = await ContentPiece.countDocuments({ user: userId });
//         const totalRepurposedSnippets = await RepurposedSnippet.countDocuments({ user: userId });

//          // Fetch recent content pieces AND their originalText to create snippets
//          const recentContentPiecesFromDB = await ContentPiece.find({ user: userId })
//          .sort({ updatedAt: -1 })
//          .limit(5)
//          .select('title _id updatedAt contentType originalText'); // <<<< ADD originalText HERE

//      // Process recent pieces to add a snippet
//      const recentContentPieces = recentContentPiecesFromDB.map(piece => {
//          return {
//              _id: piece._id,
//              title: piece.title,
//              updatedAt: piece.updatedAt,
//              contentType: piece.contentType,
//              originalTextSnippet: piece.originalText // Check if originalText itself is null/undefined
//                  ? (piece.originalText.substring(0, 75) + (piece.originalText.length > 75 ? "..." : "")) // Create a shorter snippet for slider
//                  : "No text content available" // Fallback
//          };
//      });
//         // Get recently generated snippets (e.g., last 5 created)
//         // This might be less useful directly on dashboard unless they are drafts
//         const recentSnippets = await RepurposedSnippet.find({ user: userId })
//             .sort({ createdAt: -1 })
//             .limit(5)
//             .select('generatedText platform originalContent createdAt'); // Example fields

//         res.json({
//             totalContentPieces,
//             totalRepurposedSnippets,
//             recentContentPieces,
//             // recentSnippets, // Decide if you want to show this directly
//         });

//     } catch (error) {
//         console.error("Get Dashboard Stats Error:", error);
//         res.status(500).json({ message: "Server error fetching dashboard stats." });
//     }
// };

// backend/controllers/dashboardController.js (Updated)
const ContentPiece = require('../models/ContentPiece');
const RepurposedSnippet = require('../models/RepurposedSnippet');

// @desc    Get dashboard statistics for the logged-in user
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Count total content pieces
        const totalContentPieces = await ContentPiece.countDocuments({ user: userId });
        
        // Count total repurposed snippets
        const totalRepurposedSnippets = await RepurposedSnippet.countDocuments({ user: userId });
        
        // Count published/finalized snippets (assuming 'finalized' means published)
        const totalPublishedSnippets = await RepurposedSnippet.countDocuments({ 
            user: userId, 
            status: 'finalized' 
        });
        
        // Count draft snippets
        const totalDraftSnippets = await RepurposedSnippet.countDocuments({ 
            user: userId, 
            status: 'draft' 
        });
        
        // Fetch recent content pieces AND their originalText to create snippets
        const recentContentPiecesFromDB = await ContentPiece.find({ user: userId })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('title _id updatedAt contentType originalText');
            
        // Process recent pieces to add a snippet
        const recentContentPieces = recentContentPiecesFromDB.map(piece => {
            return {
                _id: piece._id,
                title: piece.title,
                updatedAt: piece.updatedAt,
                contentType: piece.contentType,
                originalTextSnippet: piece.originalText 
                    ? (piece.originalText.substring(0, 75) + (piece.originalText.length > 75 ? "..." : ""))
                    : "No text content available"
            };
        });
        
        // Get recently generated snippets (optional - you can include this if needed)
        const recentSnippets = await RepurposedSnippet.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('originalContent', 'title')
            .select('generatedText platform originalContent createdAt status');
        
        res.json({
            totalContentPieces,
            totalRepurposedSnippets,
            totalPublishedSnippets,
            totalDraftSnippets,
            recentContentPieces,
            recentSnippets // Include if you want to show recent snippets on dashboard
        });
        
    } catch (error) {
        console.error("Get Dashboard Stats Error:", error);
        res.status(500).json({ message: "Server error fetching dashboard stats." });
    }
};
