/**
 * ============================================================================
 * MODULE: Centralized Submissions & Support Schema (Orders, Feedback, Complaints)
 * إدارة وتطوير: أبو العز العمري
 * ============================================================================
 */

// مخطط موحد لكافة طلبات العملاء، الشكاوي، الدعم والآراء تحت لوحة الإشراف
const CentralSubmissionSchema = new mongoose.Schema({
    submissionType: { 
        type: String, 
        enum: ['project_order', 'support_ticket', 'complaint', 'client_feedback'], 
        required: true 
    },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    subjectOrService: { type: String, required: true }, // نوع المشروع أو عنوان الشكاوي
    priorityLevel: { type: String, enum: ['عادي', 'متوسط', 'عاجل وحرج'], default: 'عادي' },
    contentDetails: { type: String, required: true }, // نص الطلب أو الشكوى أو الرأي
    ratingStars: { type: Number, min: 1, max: 5, default: 5 }, // مخصص للآراء والتقييمات
    status: { type: String, enum: ['جديد', 'قيد المعالجة', 'مكتمل', 'مغلق'], default: 'جديد' },
    adminInternalNotes: { type: String, default: '' }, // ملاحظات خاصة بالمشرفين
    createdAt: { type: Date, default: Date.now }
});

const CentralSubmission = mongoose.model('CentralSubmission', CentralSubmissionSchema);

// --- [مسار موحد لاستقبال أي طلب، شكوى، أو دعم فني من الواجهة] ---
app.post('/api/v1/submissions/create', async (req, res) => {
    try {
        const { submissionType, clientName, clientEmail, subjectOrService, priorityLevel, contentDetails, ratingStars } = req.body;

        if (!submissionType || !clientName || !clientEmail || !contentDetails) {
            return res.status(400).json({ error: 'يرجى إكمال الحقول الأساسية المطلوبة للارسال.' });
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
        res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب في الخادم.' });
    }
});

// --- [مسار لوحة الإدارة المخفية والمحمية لعرض وإدارة كافة المدخلات والشكاوى مركزياً] ---
app.get('/api/v1/admin/master-control-panel', complexAccessGuard, async (req, res) => {
    try {
        // جلب كافة المدخلات مصنفة
        const allSubmissions = await CentralSubmission.find().sort({ createdAt: -1 });
        const allUsers = await User.find().select('-password').sort({ createdAt: -1 });

        // تصفية سريعة للإحصائيات تحت لوحة الإشراف
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
            allSubmissions, // يحتوي على كل الطلبات، الشكاوي، الدعم، والآراء
            allUsers
        });

    } catch (err) {
        console.error('Master Panel Error:', err);
        res.status(500).json({ error: 'فشل الوصول لبيانات لوحة الإشراف المركزية.' });
    }
});
