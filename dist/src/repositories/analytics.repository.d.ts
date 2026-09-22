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
export declare class AnalyticsRepository {
    getUserSummary(userId: string): Promise<AnalyticsSummary>;
    getDailyProductivity(userId: string, from: Date, to: Date): Promise<DailyProductivityEntry[]>;
}
export declare const analyticsRepository: AnalyticsRepository;
