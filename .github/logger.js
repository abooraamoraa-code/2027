/**
 * ============================================================================
 * MODULE: Enterprise Activity & Error Audit Logger
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

'use strict';

const fs = require('fs');
const path = require('path');

// التأكد من وجود مجلد السجلات
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * دالة مركزية لتسجيل الأحداث والعمليات داخل المنصة
 */
const logEvent = (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase}] ${message} | Meta: ${JSON.stringify(meta)} | ManagedBy: إدارة وتطوير أبو العز العمري\n`;
    
    console.log(logEntry.trim());

    const logFileName = level.toLowerCase() === 'error' ? 'error.log' : 'activity.log';
    fs.appendFile(path.join(logsDir, logFileName), logEntry, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
};

module.exports = {
    logInfo: (msg, meta) => logEvent('INFO', msg, meta),
    logError: (msg, meta) => logEvent('ERROR', msg, meta),
    logWarning: (msg, meta) => logEvent('WARNING', msg, meta)
};
