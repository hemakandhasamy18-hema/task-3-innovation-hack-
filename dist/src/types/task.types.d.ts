import { TaskStatus, Priority } from '@prisma/client';
import { PaginationParams } from './common.types';
export interface TaskDTO {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: Priority;
    projectId: string;
    assignedToId: string | null;
    createdById: string;
    dueDate: Date | null;
    estimatedHours: number | null;
    actualHours: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateTaskInput {
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: Priority;
    projectId: string;
    assignedToId?: string | null;
    createdById: string;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    actualHours?: number | null;
}
export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: Priority;
    assignedToId?: string | null;
    dueDate?: Date | null;
    estimatedHours?: number | null;
    actualHours?: number | null;
}
export interface TaskFilterParams extends PaginationParams {
    projectId?: string;
    assignedToId?: string;
    createdById?: string;
    status?: TaskStatus;
    priority?: Priority;
    search?: string;
}
