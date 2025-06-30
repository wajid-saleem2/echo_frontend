// backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
// --- Session Imports ---
const session = require('express-session');
const MongoStore = require('connect-mongo');
// --- End Session Imports ---
const passport = require('passport'); // << IMPORT
require('./config/passportSetup'); // << IMPORT AND EXECUTE your passport config


// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// --- Session Configuration ---
// Ensure MONGODB_URI and a SESSION_SECRET are in your .env file
if (!process.env.MONGODB_URI || !process.env.SESSION_SECRET) {
    console.error("FATAL ERROR: MONGODB_URI and/or SESSION_SECRET is not defined in .env file.");
    process.exit(1); // Exit if essential session config is missing
}

app.use(session({
    secret: process.env.SESSION_SECRET, // A strong secret for signing the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions', // Optional: name of the sessions collection
        ttl: 14 * 24 * 60 * 60 // Optional: session TTL in seconds (e.g., 14 days)
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (requires HTTPS)
        httpOnly: true, // Prevents client-side JS from reading the cookie
        maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie expiry (e.g., 7 days)
        sameSite: 'lax' // Or 'strict' or 'none' (if cross-site requests are needed with secure flag)
    }
}));
console.log("SESSION CONFIG: NODE_ENV =", process.env.NODE_ENV);
console.log("SESSION CONFIG: Cookie Secure Setting will be:", process.env.NODE_ENV === 'production');
// --- End Session Configuration ---

// --- Passport Middleware ---
app.use(passport.initialize());
// app.use(passport.session()); // Not strictly needed if you're not using Passport sessions for subsequent requests and relying on your JWT
// --- End Passport Middleware ---

// Body parser middleware
app.use(express.json()); // To accept JSON data in req.body
app.use(express.urlencoded({ extended: false })); // To accept form data


// Enable CORS
// For development, allow all origins. For production, restrict it.
// app.use(cors());
// // Example for production:
// // const corsOptions = {
// //   origin: 'https://yourappfrontend.com' // Your frontend URL
// // };
// // app.use(cors(corsOptions));

const allowedOrigins = [
    'http://localhost:3000', 
    'https://echowrite-ai.vercel.app' 
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // If you plan to use cookies or sessions later
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);
  
  console.log('Mounting routes...');


// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/repurpose', require('./routes/repurposeRoutes'));
app.use('/api/ai', require('./routes/aiRoutes')); 
app.use('/api/utils', require('./routes/utilsRoutes')); // Add this
app.use('/api/dashboard', require('./routes/dashboardRoutes')); // <<<< ADD THIS
app.use('/api/connect', require('./routes/connectRoutes')); // Add this
app.use('/api/folders', require('./routes/folderRoutes')); // Add this
app.use('/api/templates', require('./routes/templateRoutes')); // Add this
// To serve uploaded files statically (for local demo)
app.use('/uploads', express.static('uploads'));
app.use('/api/personas', require('./routes/personaRoutes')); // Add this
app.use('/api/payment', require('./routes/paymentRoutes'));
// app.use('/api/payments', require('./routes/paymentRoutes'));
// We will add more routes later e.g. app.use('/api/content', require('./routes/contentRoutes'));

// Basic route for testing
app.get('/', (req, res) => {
    res.send('EchoWrite API Running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

//  // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ success: false, error: 'Route not found' });
// });

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
