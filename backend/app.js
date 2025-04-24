const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const adminRoutes = require('./routes/adminRoutes');
const activityRoutes = require('./routes/activityRoutes');
const { requireAuth } = require("./middleware/authMiddleware");
const { checkSession } = require("./controllers/authController");
const { json } = require("body-parser");

dotenv.config();
const app = express();

// ---------- Middleware Setup ----------

// Essential middleware
app.use(cookieParser());
app.use(json());
app.use(express.urlencoded({ extended: true }));

// CORS - Must come before routes, proxy, CSRF
const allowedOrigins = [
    'http://localhost:3000',
    'chrome-extension://kbkjjklbejbbheenhldadfbllnodkmeh'
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Extension-Request', 'Extension-Token']
}));

// CSRF configuration
const csrfProtection = csrf({
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// CSRF middleware - skip for extensions and ML proxy
app.use((req, res, next) => {
    if (req.headers['x-extension-request'] === 'true' || req.path.startsWith('/api/ml')) {
        return next();
    }
    csrfProtection(req, res, next);
});

// ---------- CSRF Token Endpoint ----------
app.get('/api/csrf-token', (req, res) => {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.json({ csrfToken: req.csrfToken() });
});

// ---------- MongoDB Connection ----------
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// ---------- Main API Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/activity', activityRoutes);
app.get('/session', requireAuth, checkSession);

const mlProxy = createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
    pathRewrite: {
        '^/api/ml': '/jobs'
    },
    onProxyReq: (proxyReq, req) => {
        console.log(`Proxying: ${req.originalUrl} → ${proxyReq.path}`);
    },
    proxyTimeout: 120000,
    timeout: 120000,
    logLevel: 'debug'
});
app.use('/api/ml', mlProxy);

// ---------- Fallback for 404 ----------
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// ---------- Server Start ----------
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});