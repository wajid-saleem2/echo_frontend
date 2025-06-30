// backend/controllers/personaController.js
const AudiencePersona = require('../models/AudiencePersona');

// @desc    Create a new audience persona
// @route   POST /api/personas
// @access  Private
exports.createAudiencePersona = async (req, res) => {
    const { name, description } = req.body;
    if (!name || !description) {
        return res.status(400).json({ message: 'Persona name and description are required.' });
    }
    try {
        const persona = await AudiencePersona.create({ name, description, user: req.user.id });
        res.status(201).json(persona);
    } catch (error) {
        console.error("Create Persona Error:", error);
        if (error.code === 11000) return res.status(400).json({ message: 'A persona with this name already exists.' });
        res.status(500).json({ message: 'Server error creating persona.' });
    }
};

// @desc    Get all audience personas for the logged-in user
// @route   GET /api/personas
// @access  Private
exports.getUserAudiencePersonas = async (req, res) => {
    try {
        const personas = await AudiencePersona.find({ user: req.user.id }).sort({ name: 1 });
        res.json(personas);
    } catch (error) {
        console.error("Get Persona Error:", error);
        if (error.code === 11000) return res.status(400).json({ message: 'Error fetching personas.' });
        res.status(500).json({ message: 'Server error creating persona.' });
     }
};

// @desc    Get a single audience persona
// @route   GET /api/personas/:personaId
// @access  Private
exports.getAudiencePersonaById = async (req, res) => { 
    try {
        const persona = await AudiencePersona.findById(req.params.personaId);
        if (!persona || persona.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized or persona not found.' });
        }
        res.json(persona);
    } catch (error) { 
        console.error("Get Persona Error:", error);
        if (error.kind === "ObjectId") {
            return res.status(404).json({ message: "Persona not found (invalid ID format)" });
        }
        res.status(500).json({ message: "Server error" });
    }
 };


// @desc    Update an audience persona
// @route   PUT /api/personas/:personaId
// @access  Private
exports.updateAudiencePersona = async (req, res) => {
    const { name, description } = req.body;
    try {
        const persona = await AudiencePersona.findById(req.params.personaId);
        if (!persona || persona.user.toString() !== req.user.id) { 
            return res.status(401).json({ message: 'Not authorized or persona not found.' });
         }

        if (name) persona.name = name;
        if (description) persona.description = description;
         // Check for duplicate name if name is being changed
        if (name && name !== persona.name) { 
            const existingPersona = await AudiencePersona.findOne({ name, user: req.user.id });
            if (existingPersona) {
                return res.status(400).json({ message: 'A persona with this name already exists.' });
            }
            persona.name = name;
        }
        // if (description) persona.description = description;

        await persona.save();
        res.json(persona);
    } catch (error) { 
        console.error("Update Persona Error:", error);
        res.status(500).json({ message: 'Server error updating persona.' });
     }
};

// @desc    Delete an audience persona
// @route   DELETE /api/personas/:personaId
// @access  Private
exports.deleteAudiencePersona = async (req, res) => {
    try {
        const persona = await AudiencePersona.findById(req.params.personaId);
        if (!persona || persona.user.toString() !== req.user.id) { 
            return res.status(401).json({ message: 'Not authorized or persona not found.' });
         }
        await persona.deleteOne();
        res.json({ message: 'Persona deleted successfully.' });
    } catch (error) { 
        console.error("Delete Persona Error:", error);
        res.status(500).json({ message: 'Server error deleting persona.' });
    }
};