import prisma from '../config/prisma';

export interface AnalyticsSummary {
  userId: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalFocusMinutes: number;
  averageFocusMinutes: number;
  totalProductivityScore: number;
  activeProjects: number;
  tasksCompletedThisWeek: number;
  focusSessionsThisWeek: number;
}

export interface DailyProductivityEntry {
  date: string;
  score: number;
  focusMinutes: number;
  tasksCompleted: number;
}

export class AnalyticsRepository {
  async getUserSummary(userId: string): Promise<AnalyticsSummary> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // groupBy cannot be mixed with aggregate in $transaction in Prisma v5 — run separately
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { assignedToId: userId },
      _count: true,          // Prisma v5: _count: true, not { _all: true }
      orderBy: { _count: { status: 'desc' } },
    });

    const [
      focusAgg,
      scoreAgg,
      activeProjects,
      tasksCompletedThisWeek,
      focusSessionsThisWeek,
    ] = await prisma.$transaction([
      prisma.focusSession.aggregate({
        where: { userId },
        _sum: { durationMinutes: true },
        _avg: { durationMinutes: true },
      }),
      prisma.productivityActivity.aggregate({
        where: { userId },
        _sum: { scoreImpact: true },
      }),
      prisma.projectMember.count({ where: { userId, project: { status: 'ACTIVE' } } }),
      prisma.task.count({
        where: {
          assignedToId: userId,
          status: 'DONE',
          updatedAt: { gte: weekStart },
        },
      }),
      prisma.focusSession.count({
        where: { userId, completedAt: { gte: weekStart } },
      }),
    ]);

    const totalTasks = taskStats.reduce((s, g) => s + g._count, 0);
    const completedGroup = taskStats.find((g) => g.status === 'DONE');
    const inProgressGroup = taskStats.find((g) => g.status === 'IN_PROGRESS');
    const completedTasks = completedGroup != null ? completedGroup._count : 0;
    const inProgressTasks = inProgressGroup != null ? inProgressGroup._count : 0;

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

  async getDailyProductivity(
    userId: string,
    from: Date,
    to: Date
  ): Promise<DailyProductivityEntry[]> {
    const [activities, focusSessions, tasksCompleted] = await prisma.$transaction([
      prisma.productivityActivity.findMany({
        where: { userId, createdAt: { gte: from, lte: to } },
        select: { scoreImpact: true, createdAt: true },
      }),
      prisma.focusSession.findMany({
        where: { userId, completedAt: { gte: from, lte: to } },
        select: { durationMinutes: true, completedAt: true },
      }),
      prisma.task.findMany({
        where: { assignedToId: userId, status: 'DONE', updatedAt: { gte: from, lte: to } },
        select: { updatedAt: true },
      }),
    ]);

    const dayMap = new Map<string, DailyProductivityEntry>();
    const getDay = (d: Date) => d.toISOString().split('T')[0];

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

export const analyticsRepository = new AnalyticsRepository();
