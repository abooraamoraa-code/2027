/**
 * ============================================================================
 * MODULE: Advanced Anti-Hacker Firewall & Threat Neutralizer
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

'use strict';

const crypto = require('crypto');

// ذاكرة مؤقتة لرصد عناوين الـ IP المشبوهة وحظرها تلقائياً عند تكرار المحاولات الهجومية
const suspiciousIPs = new Map();
const BLOCKED_DURATION = 30 * 60 * 1000; // حظر لمدة 30 دقيقة للمخترقين

/**
 * فحص وتطهير المدخلات لمنع هجمات حقن قواعد البيانات (NoSQL / SQL Injection)
 */
function sanitizeInput(data) {
    if (typeof data === 'string') {
        // إزالة رموز الحقن الخطرة وتطهير النصوص
        return data.replace(/[$<>(){}[\];'"]/g, '');
    }
    if (typeof data === 'object' && data !== null) {
        for (let key of Object.keys(data)) {
            // منع الـ Operators الخبيثة في MongoDB مثل $gt, $ne,$where
            if (key.startsWith('$')) {
                delete data[key];
            } else {
                data[key] = sanitizeInput(data[key]);
            }
        }
    }
    return data;
}

/**
 * الدرع الأمني الرئيسي لفحص طلبات HTTP وتصد هجمات الهكرز
 */
const antiHackerShield = (req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();

    // 1. التحقق من وجود الحظر النشط للـ IP المشبوه
    if (suspiciousIPs.has(clientIP)) {
        const blockInfo = suspiciousIPs.get(clientIP);
        if (now < blockInfo.expiresAt) {
            return res.status(403).json({
                error: 'تم حظر عنوان بروتوكول الإنترنت الخاص بك لدواعٍ أمنية بسبب رصد أنشطة هجومية.',
                managedBy: 'إدارة وتطوير أبو العز العمري'
            });
        } else {
            suspiciousIPs.delete(clientIP);
        }
    }

    // 2. فحص الهجمات عبر User-Agent المشبوهة أو أدوات الفحص الهجومي (مثل Nikto, Sqlmap, BurpSuite)
    const userAgent = req.headers['user-agent'] || '';
    const hostileScanners = ['sqlmap', 'nikto', 'burpsuite', 'nmap', 'masscan', 'acunetix'];
    const isHostile = hostileScanners.some(scanner => userAgent.toLowerCase().includes(scanner));

    if (isHostile) {
        suspiciousIPs.set(clientIP, { expiresAt: now + BLOCKED_DURATION });
        return res.status(403).json({ error: 'تم رصد توقيع أداة فحص هجومي، وتم إدراجك في القائمة السوداء.' });
    }

    // 3. تطهير البيانات الواردة في الـ Body والـ Query تلقائياً
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }

    // 4. وضع بصمة أمنية رقمية للطلب للتأكد من سلامة العبور
    req.securityShieldStamp = crypto.createHash('sha256').update(clientIP + now).digest('hex').substring(0, 16);

    next();
};

/**
 * دُعابة أمان إضافية لتسجيل محاولات الاختراق الفاشلة في السجلات
 */
const logSecurityThreat = (req, threatType) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.warn(`🚨 [SECURITY ALERT] نوع التهديد: ${threatType} | المصدر IP: ${clientIP} | الوقت: ${new Date().toISOString()}`);
    console.warn(`👑 [MANAGED BY] إدارة وتطوير أبو العز العمري`);
};

module.exports = {
    antiHackerShield,
    logSecurityThreat
};
