import { Project, ProjectMember } from '@prisma/client';
import { CreateProjectInput, UpdateProjectInput, ProjectFilterParams } from '../types/project.types';
import { PaginatedResult } from '../types/common.types';
export interface IProjectRepository {
    findById(id: string, includeOwner?: boolean, includeMembers?: boolean): Promise<Project | null>;
    findMany(filters: ProjectFilterParams): Promise<PaginatedResult<Project>>;
    create(data: CreateProjectInput): Promise<Project>;
    update(id: string, data: UpdateProjectInput): Promise<Project>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
    addMember(projectId: string, userId: string, role?: string): Promise<ProjectMember>;
    removeMember(projectId: string, userId: string): Promise<void>;
    findMember(projectId: string, userId: string): Promise<ProjectMember | null>;
    findMembers(projectId: string): Promise<ProjectMember[]>;
    updateMemberRole(projectId: string, userId: string, role: string): Promise<ProjectMember>;
}
