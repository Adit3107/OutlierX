import { Router, Request, Response } from 'express';
import { prisma } from '@anomalyze/database';

interface AuthenticatedRequest extends Request {
    auth?: {
        userId: string;
        sessionId?: string;
    };
}

const router = Router();

// ============================================
// Dashboard Stats
// ============================================

/**
 * @swagger
 * components:
 *   schemas:
 *     StatMetric:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           example: "1,234"
 *         change:
 *           type: string
 *           example: "+12.5%"
 *         trend:
 *           type: string
 *           enum: [up, down]
 *           example: "up"
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalTransactions:
 *           $ref: '#/components/schemas/StatMetric'
 *         anomaliesDetected:
 *           $ref: '#/components/schemas/StatMetric'
 *         systemStatus:
 *           type: object
 *           properties:
 *             value:
 *               type: string
 *               example: "99.9%"
 *             status:
 *               type: string
 *               example: "Operational"
 *     TrendPoint:
 *       type: object
 *       properties:
 *         time:
 *           type: string
 *           example: "10:00"
 *         value:
 *           type: number
 *           example: 150
 *         anomalies:
 *           type: number
 *           example: 2
 *     Anomaly:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "tx_123"
 *         user:
 *           type: string
 *           example: "user_555"
 *         score:
 *           type: number
 *           example: 0.95
 *         type:
 *           type: string
 *           example: "High Frequency"
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           example: "high"
 *         timestamp:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [Pending, Resolved]
 *     RecentActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *         description:
 *           type: string
 *         timestamp:
 *           type: string
 *         severity:
 *           type: string
 */

/**
 * @swagger
 * /analytics/stats:
 *   get:
 *     summary: Get dashboard stats overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 */
