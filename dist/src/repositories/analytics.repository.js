"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRepository = exports.AnalyticsRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class AnalyticsRepository {
    async getUserSummary(userId) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const [taskStats, focusAgg, scoreAgg, activeProjects, tasksCompletedThisWeek, focusSessionsThisWeek,] = await prisma_1.default.$transaction([
            prisma_1.default.task.groupBy({
                by: ['status'],
                where: { assignedToId: userId },
                _count: { _all: true },
            }),
            prisma_1.default.focusSession.aggregate({
                where: { userId },
                _sum: { durationMinutes: true },
                _avg: { durationMinutes: true },
            }),
            prisma_1.default.productivityActivity.aggregate({
                where: { userId },
                _sum: { scoreImpact: true },
            }),
            prisma_1.default.projectMember.count({ where: { userId, project: { status: 'ACTIVE' } } }),
            prisma_1.default.task.count({
                where: {
                    assignedToId: userId,
                    status: 'DONE',
                    updatedAt: { gte: weekStart },
                },
            }),
            prisma_1.default.focusSession.count({
                where: { userId, completedAt: { gte: weekStart } },
            }),
        ]);
        const totalTasks = taskStats.reduce((s, g) => s + g._count._all, 0);
        const completedTasks = taskStats.find((g) => g.status === 'DONE')?._count._all ?? 0;
        const inProgressTasks = taskStats.find((g) => g.status === 'IN_PROGRESS')?._count._all ?? 0;
        return {
            userId,
            totalTasks,
            completedTasks,
            inProgressTasks,
            totalFocusMinutes: focusAgg._sum.durationMinutes ?? 0,
            averageFocusMinutes: focusAgg._avg.durationMinutes ?? 0,
            totalProductivityScore: scoreAgg._sum.scoreImpact ?? 0,
            activeProjects,
            tasksCompletedThisWeek,
            focusSessionsThisWeek,
        };
    }
    async getDailyProductivity(userId, from, to) {
        const [activities, focusSessions, tasksCompleted] = await prisma_1.default.$transaction([
            prisma_1.default.productivityActivity.findMany({
                where: { userId, createdAt: { gte: from, lte: to } },
                select: { scoreImpact: true, createdAt: true },
            }),
            prisma_1.default.focusSession.findMany({
                where: { userId, completedAt: { gte: from, lte: to } },
                select: { durationMinutes: true, completedAt: true },
            }),
            prisma_1.default.task.findMany({
                where: { assignedToId: userId, status: 'DONE', updatedAt: { gte: from, lte: to } },
                select: { updatedAt: true },
            }),
        ]);
        // Build a day-keyed map
        const dayMap = new Map();
        const getDay = (d) => d.toISOString().split('T')[0];
        for (const a of activities) {
            const day = getDay(a.createdAt);
            const entry = dayMap.get(day) ?? { date: day, score: 0, focusMinutes: 0, tasksCompleted: 0 };
            entry.score += a.scoreImpact;
            dayMap.set(day, entry);
        }
        for (const f of focusSessions) {
            const day = getDay(f.completedAt);
            const entry = dayMap.get(day) ?? { date: day, score: 0, focusMinutes: 0, tasksCompleted: 0 };
            entry.focusMinutes += f.durationMinutes;
            dayMap.set(day, entry);
        }
        for (const t of tasksCompleted) {
            const day = getDay(t.updatedAt);
            const entry = dayMap.get(day) ?? { date: day, score: 0, focusMinutes: 0, tasksCompleted: 0 };
            entry.tasksCompleted += 1;
            dayMap.set(day, entry);
        }
        return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
}
exports.AnalyticsRepository = AnalyticsRepository;
exports.analyticsRepository = new AnalyticsRepository();
//# sourceMappingURL=analytics.repository.js.map