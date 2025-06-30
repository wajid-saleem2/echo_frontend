// backend/controllers/contentController.js
const ContentPiece = require("../models/ContentPiece");
const axios = require("axios"); // For scraper
const cheerio = require("cheerio"); // For scraper
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
const Folder = require("../models/Folder");

exports.createContentPiece = async (req, res) => {
  const { title, originalText, sourceUrl, contentType, tags, folderId } =
    req.body;

  try {
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required." });
    }
    if (!originalText || originalText.trim() === "") {
      return res.status(400).json({
        message:
          "Original Text is required (or a URL that can be successfully scraped).",
      });
    }

    const contentData = {
      title,
      originalText,
      sourceUrl,
      contentType,
      tags: tags
        ? Array.isArray(tags)
          ? tags
          : tags.split(",").map((tag) => tag.trim())
        : [],
      user: req.user.id,
    };
    if (folderId) {
      // If folderId is provided, validate it belongs to the user
      const folder = await Folder.findOne({ _id: folderId, user: req.user.id });
      if (!folder)
        return res
          .status(400)
          .json({
            message:
              "Invalid folder selected or folder does not belong to user.",
          });
      contentData.folder = folderId;
    }

    const contentPiece = new ContentPiece(contentData);
    const createdContent = await contentPiece.save();
    res.status(201).json(createdContent);
    // ... (save and response)
  } catch (error) {
    console.error("Create Content Error:", error);
    if (error.name === "ValidationError") {
      /* ... */
    }
    // Handle specific scraping errors if thrown from scrapeTextFromUrlWithReadability
    if (error.message.startsWith("Timeout while trying to fetch")) {
      return res.status(408).json({ message: error.message });
    }
    res.status(500).json({
      message: error.message || "Server error while creating content piece",
    });
  }
};

// // @desc    Get all content pieces for the logged-in user
// // @route   GET /api/content
// // @access  Private
// exports.getUserContentPieces = async (req, res) => {
//   try {
//     const contentPieces = await ContentPiece.find({ user: req.user.id }).sort({
//       createdAt: -1,
//     });
//     res.json(contentPieces);
//   } catch (error) {
//     console.error("Get User Content Error:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while fetching content pieces" });
//   }
// };

