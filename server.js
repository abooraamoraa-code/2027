/**
 * ============================================================================
 * PROJECT: Abu El-Izz Enterprise Agency Platform
 * CORE BACKEND SERVER & SECURITY ENGINE
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'abu_el_izz_super_secure_enterprise_key_998877!@#';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/abu_el_izz_enterprise';

// --- [1] إعدادات الحماية والأمان المتقدمة (Security Middleware) ---
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// حماية ضد هجمات الاختراق المتكررة (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // حد أقصى 100 طلب لكل ئب
    message: { error: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً.' }
});
app.use('/api/', limiter);

// --- [2] الاتصال بقاعدة البيانات (MongoDB Connection) ---
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('====================================================');
    console.log('🚀 [DATABASE CONNECTED] تم الاتصال بقاعدة البيانات بنجاح.');
    console.log('👑 [AUTHOR] إدارة وتطوير: أبو العز العمري');
    console.log('====================================================');
}).catch(err => {
    console.error('❌ [DATABASE ERROR] فشل الاتصال بقاعدة البيانات:', err.message);
    process.exit(1);
});

// --- [3] هيكل قواعد البيانات (Database Schemas & Models) ---

// مخطط المستخدمين والعملاء والمشرفين
const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin', 'moderator'], default: 'client' },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// مخطط طلبات تصميم المواقع والشركات (القسم الرئيسي للعمل)
const ProjectOrderSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    companyName: { type: String },
    projectType: { type: String, required: true }, // e.g., E-commerce, Corporate, Custom Web App
    budgetRange: { type: String, required: true },
    projectDetails: { type: String, required: true },
    status: { type: String, enum: ['قيد المراجعة', 'قيد التنفيذ', 'مكتملة', 'ملغاة'], default: 'قيد المراجعة' },
    assignedDeveloper: { type: String, default: 'فريق أبو العز العمري' },
    createdAt: { type: Date, default: Date.now }
});

// مخطط السجلات الأمنية (Audit Logs)
const SecurityLogSchema = new mongoose.Schema({
    action: String,
    performedBy: String,
    ipAddress: String,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const ProjectOrder = mongoose.model('ProjectOrder', ProjectOrderSchema);
const SecurityLog = mongoose.model('SecurityLog', SecurityLogSchema);

// --- [4] نظام التحقق من الصلاحيات والتوكن (Authentication Middleware) ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'مرفوض: لا يوجد رمز مصادقة (Token)' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'مرفوض: صيغة التوكن غير صحيحة' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'انتهت صلاحية الجلسة أو التوكن غير صالح' });
        req.user = decoded;
        next();
    });
};

// نظام التحقق من صلاحيات المدير (Admin Only)
const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'وصول مرفوض: هذه المنطقة خاصة بلوحة إدارة أبو العز العمري فقط' });
        }
        next();
    });
};

// --- [5] المسارات البرمجية للـ API (API Endpoints) ---

// مسار الترحيب التجريبي بالمنظومة
app.get('/api/v1/status', (req, res) => {
    res.json({
        system: 'Abu El-Izz Enterprise Platform',
        version: '2.5.0',
        status: 'Online & Secured',
        managedBy: 'إدارة وتطوير أبو العز العمري',
        timestamp: new Date()
    });
});

// 1. مسار تسجيل مستخدم جديد
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ error: 'يرجى تعبئة كافة الحقول المطلوبة' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'البريد الإلكتروني غير صالح' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً في النظام' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role: email.includes('admin') ? 'admin' : 'client' // ترقية تلقائية إذا احتوى البريد على admin
        });

        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح تحت إشراف أبو العز العمري',
            token,
            user: { name: newUser.fullName, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'خطأ داخلي في الخادم أثناء التسجيل' });
    }
});

// 2. مسار تسجيل الدخول الآمن
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'بيانات الدخول غير صحيحة' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            token,
            user: { name: user.fullName, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'خطأ داخلي في خادم المصادقة' });
    }
});

// 3. مسار إرسال طلب تصميم موقع جديد (استقبال طلبات العملاء)
app.post('/api/v1/orders/submit', verifyToken, async (req, res) => {
    try {
        const { clientName, clientEmail, companyName, projectType, budgetRange, projectDetails } = req.body;

        if (!projectType || !budgetRange || !projectDetails) {
            return res.status(400).json({ error: 'يرجى ملء جميع تفاصيل المشروع الأساسية' });
        }

        const newOrder = new ProjectOrder({
            clientName: clientName || req.user.email,
            clientEmail: clientEmail || req.user.email,
            companyName,
            projectType,
            budgetRange,
            projectDetails,
            status: 'قيد المراجعة'
        });

        await newOrder.save();

        res.status(201).json({
            success: true,
            message: 'تم استقبال طلبك بنجاح وسيتواصل معك فريق إدارة أبو العز العمري قريباً جداً.',
            orderId: newOrder._id
        });

    } catch (error) {
        console.error('Order Submission Error:', error);
        res.status(500).json({ error: 'فشل في حفظ الطلب بقاعدة البيانات' });
    }
});

// 4. مسار لوحة الإدارة المخفية (جلب كافة الطلبات والإحصائيات - خاص بالمدير فقط)
app.get('/api/v1/admin/dashboard-data', verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await ProjectOrder.countDocuments();
        const recentOrders = await ProjectOrder.find().sort({ createdAt: -1 }).limit(20);
        const allUsers = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            platformInfo: {
                title: 'لوحة الإدارة المركزية - أبو العز العمري',
                serverTime: new Date(),
                totalUsers,
                totalOrders
            },
            recentOrders,
            allUsers
        });

    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ error: 'خطأ في جلب بيانات لوحة الإدارة المشددة' });
    }
});

// --- [6] تشغيل الخادم والبدء ---
app.listen(PORT, () => {
    console.log(`[SERVER RUNNING] الخادم يعمل بكامل طاقة الأمان على المنفذ: ${PORT}`);
    console.log(`[MANAGEMENT] منصة الشركات والمشاريع تحت إشراف: أبو العز العمري`);
});
