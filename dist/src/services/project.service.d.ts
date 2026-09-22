import { Project, ProjectRole } from '@prisma/client';
import { CreateProjectInput, UpdateProjectInput, ProjectFilterParams } from '../types/project.types';
import { PaginatedResult } from '../types/common.types';
export declare const projectService: {
    /**
     * TRANSACTION: Create project + owner membership + audit activity atomically.
     */
    create(data: CreateProjectInput): Promise<Project>;
    getById(id: string): Promise<Project>;
    getMany(filters: ProjectFilterParams): Promise<PaginatedResult<Project>>;
    update(id: string, data: UpdateProjectInput, requesterId: string): Promise<Project>;
    /**
     * TRANSACTION: Delete project — Prisma cascades handle members/tasks.
     */
    delete(id: string, requesterId: string): Promise<void>;
    addMember(projectId: string, userId: string, role: ProjectRole, requesterId: string): Promise<void>;
    removeMember(projectId: string, userId: string, requesterId: string): Promise<void>;
    getMembers(projectId: string): Promise<{
        userId: string;
        id: string;
        projectId: string;
        role: import(".prisma/client").$Enums.ProjectRole;
        joinedAt: Date;
    }[]>;
};
