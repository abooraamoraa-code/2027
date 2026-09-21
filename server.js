/**
 * ============================================================================
 * PROJECT: Abu El-Izz Enterprise Agency Platform (Updated with Complex Access)
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
const rateLimit = require('express-rate-limit');

// استدعاء نظام الوصول المعقد الجديد
const { generateComplexVaultToken, complexAccessGuard } = require('./securityLayer');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'abu_el_izz_enterprise_secret_key_2026!@#';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/abu_el_izz_enterprise';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const strictLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: { error: 'تم حظر الطلبات مؤقتاً بسبب تجاوز معدل الأمان.' }
});
app.use('/api/', strictLimiter);

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('🚀 [SECURE SYSTEM ONLINE] تم الاتصال بقاعدة البيانات بنجاح.');
    console.log('👑 [MANAGED BY] إدارة وتطوير أبو العز العمري');
}).catch(err => {
    console.error('❌ [DB ERROR]:', err.message);
});

// النماذج (Schemas)
const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
    createdAt: { type: Date, default: Date.now }
});

const ProjectOrderSchema = new mongoose.Schema({
    clientName: String,
    clientEmail: String,
    projectType: String,
    budgetRange: String,
    projectDetails: String,
    status: { type: String, default: 'قيد المراجعة الفنية' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const ProjectOrder = mongoose.model('ProjectOrder', ProjectOrderSchema);

// مسار تسجيل الدخول مع توليد مفتاح الوصول المعقد للمدير
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'بيانات الدخول غير صحيحة' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'كلمة المرور غير صحيحة' });

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

        let vaultData = null;
        if (user.role === 'admin') {
            vaultData = generateComplexVaultToken(user._id, user.role);
        }

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح تحت إشراف أبو العز العمري',
            token,
            vaultAccess: vaultData, // بيانات الوصول المعقد للوحة الإدارة
            user: { name: user.fullName, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// مسار لوحة الإدارة المخفية والمحمية كلياً بطريقة الوصول المعقد (Complex Access Guard)
app.get('/api/v1/admin/secure-vault-dashboard', complexAccessGuard, async (req, res) => {
    try {
        const allOrders = await ProjectOrder.find().sort({ createdAt: -1 });
        const allUsers = await User.find().select('-password');

        res.json({
            success: true,
            securityStatus: 'Encrypted & Verified via Complex Layer',
            managedBy: 'إدارة وتطوير أبو العز العمري',
            statistics: {
                totalOrders: allOrders.length,
                totalUsers: allUsers.length
            },
            allOrders,
            allUsers
        });
    } catch (err) {
        res.status(500).json({ error: 'خطأ في جلب بيانات الخزنة الإدارية المشفرة' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[SECURE SERVER] الخادم الآمن يعمل على المنفذ ${PORT} - أبو العز العمري`);
});
