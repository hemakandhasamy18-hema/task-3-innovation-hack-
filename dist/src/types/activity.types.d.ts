import { ActivityType } from '@prisma/client';
import { PaginationParams } from './common.types';
export interface ActivityDTO {
    id: string;
    userId: string;
    taskId: string | null;
    type: ActivityType;
    title: string;
    details: string | null;
    scoreImpact: number;
    createdAt: Date;
}
export interface CreateActivityInput {
    userId: string;
    taskId?: string | null;
    type: ActivityType;
    title: string;
    details?: string | null;
    scoreImpact?: number;
}
export interface ActivityFilterParams extends PaginationParams {
    userId?: string;
    taskId?: string;
    type?: ActivityType;
    from?: Date;
    to?: Date;
}
