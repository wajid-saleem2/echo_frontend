// backend/config/passportSetup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User'); // Your User model
const jwt = require('jsonwebtoken'); // To generate your app's token

// Helper to generate your app's JWT (you already have this in authController)
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL, // Your backend callback
            scope: ['profile', 'email'], // Request access to profile and email
        },
        async (accessToken, refreshToken, profile, done) => {
            // This callback function is called after Google authenticates the user
            console.log('Google Profile:', JSON.stringify(profile, null, 2));

            try {
                // Check if user already exists in your DB
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    // User exists, log them in by generating your app's JWT
                    console.log('Google OAuth: Existing user found:', user.email);
                    const token = generateToken(user._id);
                    // Pass user and token to be available in the callback route
                    return done(null, { user, token });
                } else {
                    // User doesn't exist, check if email is already in use
                    user = await User.findOne({ email: profile.emails[0].value });
                    if (user) {
                        // Email exists, link Google ID to this account
                        console.log('Google OAuth: Email exists, linking Google ID to:', user.email);
                        user.googleId = profile.id;
                        // Optionally save profile picture if your User model supports it
                        // user.profilePicture = profile.photos[0].value;
                        await user.save();
                        const token = generateToken(user._id);
                        return done(null, { user, token });
                    } else {
                        // New user, create them
                        console.log('Google OAuth: New user, creating account for:', profile.emails[0].value);
                        const newUser = new User({
                            googleId: profile.id,
                            username: profile.displayName || profile.emails[0].value.split('@')[0], // Create a username
                            email: profile.emails[0].value,
                            isEmailVerified: true, // Email from Google is considered verified
                            // profilePicture: profile.photos[0].value,
                            // Password is not needed for OAuth users, but your schema might require it.
                            // If so, generate a random one or handle this case in your schema.
                            // For now, assuming your schema allows password to be optional or you handle it.
                        });
                        await newUser.save();
                        const token = generateToken(newUser._id);
                        return done(null, { user: newUser, token });
                    }
                }
            } catch (error) {
                console.error('Error in Google OAuth Strategy:', error);
                return done(error, null);
            }
        }
    )
);

// Note: For session-based auth with Passport, you'd use serializeUser/deserializeUser.
// Since we are using JWTs and our `protect` middleware, we don't strictly need them
// for this JWT-based flow if the callback directly issues a JWT.
// If you were using Passport sessions throughout your app, these would be essential.
// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });
// passport.deserializeUser((id, done) => {
//     User.findById(id).then(user => {
//         done(null, user);
//     });
// });