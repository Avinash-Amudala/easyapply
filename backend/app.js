const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');

dotenv.config();

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000',
    'chrome-extension://kbkjjklbejbbheenhldadfbllnodkmeh',
    'https://easyapply-msz888j4c-avinashamudalasa-projects.vercel.app',
];

// CORS middleware
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`Blocked by CORS: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Debugging middleware for tracking requests
app.use((req, res, next) => {
    console.log('Request Origin:', req.headers.origin || 'undefined');
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.originalUrl);
    next();
});

// JSON parser middleware
app.use(express.json());

// MongoDB connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// Handle undefined routes
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
