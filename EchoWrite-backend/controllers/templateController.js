// backend/controllers/templateController.js
const SnippetTemplate = require('../models/SnippetTemplate');

// @desc    Create a new snippet template
// @route   POST /api/templates
// @access  Private
exports.createSnippetTemplate = async (req, res) => {
    const { name, content, platformHint, description, category, communityTags } = req.body;
    if (!name || !content) {
        return res.status(400).json({ message: 'Template name and content are required.' });
    }
    try {
        const template = await SnippetTemplate.create({
            name,
            content,
            description,
            platformHint,
            category: category ? category.toLowerCase().trim() : undefined, // Handle optional fields
            communityTags: Array.isArray(communityTags) ? communityTags.map(t=>t.toLowerCase().trim()).filter(t=>t) : [],
            user: req.user.id
        });
        res.status(201).json(template);
    } catch (error) {
        console.error("Create Template Error:", error);
        if (error.code === 11000) return res.status(400).json({ message: 'A template with this name already exists.' });
        res.status(500).json({ message: 'Server error creating template.' });
    }
};

// @desc    Get all snippet templates for the logged-in user
// @route   GET /api/templates
// @access  Private
exports.getUserSnippetTemplates = async (req, res) => {
    try {
        const templates = await SnippetTemplate.find({ user: req.user.id }).sort({ name: 1 });
        res.json(templates);
    } catch (error) {
        console.error("Get Templates Error:", error);
        res.status(500).json({ message: 'Server error fetching templates.' });
    }
};

// @desc    Get a single snippet template
// @route   GET /api/templates/:templateId
// @access  Private
exports.getSnippetTemplateById = async (req, res) => {
    try {
        const template = await SnippetTemplate.findById(req.params.templateId);
        if (!template || template.user.toString() !== req.user.id) {
            return res.status(404).json({ message: 'Template not found or not authorized.' });
        }
        res.json(template);
    } catch (error) {
        console.error("Get Template By ID Error:", error);
        res.status(500).json({ message: 'Server error.' });
    }
};


// @desc    Update a snippet template
// @route   PUT /api/templates/:templateId
// @access  Private
exports.updateSnippetTemplate = async (req, res) => {
    const { name, content, platformHint, description, isShared, category, communityTags } = req.body; // Added description
    try {
        const template = await SnippetTemplate.findById(req.params.templateId);
        if (!template) return res.status(404).json({ message: 'Template not found.' });
        if (template.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized.' });
        }

        if (name) template.name = name;
        if (content) template.content = content;
        if (description !== undefined) template.description = description; 
        if (platformHint !== undefined) template.platformHint = platformHint;

          // Handle sharing status and related fields
          if (isShared !== undefined && typeof isShared === 'boolean') {
            if (isShared && !template.isShared) { // Sharing now
                if (!category || category.trim() === '') { // Category is good for discoverability
                    return res.status(400).json({ message: "A category is recommended to share a template." });
                }
                template.isShared = true;
                template.sharedAt = Date.now();
                if (category) template.category = category.toLowerCase().trim();
                if (communityTags) template.communityTags = Array.isArray(communityTags) ? communityTags.map(t=>t.toLowerCase().trim()).filter(t=>t) : [];
            } else if (!isShared && template.isShared) { // Unsharing
                template.isShared = false;
                // Decide if you want to clear category/communityTags upon unsharing, or keep them
            }
        } else { // If not changing share status, still allow updating category/tags for a shared template
             if (category !== undefined) template.category = category.toLowerCase().trim();
             if (communityTags !== undefined) template.communityTags = Array.isArray(communityTags) ? communityTags.map(t=>t.toLowerCase().trim()).filter(t=>t) : [];
        }

        // Check for duplicate name if name is being changed
        if (name && name !== template.name) {
             const existing = await SnippetTemplate.findOne({ name, user: req.user.id, _id: { $ne: template._id } });
             if (existing) return res.status(400).json({ message: 'Another template with this name already exists.' });
        }

        await template.save();
        res.json(template);
    } catch (error) {
        console.error("Update Template Error:", error);
         if (error.code === 11000) return res.status(400).json({ message: 'A template with this name already exists.' });
        res.status(500).json({ message: 'Server error updating template.' });
    }
};

