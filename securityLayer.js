/**
 * ============================================================================
 * MODULE: Complex Security Access Layer & Cryptographic Verification
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET_ACCESS_PASSPHRASE = process.env.COMPLEX_ACCESS_SECRET || 'abu_el_izz_ultra_secure_vault_99887766!#$';

/**
 * نظام توليد توقيع تشفيري معقد للوصول للعمليات الحساسة
 */
function generateComplexVaultToken(userId, userRole) {
    const payload = {
        id: userId,
        role: userRole,
        nonce: crypto.randomBytes(32).toString('hex'),
        issuedAt: Date.now()
    };
    
    // تشفير إضافي عبر HMAC-SHA256
    const hmacSignature = crypto
        .createHmac('sha256', SECRET_ACCESS_PASSPHRASE)
        .update(JSON.stringify(payload))
        .digest('hex');

    return {
        vaultToken: Buffer.from(JSON.stringify(payload)).toString('base64'),
        signature: hmacSignature
    };
}

/**
 * ميدلوير (Middleware) للتحقق المعقد من الوصول للوحة الإدارة والصفحات المخفية
 */
const complexAccessGuard = (req, res, next) => {
    try {
        const clientVaultToken = req.headers['x-vault-token'];
        const clientSignature = req.headers['x-vault-signature'];
        const adminPasscode = req.headers['x-admin-passcode'];

        // 1. التحقق من وجود الترويسات الأمنية المعقدة
        if (!clientVaultToken || !clientSignature) {
            return res.status(403).json({
                error: 'رفض الوصول الأمني: بيانات التوثيق المعقدة مفقودة أو غير مكتملة.',
                managedBy: 'إدارة وتطوير أبو العز العمري'
            });
        }

        // 2. فك التشفير والتحقق من التوقيع الرقمي
        const decryptedPayload = JSON.parse(Buffer.from(clientVaultToken, 'base64').toString('utf8'));
        
        const expectedSignature = crypto
            .createHmac('sha256', SECRET_ACCESS_PASSPHRASE)
            .update(JSON.stringify(decryptedPayload))
            .digest('hex');

        if (clientSignature !== expectedSignature) {
            return res.status(401).json({ error: 'خطأ أمني: فشل مطابقة التوقيع التشفيري للوصول.' });
        }

        // 3. التحقق من صلاحيات المدير المتقدمة
        if (decryptedPayload.role !== 'admin') {
            return res.status(403).json({ error: 'صلاحيات غير كافية: هذا المسار مخصص للمدير الرئيسي فقط.' });
        }

        // 4. التحقق من مفتاح المرور الإضافي (Passcode Layer)
        if (adminPasscode !== (process.env.ADMIN_VAULT_PASS || 'ELIZZ_MASTER_2026')) {
            return res.status(401).json({ error: 'مفتاح المرور السري للوحة الإدارة غير صحيح.' });
        }

        req.secureVaultData = decryptedPayload;
        next();

    } catch (err) {
        console.error('Security Layer Error:', err);
        return res.status(500).json({ error: 'حدث خطأ فادح في معالجة طبقة الأمان المعقدة.' });
    }
};

module.exports = {
    generateComplexVaultToken,
    complexAccessGuard
};