router.get('/analytics/stats', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const now = new Date();
        const range = (req.query.range as string) || '24h';
        const batchId = req.query.batchId as string;
        console.log('STATS REQUEST - BatchID:', batchId);

        // Base where clauses
        const txWhere: any = { userId };
        const anomalyWhere: any = {
            userId,
            severity: { in: ['HIGH', 'CRITICAL'] } // User Requirement: Only show HIGH and CRITICAL count
        };

        if (batchId) {
            if (batchId === 'live') {
                txWhere.source = 'REALTIME_API';
                anomalyWhere.transaction = { source: 'REALTIME_API' };
            } else {
                txWhere.batchId = batchId;
                anomalyWhere.transaction = { batchId };
            }
        } else if (range !== 'all') {
            // Time filtering
            let startDate: Date;
            switch (range) {
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '1y':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Fallback to 24h
            }
            txWhere.ingestedAt = { gte: startDate };
            anomalyWhere.detectedAt = { gte: startDate };
        }

        // Total transactions
        const totalTransactions = await prisma.transaction.count({
            where: txWhere
        });

        // Anomalies detected
        const anomaliesDetected = await prisma.anomaly.count({
            where: anomalyWhere
        });

        // Anomaly rate for anomalies card
        const anomalyRate = totalTransactions > 0
            ? (anomaliesDetected / totalTransactions * 100).toFixed(1)
            : '0';

        // Transaction growth: current week vs previous week
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const [currentWeekTx, prevWeekTx] = await Promise.all([
            prisma.transaction.count({ where: { userId, ingestedAt: { gte: sevenDaysAgo } } }),
            prisma.transaction.count({ where: { userId, ingestedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } } })
        ]);
        let txGrowth = '0';
        if (prevWeekTx > 0) {
            txGrowth = ((currentWeekTx - prevWeekTx) / prevWeekTx * 100).toFixed(0);
        } else if (currentWeekTx > 0) {
            txGrowth = '100';
        }
        const txGrowthNum = Number(txGrowth);

        res.json({
            totalTransactions: {
                value: totalTransactions.toLocaleString(),
                change: `${txGrowthNum >= 0 ? '+' : ''}${txGrowth}%`,
                trend: txGrowthNum >= 0 ? 'up' : 'down'
            },
            anomaliesDetected: {
                value: anomaliesDetected.toString(),
                change: `${anomalyRate}% rate`,
                trend: Number(anomalyRate) <= 10 ? 'up' : 'down'
            },
            systemStatus: {
                value: '99.9%',
                status: 'Operational'
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ============================================
// Trends Chart Data
// ============================================

/**
 * @swagger
 * /analytics/trends:
 *   get:
 *     summary: Get time-series trend data for charts
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *         description: Time range for trends (default 24h)
 *     responses:
 *       200:
 *         description: Array of trend points
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrendPoint'
 */
router.get('/analytics/trends', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const range = (req.query.range as string) || '24h';
        const batchId = req.query.batchId as string;

        // Determine time window and SQL truncation unit
        let hoursBack: number;
        let truncUnit: string;
        let labelFormat: string;

        switch (range) {
            case '7d':
                hoursBack = 7 * 24;
                truncUnit = 'day';
                labelFormat = 'Dy';           // Mon, Tue, Wed...
                break;
            case '30d':
                hoursBack = 30 * 24;
                truncUnit = 'day';
                labelFormat = 'MM/DD';        // 02/14
                break;
            default: // 24h
                hoursBack = 24;
                truncUnit = 'hour';
                labelFormat = 'HH24:MI';      // 14:00
        }

        const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

        // Build WHERE conditions
        let txBatchFilter = '';
        let anomalyBatchFilter = '';
        if (batchId) {
            if (batchId === 'live') {
                txBatchFilter = `AND t."source" = 'REALTIME_API'`;
                anomalyBatchFilter = `AND EXISTS (
                    SELECT 1 FROM transactions t2
                    WHERE t2.id = a."transactionId"
                    AND t2."source" = 'REALTIME_API'
                )`;
            } else {
                txBatchFilter = `AND t."batchId" = '${batchId}'`;
                anomalyBatchFilter = `AND EXISTS (
                    SELECT 1 FROM transactions t2
                    WHERE t2.id = a."transactionId"
                    AND t2."batchId" = '${batchId}'
                )`;
            }
        }

        // Single query: generate time buckets, left-join transactions and anomalies
        const result = await prisma.$queryRawUnsafe(`
            WITH buckets AS (
                SELECT generate_series(
                    date_trunc('${truncUnit}', $1::timestamptz),
                    date_trunc('${truncUnit}', NOW()),
                    '1 ${truncUnit}'::interval
                ) AS bucket
            ),
            tx_counts AS (
                SELECT date_trunc('${truncUnit}', t."ingestedAt") AS bucket, COUNT(*) AS cnt
                FROM transactions t
                WHERE t."userId" = $2
                AND t."ingestedAt" >= $1
                ${txBatchFilter}
                GROUP BY 1
            ),
            anomaly_counts AS (
                SELECT date_trunc('${truncUnit}', t."ingestedAt") AS bucket, COUNT(*) AS cnt
                FROM anomalies a
                JOIN transactions t ON t.id = a."transactionId"
                WHERE a."userId" = $2
                AND t."ingestedAt" >= $1
                ${anomalyBatchFilter}
                GROUP BY 1
            )
            SELECT
                b.bucket AS "timestamp",
                to_char(b.bucket, '${labelFormat}') AS "label",
                COALESCE(tc.cnt, 0)::int AS "transactions",
                COALESCE(ac.cnt, 0)::int AS "anomalies"
            FROM buckets b
            LEFT JOIN tx_counts tc ON tc.bucket = b.bucket
            LEFT JOIN anomaly_counts ac ON ac.bucket = b.bucket
            ORDER BY b.bucket
        `, startDate, userId) as { timestamp: Date; label: string; transactions: number; anomalies: number }[];

        const finalData = result.map(r => ({
            time: r.label,
            value: Number(r.transactions),
            anomalies: Number(r.anomalies),
            timestamp: r.timestamp
        }));

        res.json(finalData);
    } catch (error) {
        console.error('Error fetching trends:', error);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});

// ============================================
// Recent Activity
// ============================================

/**
 * @swagger
 * /analytics/activity/recent:
 *   get:
 *     summary: Get recent anomaly activity
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent activities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RecentActivity'
 */
router.get('/analytics/activity/recent', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const recentAnomalies = await prisma.anomaly.findMany({
            where: { userId: userId },
            take: 10,
            orderBy: { detectedAt: 'desc' },
            include: {
                transaction: true
            }
        });

        const activity = recentAnomalies.map(a => ({
            id: a.id,
            type: (a.ruleViolations && a.ruleViolations.length > 0) ? a.ruleViolations[0] : 'ML Anomaly',
            description: a.explanation ? a.explanation.substring(0, 100) : 'Suspicious activity detected',
            timestamp: a.detectedAt.toISOString(),
            severity: a.severity
        }));

        res.json(activity);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

// ============================================
// Real-Time SSE Feed
// ============================================

/**
 * @swagger
 * /events/anomalies:
 *   get:
 *     summary: Real-time SSE stream for anomalies
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     description: Server-Sent Events endpoint. Connect with EventSource.
 */
router.get('/events/anomalies', (req: AuthenticatedRequest, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Subscribe to SSE
    // Requires verified sse.service.ts subscribe(req, res, userId)
    import('../services/sse.service').then(({ sseManager }) => {
        sseManager.subscribe(req, res, userId);
    });
});


// ============================================
// Anomalies List
// ============================================

/**
 * @swagger
 * /anomalies:
 *   get:
 *     summary: List anomalies with pagination and filtering
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by severity
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by Transaction ID or User ID
 *     responses:
 *       200:
 *         description: Paginated anomalies list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Anomaly'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/anomalies', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId || req.query.userId as string;
        if (!userId) {
            console.log('Unauthorized request to /anomalies: Missing userId');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
        const filter = req.query.filter as string;
        const status = req.query.status as string; // 'Resolved' or 'Pending'
        const search = req.query.search as string;

        const batchId = req.query.batchId as string;

        const where: any = { userId: userId };

        // Batch Filter
        if (batchId) {
            if (batchId === 'live') {
                where.transaction = { source: 'REALTIME_API' };
            } else {
                where.transaction = { batchId: batchId };
            }
        }

        // Severity filter
        if (filter && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(filter.toUpperCase())) {
            where.severity = filter.toUpperCase();
        }

        // Status filter
        if (status === 'Resolved') {
            where.isFalsePositive = true;
        } else if (status === 'Pending') {
            where.isFalsePositive = false;
        }

        // Search by transaction ID
        if (search) {
            // Merge with existing transaction filter if any
            where.transaction = {
                ...(where.transaction || {}),
                OR: [
                    { txId: { contains: search, mode: 'insensitive' } },
                    { merchant: { contains: search, mode: 'insensitive' } }
                ]
            };
        }

        console.log('--- DEBUG ANOMALIES ---');
        console.log('User:', userId);
        console.log('Batch:', batchId);
        console.log('Where:', JSON.stringify(where, null, 2));

        const [total, anomalies] = await Promise.all([
            prisma.anomaly.count({ where }),
            prisma.anomaly.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { detectedAt: 'desc' },
                include: {
                    transaction: true
                }
            })
        ]);

        const data = anomalies.map(a => ({
            id: a.id,
            displayId: a.transaction?.txId || a.id.substring(0, 8),
            user: a.userId,
            score: a.score,
            type: a.ruleViolations[0] || 'ML Detection',
            severity: a.severity.toLowerCase(),
            timestamp: a.detectedAt.toISOString(),
            status: a.isFalsePositive ? 'Resolved' : 'Pending',
            merchant: a.transaction?.merchant || 'N/A',
            amount: a.transaction?.amount ? Number(a.transaction.amount) : 0,
            currency: a.transaction?.currency || 'USD',
            explanation: a.explanation || 'No details available'
        }));

        res.json({
            data,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching anomalies:', error);
        res.status(500).json({ error: 'Failed to fetch anomalies' });
    }
});

// ============================================
// Resolve Anomaly
// ============================================

/**
 * @swagger
 * /anomalies/{id}:
 *   patch:
 *     summary: Update anomaly status (Resolve/Feedback)
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFalsePositive:
 *                 type: boolean
 *               feedbackNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Anomaly updated
 */
router.patch('/anomalies/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        const { isFalsePositive, feedbackReason, feedbackNotes } = req.body;

        const anomaly = await prisma.anomaly.findUnique({
            where: { id }
        });

        if (!anomaly) {
            return res.status(404).json({ error: 'Anomaly not found' });
        }

        if (anomaly.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Encode structured reason + optional notes into feedbackNotes
        // Format: "[REASON_CODE] optional notes text"
        let combinedNotes = anomaly.feedbackNotes;
        if (feedbackReason || feedbackNotes !== undefined) {
            const parts: string[] = [];
            if (feedbackReason) parts.push(`[${feedbackReason}]`);
            if (feedbackNotes) parts.push(feedbackNotes);
            combinedNotes = parts.join(' ') || null;
        }

        const updated = await prisma.anomaly.update({
            where: { id },
            data: {
                isFalsePositive: isFalsePositive !== undefined ? isFalsePositive : anomaly.isFalsePositive,
                feedbackNotes: combinedNotes,
                feedbackAt: new Date()
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating anomaly:', error);
        res.status(500).json({ error: 'Failed to update anomaly' });
    }
});


// ============================================
// Export Anomalies
// ============================================

/**
 * @swagger
 * /anomalies/export:
 *   get:
 *     summary: Export anomalies as CSV
 */
router.get('/anomalies/export', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const anomalies = await prisma.anomaly.findMany({
            where: { userId },
            orderBy: { detectedAt: 'desc' },
            include: { transaction: true },
            take: 10000 // Limit export to 10k records
        });

        // Generate CSV
        const headers = ['ID', 'User', 'Score', 'Severity', 'Type', 'Timestamp', 'Amount', 'Merchant'];
        const rows = anomalies.map(a => [
            a.transaction?.txId || a.id,
            a.userId,
            a.score.toFixed(2),
            a.severity,
            a.ruleViolations.join(';'),
            a.detectedAt.toISOString(),
            a.transaction?.amount.toString() || '',
            a.transaction?.merchant || ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=anomalies.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting anomalies:', error);
        res.status(500).json({ error: 'Failed to export anomalies' });
    }
});

// ============================================
// Global Search
// ============================================

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Global search across users, transactions, anomalies
 *     parameters:
 *       - in: query
 *         name: q
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const query = (req.query.q as string) || '';

        if (query.length < 2) {
            return res.json({ users: [], transactions: [], anomalies: [] });
        }

        const [users, transactions, anomalies] = await Promise.all([
            prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: query, mode: 'insensitive' } },
                        { name: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, email: true }
            }),
            prisma.transaction.findMany({
                where: {
                    OR: [
                        { txId: { contains: query, mode: 'insensitive' } },
                        { merchant: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, txId: true, amount: true, merchant: true }
            }),
            prisma.anomaly.findMany({
                where: {
                    OR: [
                        { userId: { contains: query, mode: 'insensitive' } },
                        { explanation: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, severity: true, ruleViolations: true }
            })
        ]);

        res.json({
            users: users.map(u => ({ id: u.id, name: u.name || u.email })),
            transactions: transactions.map(t => ({ id: t.txId, amount: Number(t.amount) })),
            anomalies: anomalies.map(a => ({ id: a.id, type: a.ruleViolations[0] || 'Unknown' }))
        });
    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
