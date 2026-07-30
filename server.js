/**
 * Celestial Insights — Backend Server
 *
 * Express API server handling Razorpay payments,
 * Gemini report generation, and Supabase storage.
 * Vercel Serverless compatible.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');
const { generateAstrologyReport } = require('./astro-gemini');

// ===== Environment Variables Validation =====
const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'GEMINI_API_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const app = express();

// ===== Middleware =====
const allowedOrigins = [
    'https://agitools24.com',
    'https://tools24-beige.vercel.app',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.error(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Rate limiting (simple in-memory — use redis in production)
const rateLimitMap = new Map();
app.use('/api/', (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 30;

    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, startTime: now });
    } else {
        const entry = rateLimitMap.get(ip);
        if (now - entry.startTime > windowMs) {
            entry.count = 1;
            entry.startTime = now;
        } else {
            entry.count++;
        }
        if (entry.count > maxRequests) {
            return res.status(429).json({ error: 'Too many requests. Please try again later.' });
        }
    }
    next();
});

// Serve static files from the project root instead of public
app.use(express.static(path.join(__dirname)));

// ===== Razorpay Instance =====
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ===== Supabase Client =====
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ===== Async Error Handler Wrapper =====
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ===== Health Check =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== Create Razorpay Order =====
app.post('/api/create-order', asyncHandler(async (req, res) => {
    try {
        const { amount, currency, reportType } = req.body;

        // Validate amount
        const validAmounts = [1, 9900, 12900, 19900];
        if (!validAmounts.includes(amount)) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const order = await razorpay.orders.create({
            amount,
            currency: currency || 'INR',
            receipt: 'ci_' + Date.now() + '_' + reportType,
            notes: { reportType }
        });

        // Store order in Supabase
        try {
            const { error: dbError } = await supabase
                .from('orders')
                .insert({
                    order_id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    report_type: reportType,
                    status: 'created'
                });

            if (dbError) {
                console.error('Supabase insert error:', dbError);
            }
        } catch (dbErr) {
            console.error('Supabase insert exception:', dbErr);
        }

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
    console.error("Create order error:", err);

    res.status(500).json({
        success: false,
        message: err.message,
        stack: err.stack
    });
}
}));

// ===== Verify Payment =====
app.post('/api/verify-payment', asyncHandler(async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userDetails
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment details' });
        }

        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // Fetch order from Supabase
        const { data: orderData, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('order_id', razorpay_order_id)
            .single();

        if (fetchError || !orderData) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update order in Supabase
        try {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'paid',
                    payment_id: razorpay_payment_id,
                    user_details: userDetails,
                    paid_at: new Date().toISOString()
                })
                .eq('order_id', razorpay_order_id);

            if (updateError) {
                console.error('Supabase update error:', updateError);
            }
        } catch (dbErr) {
            console.error('Supabase update exception:', dbErr);
        }

        res.json({
            verified: true,
            orderId: orderData.id
        });

    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ error: 'Payment verification failed' });
    }
}));

// ===== Generate Report =====
app.post('/api/generate-report', asyncHandler(async (req, res) => {
    try {
        const { orderId, userDetails } = req.body;

        if (!orderId || !userDetails) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify order is paid
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (orderData.status !== 'paid') {
            return res.status(403).json({ error: 'Order not paid' });
        }

        // Generate report using Gemini
        const report = await generateAstrologyReport({
            name: userDetails.name,
            gender: userDetails.gender,
            dob: userDetails.dob,
            birthTime: userDetails.tob,
            birthPlace: userDetails.birthPlace,
            language: userDetails.language,
            reportType: userDetails.reportType
        });

        // Store report in Supabase
        try {
            const { error: reportError } = await supabase
                .from('reports')
                .insert({
                    order_id: orderId,
                    user_details: userDetails,
                    report_content: report,
                    report_type: userDetails.reportType,
                    language: userDetails.language,
                    created_at: new Date().toISOString()
                });

            if (reportError) {
                console.error('Report storage error:', reportError);
            }

            // Update order status
            const { error: statusUpdateError } = await supabase
                .from('orders')
                .update({ status: 'report_generated' })
                .eq('id', orderId);

            if (statusUpdateError) {
                console.error('Order status update error:', statusUpdateError);
            }
        } catch (dbErr) {
            console.error('Supabase report storage exception:', dbErr);
        }

        res.json({ report });

    } catch (err) {
        console.error('Generate report error:', err);
        res.status(500).json({ error: 'Report generation failed' });
    }
}));

// ===== Fallback: Serve index.html for all non-API routes =====
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(__dirname, 'astro-index.html'), (err) => {
        if (err) {
            console.error('Error serving astro-index.html:', err);
            next(err);
        }
    });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.message);
    
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'Not allowed by CORS' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
});

// ===== Vercel Serverless Export =====
module.exports = app;

// ===== Start Server (Local Development Only) =====
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('✦ Celestial Insights server running on port ' + PORT);
        console.log('  → http://localhost:' + PORT);
    });
}
