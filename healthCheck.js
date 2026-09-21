/**
 * ============================================================================
 * MODULE: Automated System Health Check & Diagnostics
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

'use strict';

const mongoose = require('mongoose');

/**
 * دالة فحص مؤشرات الأداء الحيوية للنظام
 */
const performSystemHealthCheck = async () => {
    const healthStatus = {
        timestamp: new Date().toISOString(),
        serviceName: 'Abu El-Izz Enterprise Core',
        managedBy: 'إدارة وتطوير أبو العز العمري',
        uptimeSeconds: process.uptime(),
        memoryUsage: process.memoryUsage(),
        databaseStatus: 'Disconnected'
    };

    // فحص حالة قاعدة البيانات
    try {
        const dbState = mongoose.connection.readyState;
        // 1 = متصل بنجاح
        if (dbState === 1) {
            healthStatus.databaseStatus = 'Online & Stable';
        } else {
            healthStatus.databaseStatus = 'Degraded / Reconnecting';
        }
    } catch (err) {
        healthStatus.databaseStatus = `Error: ${err.message}`;
    }

    return healthStatus;
};

module.exports = {
    performSystemHealthCheck
};