// @desc    Delete a snippet template
// @route   DELETE /api/templates/:templateId
// @access  Private
exports.deleteSnippetTemplate = async (req, res) => {
    try {
        const template = await SnippetTemplate.findById(req.params.templateId);
        if (!template) return res.status(404).json({ message: 'Template not found.' });
        if (template.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized.' });
        }
        await template.deleteOne();
        res.json({ message: 'Template deleted successfully.' });
    } catch (error) {
        console.error("Delete Template Error:", error);
        res.status(500).json({ message: 'Server error deleting template.' });
    }
};

// --- NEW COMMUNITY ENDPOINTS ---

exports.getCommunitySnippetTemplates = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const { sortBy = 'sharedAt', category, tag, searchQuery } = req.query;

        let query = { isShared: true }; // Only fetch shared templates
        if (category) query.category = category.toLowerCase();
        if (tag) query.communityTags = tag.toLowerCase();
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { content: { $regex: searchQuery, $options: 'i' } }, // Search in content too
                { description: { $regex: searchQuery, $options: 'i' } } // If you add a description field
            ];
        }

        const sortOptions = {};
        if (sortBy === 'popularity') sortOptions.communityUses = -1;
        else if (sortBy === 'name') sortOptions.name = 1;
        else sortOptions.sharedAt = -1; // Default: newest shared

        const totalTemplates = await SnippetTemplate.countDocuments(query);
        const templates = await SnippetTemplate.find(query)
            .populate('user', 'username') // Show creator's username
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .select('name user description category communityTags communityUses sharedAt platformHint'); // Exclude sensitive user info

        res.json({
            data: templates,
            currentPage: page,
            totalPages: Math.ceil(totalTemplates / limit),
            totalItems: totalTemplates
        });
    } catch (error) {
        console.error("Get Community Templates Error:", error);
        res.status(500).json({ message: "Server error fetching community templates." });
    }
};

exports.cloneCommunitySnippetTemplate = async (req, res) => {
    try {
        const communityTemplate = await SnippetTemplate.findOne({ _id: req.params.templateId, isShared: true });
        if (!communityTemplate) return res.status(404).json({ message: "Shared template not found." });

        const existingUserTemplate = await SnippetTemplate.findOne({ name: communityTemplate.name, user: req.user.id });
        if (existingUserTemplate) {
            return res.status(400).json({ message: `You already have a template named "${communityTemplate.name}".` });
        }

        const newTemplate = new SnippetTemplate({
            name: `${communityTemplate.name} (Copy)`,
            content: communityTemplate.content,
            platformHint: communityTemplate.platformHint,
            user: req.user.id, // Assign to current user
            isShared: false, // Cloned version is private
            // Inherit category/tags from original, user can change later
            category: communityTemplate.category,
            communityTags: communityTemplate.communityTags,
            communityUses: 0 // Reset uses for the copy
        });
        await newTemplate.save();

        communityTemplate.communityUses = (communityTemplate.communityUses || 0) + 1;
        await communityTemplate.save();

        res.status(201).json(newTemplate);
    } catch (error) { /* ... error handling ... */ }
};

exports.getCommunityTemplateCategories = async (req, res) => {
     try {
         const categories = await SnippetTemplate.distinct("category", { isShared: true, category: { $ne: null, $ne: "" } });
         res.json(categories.filter(c => c).sort());
     } catch (error) { res.status(500).json({ message: "Server error." }); }
 };

 exports.getCommunityTemplateTags = async (req, res) => {
     try {
         const tags = await SnippetTemplate.distinct("communityTags", { isShared: true, communityTags: { $ne: null, $ne: "" } });
         res.json(tags.filter(t => t).sort());
     } catch (error) { res.status(500).json({ message: "Server error." }); }
 };