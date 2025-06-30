// backend/routes/utilsRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // If you want to protect this utility
const { scrapeUrlContent, uploadMediaFile } = require('../controllers/utilsController'); // We'll create this controller

// const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.post('/scrape-url', protect, scrapeUrlContent);

const UPLOADS_FOLDER_PATH = path.resolve(__dirname, '..', 'uploads');

// Ensure directory exists (can also be done at app startup)
if (!fs.existsSync(UPLOADS_FOLDER_PATH)) {
    fs.mkdirSync(UPLOADS_FOLDER_PATH, { recursive: true });
}
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images or specified video types allowed!'));
    }
  }
});




router.post('/upload-media', protect, upload.single('mediaFile'), uploadMediaFile);


module.exports = router;