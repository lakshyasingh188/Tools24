/**
 * Celestial Insights — Backend Server
 *
 * Express API server handling Razorpay payments,
 * Gemini report generation, and Supabase storage.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { createClient } = require('@supabase/supabase-js');
const { generateAstrologyReport } = require('./astro-gemini');

const app = express();

// ===== Middleware =====
app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://localhost:3000"
    ],
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

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
    const ip = req.ip || req.connection.remoteAddress;
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

// ===== Health Check =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== Create Razorpay Order =====
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency, reportType } = req.body;

        // Validate amount
        const validAmounts = [4900, 9900, 12900 ,19900];
        if (!validAmounts.includes(amount)) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const order = await razorpay.orders.create({
            amount,
            currency: currency || 'INR',
            receipt: 'ci_' + Date.now() + '_' + reportType,
            notes: { reportType: reportType }
        });

        // Store order in Supabase
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

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// ===== Verify Payment =====
app.post('/api/verify-payment', async (req, res) => {
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

        res.json({
            verified: true,
            orderId: orderData.id
        });

    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// ===== Generate Report =====
app.post('/api/generate-report', async (req, res) => {
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
        await supabase
            .from('orders')
            .update({ status: 'report_generated' })
            .eq('id', orderId);

        res.json({ report });

    } catch (err) {
        console.error('Generate report error:', err);
        res.status(500).json({ error: 'Report generation failed' });
    }
});

// ===== Fallback: Serve index.html for all non-API routes =====
app.get('*', (req, res) => {
    res.sendFile('astro-index.html', { root: 'public' });
});

// ===== Error Handler =====
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('✦ Celestial Insights server running on port ' + PORT);
    console.log('  → http://localhost:' + PORT);
});

module.exports = app;
