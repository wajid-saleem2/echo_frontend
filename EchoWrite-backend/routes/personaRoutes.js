// backend/routes/personaRoutes.js
const express = require('express');
const router = express.Router();
const {
    createAudiencePersona,
    getUserAudiencePersonas,
    getAudiencePersonaById,
    updateAudiencePersona,
    deleteAudiencePersona
} = require('../controllers/personaController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createAudiencePersona)
    .get(protect, getUserAudiencePersonas);

router.route('/:personaId')
    .get(protect, getAudiencePersonaById)
    .put(protect, updateAudiencePersona)
    .delete(protect, deleteAudiencePersona);

module.exports = router;