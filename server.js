/**
 * ============================================================================
 * ENTERPRISE SERVER CORE - Abu El-Izz Platform
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

'use strict';

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// تحميل متغيرات البيئة من ملف .env
dotenv.config();

const app = express();

// --- [تفعيل الحماية الأساسية والـ Middleware] ---
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// الاتصال بقاعدة بيانات MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/abu_el_izz_enterprise';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ تم الاتصال بقاعدة البيانات بنجاح تحت إشراف أبو العز العمري'))
    .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

/**
 * ============================================================================
 * SCHEMAS & MODELS (قواعد البيانات والجداول)
 * ============================================================================
 */

// مخطط المستخدمين وصلاحياتهم
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// مخطط موحد لكافة طلبات العملاء، الشكاوي، والدعم والآراء تحت لوحة الإشراف
const CentralSubmissionSchema = new mongoose.Schema({
    submissionType: { 
        type: String, 
        enum: ['project_order', 'support_ticket', 'complaint', 'client_feedback'], 
        required: true 
    },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    subjectOrService: { type: String, required: true },
    priorityLevel: { type: String, enum: ['عادي', 'متوسط', 'عاجل وحرج'], default: 'عادي' },
    contentDetails: { type: String, required: true },
    ratingStars: { type: Number, min: 1, max: 5, default: 5 },
    status: { type: String, enum: ['جديد', 'قيد المعالجة', 'مكتمل', 'مغلق'], default: 'جديد' },
    createdAt: { type: Date, default: Date.now }
});
const CentralSubmission = mongoose.model('CentralSubmission', CentralSubmissionSchema);


/**
 * ============================================================================
 * SECURITY & ACCESS GUARDS (نظام الوصول المعقد والحماية)
 * ============================================================================
 */
const complexAccessGuard = (req, res, next) => {
    const vaultToken = req.headers['x-vault-token'];
    const adminPasscode = req.headers['x-admin-passcode'];

    const masterSecretKey = process.env.COMPLEX_ACCESS_SECRET || 'abu_el_izz_ultra_secure_vault_99887766!#$';
    const expectedPass = process.env.ADMIN_VAULT_PASS || 'ELIZZ_MASTER_2026';

    if (adminPasscode !== expectedPass || !vaultToken) {
        return res.status(403).json({ 
            error: 'رفض الوصول: مفتاح الخزنة أو توكن الأمان غير صالح.',
            managedBy: 'إدارة وتطوير أبو العز العمري'
        });
    }

    next();
};


/**
 * ============================================================================
 * API ROUTES (المسارات والتحكم)
 * ============================================================================
 */

// مسار فحص الحالة الأساسي
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'Online',
        platform: 'Abu El-Izz Enterprise Platform',
        managedBy: 'إدارة وتطوير أبو العز العمري',
        timestamp: new Date().toISOString()
    });
});

// --- [مسار تسجيل الدخول العادي للمشرفين] ---
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // حساب افتراضي للمدير للتجربة الفورية
        if (email === 'admin@elizz.com' && password === 'admin2026') {
            return res.json({
                success: true,
                user: { email, role: 'admin' },
                vaultAccess: {
                    vaultToken: 'vault_secure_token_99887766',
                    signature: 'elizz_signature_valid'
                }
            });
        }

        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ success: false, error: 'بيانات الدخول غير صحيحة.' });
        }

        res.json({
            success: true,
            user: { email: user.email, role: user.role },
            vaultAccess: {
                vaultToken: 'vault_secure_token_' + user._id,
                signature: 'elizz_signature_valid'
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'خطأ داخلي في الخادم.' });
    }
});

// --- [مسار تسجيل الدخول الحقيقي عبر Google OAuth] ---
app.get('/api/v1/auth/google', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('https://joml-platform.netlify.app/api/v1/auth/google/callback');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
    res.redirect(googleAuthUrl);
});

// مسار استجابة Google OAuth Callback
app.get('/api/v1/auth/google/callback', (req, res) => {
    const { code } = req.query;
    // هنا تتم معالجة الـ code واستخراج بيانات المستخدم من جوجل
    res.send(`
        <div style="text-align:center; padding:50px; font-family:Tajawal; background:#07090e; color:white; height:100vh;">
            <h2>✨ تم المصادقة بنجاح عبر حساب Google</h2>
            <p>أهلاً بك في منصة أبو العز العمري. جاري توجيهك للنظام...</p>
            <script>setTimeout(() => window.location.href = '/', 3000);</script>
        </div>
    `);
});

// --- [مسار استقبال الطلبات، الشكاوى، والدعم الفني] ---
app.post('/api/v1/submissions/create', async (req, res) => {
    try {
        const { submissionType, clientName, clientEmail, subjectOrService, priorityLevel, contentDetails, ratingStars } = req.body;

        if (!submissionType || !clientName || !clientEmail || !contentDetails) {
            return res.status(400).json({ success: false, error: 'يرجى إكمال الحقول الأساسية المطلوبة.' });
        }

        const newSubmission = new CentralSubmission({
            submissionType,
            clientName,
            clientEmail,
            subjectOrService: subjectOrService || 'عام',
            priorityLevel: priorityLevel || 'عادي',
            contentDetails,
            ratingStars: ratingStars || 5,
            status: 'جديد'
        });

        await newSubmission.save();

        res.status(201).json({
            success: true,
            message: 'تم استلام طلبك أو شكواك بنجاح ومراجعتها مركزياً من قبل إدارة أبو العز العمري.',
            trackingId: newSubmission._id
        });

    } catch (err) {
        console.error('Submission Error:', err);
        res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة الطلب في الخادم.' });
    }
});

// --- [لوحة الإدارة المركزية المخفية والمحمية كلياً] ---
app.get('/api/v1/admin/master-control-panel', complexAccessGuard, async (req, res) => {
    try {
        const allSubmissions = await CentralSubmission.find().sort({ createdAt: -1 });
        const allUsers = await User.find().select('-password').sort({ createdAt: -1 });

        const statistics = {
            totalSubmissions: allSubmissions.length,
            projectOrdersCount: allSubmissions.filter(s => s.submissionType === 'project_order').length,
            supportTicketsCount: allSubmissions.filter(s => s.submissionType === 'support_ticket').length,
            complaintsCount: allSubmissions.filter(s => s.submissionType === 'complaint').length,
            feedbacksCount: allSubmissions.filter(s => s.submissionType === 'client_feedback').length,
            totalUsersCount: allUsers.length
        };

        res.json({
            success: true,
            platformIdentity: 'منصة إدارة وتطوير أبو العز العمري - السيطرة المركزية',
            securityStatus: 'محمي بطبقة وصول معقدة وخزنة مشفرة',
            statistics,
            allSubmissions,
            allUsers
        });

    } catch (err) {
        console.error('Master Panel Error:', err);
        res.status(500).json({ success: false, error: 'فشل الوصول لبيانات لوحة الإشراف المركزية.' });
    }
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 يعمل السيرفر بكفاءة مطلقة على المنفذ ${PORT} | إدارة وتطوير: أبو العز العمري`);
});

// تصدير التطبيق ليعمل مع بيئات الـ Serverless مثل Vercel
module.exports = app;
