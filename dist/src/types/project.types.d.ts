import { ProjectStatus, Priority } from '@prisma/client';
import { PaginationParams } from './common.types';
export interface ProjectDTO {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    priority: Priority;
    ownerId: string;
    startDate: Date | null;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateProjectInput {
    name: string;
    description?: string | null;
    status?: ProjectStatus;
    priority?: Priority;
    ownerId: string;
    startDate?: Date | null;
    dueDate?: Date | null;
}
export interface UpdateProjectInput {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
    priority?: Priority;
    startDate?: Date | null;
    dueDate?: Date | null;
}
export interface ProjectFilterParams extends PaginationParams {
    status?: ProjectStatus;
    priority?: Priority;
    ownerId?: string;
    memberId?: string;
    search?: string;
}