// @desc    Get a single content piece by ID
// @route   GET /api/content/:id
// @access  Private
exports.getContentPieceById = async (req, res) => {
  try {
    const contentPiece = await ContentPiece.findById(req.params.id).populate('folder', 'name _id');

    if (!contentPiece) {
      return res.status(404).json({ message: "Content piece not found" });
    }

    // Ensure the content piece belongs to the logged-in user
    if (contentPiece.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to access this content" });
    }

    res.json(contentPiece);
  } catch (error) {
    console.error("Get Content By ID Error:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(404)
        .json({ message: "Content piece not found (invalid ID format)" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a content piece
// @route   PUT /api/content/:id
// @access  Private
exports.updateContentPiece = async (req, res) => {
  const { title, originalText, sourceUrl, contentType, tags, folderId, excerpt } =
    req.body;

  try {
    let contentPiece = await ContentPiece.findById(req.params.id);

    if (!contentPiece) {
      return res.status(404).json({ message: "Content piece not found" });
    }

    // Ensure the content piece belongs to the logged-in user
    if (contentPiece.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this content" });
    }

    // Update fields
    if (title) contentPiece.title = title;
    if (originalText) contentPiece.originalText = originalText;
    if (excerpt) contentPiece.excerpt = excerpt;

    if (sourceUrl !== undefined) contentPiece.sourceUrl = sourceUrl; // Allow clearing URL
    if (contentType) contentPiece.contentType = contentType;
    if (tags !== undefined)
      contentPiece.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((tag) => tag.trim());

    if (folderId !== undefined) {
      // Allows setting to null or a new folderId
      if (folderId === null || folderId === "") {
        contentPiece.folder = null;
      } else {
        const folder = await Folder.findOne({
          _id: folderId,
          user: req.user.id,
        });
        if (!folder)
          return res.status(400).json({ message: "Invalid folder selected." });
        contentPiece.folder = folderId;
      }
    }

    const updatedContent = await contentPiece.save();
    await updatedContent.populate({ path: 'folder', select: 'name _id' });
    res.json(updatedContent);
  } catch (error) {
    console.error("Update Content Error:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res
      .status(500)
      .json({ message: "Server error while updating content piece" });
  }
};

// @desc    Delete a content piece
// @route   DELETE /api/content/:id
// @access  Private
exports.deleteContentPiece = async (req, res) => {
  try {
    const contentPiece = await ContentPiece.findById(req.params.id);

    if (!contentPiece) {
      return res.status(404).json({ message: "Content piece not found" });
    }

    // Ensure the content piece belongs to the logged-in user
    if (contentPiece.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this content" });
    }

    await contentPiece.deleteOne(); // Mongoose v6+
    // For older Mongoose: await contentPiece.remove();

    res.json({ message: "Content piece removed successfully" });
  } catch (error) {
    console.error("Delete Content Error:", error);
    res
      .status(500)
      .json({ message: "Server error while deleting content piece" });
  }
};

// @desc    Get all content pieces for the logged-in user (with pagination)
// @route   GET /api/content
// @access  Private
exports.getUserContentPieces = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;
    const { folderId, tags: tagsQuery, tagsAny: tagsAnyQuery } = req.query; // Renamed for clarity
    const userId = req.user.id;
    // const { folderId } = req.query; // New query param for filtering
    let query = { user: userId };
    if (folderId) {
        if (folderId === 'unfoldered') query.folder = null;
        else query.folder = folderId;
    }

    if (tagsQuery) {
        const tagsToMatchAll = tagsQuery.split(',').map(t => t.trim()).filter(t => t);
        if (tagsToMatchAll.length > 0) {
            query.tags = { $all: tagsToMatchAll };
        }
    } else if (tagsAnyQuery) {
        const tagsToMatchAny = tagsAnyQuery.split(',').map(t => t.trim()).filter(t => t);
        if (tagsToMatchAny.length > 0) {
            query.tags = { $in: tagsToMatchAny };
        }
    }
    console.log("Final MongoDB Query:", query); // DEBUG

    const totalContentPieces = await ContentPiece.countDocuments(query);
    const contentPiecesFromDB = await ContentPiece.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('folder', 'name') // << POPULATE FOLDER NAME
        .select('_id title contentType createdAt updatedAt tags folder originalText'); // Include folder
    // OR if you have an excerpt field: .select('_id title contentType createdAt updatedAt tags excerpt');

    // 2. PROCESS to create the snippet
    const processedContentPieces = contentPiecesFromDB.map((piece) => {
      // Log to see what `piece.originalText` contains here
      console.log(
        `Processing piece: ${
          piece.title
        }, originalText available: ${!!piece.originalText}`
      );

      return {
        _id: piece._id,
        title: piece.title,
        contentType: piece.contentType,
        createdAt: piece.createdAt,
        updatedAt: piece.updatedAt,
        tags: piece.tags,
        folder: piece.folder ? { _id: piece.folder._id, name: piece.folder.name } : null, // Send folder id and name
        originalTextSnippet: piece.originalText // Check if originalText itself is null/undefined
          ? piece.originalText.substring(0, 100) +
            (piece.originalText.length > 100 ? "..." : "")
          : "No text content", // Fallback if originalText is missing from DB item
      };
    });
    console.log(
      "Processed pieces being sent:",
      JSON.stringify(processedContentPieces, null, 2)
    ); // Log the final array

    res.json({
      data: processedContentPieces,
      currentPage: page,
      totalPages: Math.ceil(totalContentPieces / limit),
      totalItems: totalContentPieces,
      limit: limit,
    });
  } catch (error) {
    console.error("Get User Content Error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching content pieces" });
  }
};


exports.getUniqueUserTags = async (req, res) => {
  try {
      const uniqueTags = await ContentPiece.distinct("tags", { user: req.user.id });
      // Filter out any null, undefined, or empty string tags that might have crept in
      const cleanedTags = uniqueTags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '').sort();
      console.log(`[BACKEND] Unique tags for user ${req.user.id}:`, cleanedTags); // DEBUG
      res.json(cleanedTags);
  } catch (error) {
      console.error("Get Unique Tags Error:", error);
      res.status(500).json({ message: "Server error fetching unique tags." });
  }
};