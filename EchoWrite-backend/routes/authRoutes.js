// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // We'll create this next
const passport = require('passport'); // Import Passport
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe); // Example protected route
router.put('/profile', protect, updateUserProfile);

// --- Google OAuth Routes ---
// Step 1: Redirect to Google for authentication
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'], // What info you're asking for
        session: false // We are not using passport sessions, will issue JWT
    })
);

// Step 2: Callback route after Google has authenticated the user
router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL}/login?oauth_error=google_failed`, // Redirect on failure
        session: false // We are not using passport sessions
    }),
    (req, res) => {
        // Successful authentication!
        // req.user is populated by the Passport Google strategy's done(null, { user, token })
        // The 'user' object here is { user: UserDocument, token: JWTString }
        if (req.user && req.user.token) {
            console.log('Google OAuth successful, user:', req.user.user.email, 'token:', req.user.token);
            // Redirect to frontend with the token.
            // The frontend will then store this token and update auth state.
            res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${req.user.token}`);
        } else {
            console.error('Google OAuth callback: req.user or token missing.');
            res.redirect(`${process.env.FRONTEND_URL}/login?oauth_error=token_generation_failed`);
        }
    }
);
// --- End Google OAuth Routes ---

// Change password
router.put('/change-password', protect, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

module.exports = router;