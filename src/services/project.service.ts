import { Project, ProjectRole } from '@prisma/client';
import prisma from '../config/prisma';
import { projectRepository } from '../repositories/project.repository';
import { activityRepository } from '../repositories/activity.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';
import { CreateProjectInput, UpdateProjectInput, ProjectFilterParams } from '../types/project.types';
import { PaginatedResult } from '../types/common.types';

export const projectService = {
  /**
   * TRANSACTION: Create project + owner membership + audit activity atomically.
   */
  async create(data: CreateProjectInput): Promise<Project> {
    const ownerExists = await userRepository.exists(data.ownerId);
    if (!ownerExists) throw new AppError('Project owner not found', 404, 'USER_NOT_FOUND');

    return prisma.$transaction(async (tx) => {
      // 1. Create the project
      const project = await tx.project.create({ data });

      // 2. Add owner as OWNER membership
      await tx.projectMember.create({
        data: { projectId: project.id, userId: data.ownerId, role: ProjectRole.OWNER },
      });

      // 3. Log activity
      await tx.productivityActivity.create({
        data: {
          userId: data.ownerId,
          type: 'TASK_CREATED',
          title: `Created project: ${project.name}`,
          scoreImpact: 5,
        },
      });

      return project;
    });
  },

  async getById(id: string): Promise<Project> {
    const project = await projectRepository.findById(id, true, true);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    return project;
  },

  async getMany(filters: ProjectFilterParams): Promise<PaginatedResult<Project>> {
    return projectRepository.findMany(filters);
  },

  async update(id: string, data: UpdateProjectInput, requesterId: string): Promise<Project> {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    // Only owner or ADMIN can update
    const member = await projectRepository.findMember(id, requesterId);
    if (!member || (member.role !== ProjectRole.OWNER && member.role !== ProjectRole.LEAD)) {
      // Also allow if the user is project owner directly
      if (project.ownerId !== requesterId) {
        throw new AppError('Insufficient permissions to update this project', 403, 'FORBIDDEN');
      }
    }

    return projectRepository.update(id, data);
  },

  /**
   * TRANSACTION: Delete project — Prisma cascades handle members/tasks.
   */
  async delete(id: string, requesterId: string): Promise<void> {
    const project = await projectRepository.findById(id);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    if (project.ownerId !== requesterId) {
      throw new AppError('Only the project owner can delete this project', 403, 'FORBIDDEN');
    }
    await projectRepository.delete(id);
  },

  async addMember(
    projectId: string,
    userId: string,
    role: ProjectRole,
    requesterId: string
  ): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const requester = await projectRepository.findMember(projectId, requesterId);
    if (
      !requester ||
      (requester.role !== ProjectRole.OWNER && requester.role !== ProjectRole.LEAD)
    ) {
      throw new AppError('Only project owners or leads can add members', 403, 'FORBIDDEN');
    }

    const userExists = await userRepository.exists(userId);
    if (!userExists) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const existing = await projectRepository.findMember(projectId, userId);
    if (existing) throw new AppError('User is already a project member', 409, 'ALREADY_MEMBER');

    await projectRepository.addMember(projectId, userId, role);
  },

  async removeMember(projectId: string, userId: string, requesterId: string): Promise<void> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const requester = await projectRepository.findMember(projectId, requesterId);
    const isOwnerRequest = project.ownerId === requesterId;
    const isSelfLeave = userId === requesterId;

    if (!isOwnerRequest && !isSelfLeave) {
      if (!requester || requester.role !== ProjectRole.OWNER) {
        throw new AppError('Cannot remove this member', 403, 'FORBIDDEN');
      }
    }

    // Cannot remove the owner
    const targetMember = await projectRepository.findMember(projectId, userId);
    if (targetMember?.role === ProjectRole.OWNER) {
      throw new AppError('Cannot remove the project owner', 400, 'CANNOT_REMOVE_OWNER');
    }

    await projectRepository.removeMember(projectId, userId);
  },

  async getMembers(projectId: string) {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    return projectRepository.findMembers(projectId);
  },
};
