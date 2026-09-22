import { Project, ProjectMember, Prisma, ProjectRole } from '@prisma/client';
import prisma from '../config/prisma';
import { IProjectRepository } from '../interfaces/IProjectRepository';
import { CreateProjectInput, UpdateProjectInput, ProjectFilterParams } from '../types/project.types';
import { PaginatedResult } from '../types/common.types';

export class ProjectRepository implements IProjectRepository {
  async findById(
    id: string,
    includeOwner = false,
    includeMembers = false
  ): Promise<Project | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        ...(includeOwner && { owner: true }),
        ...(includeMembers && { members: { include: { user: true } } }),
      },
    }) as Promise<Project | null>;
  }

  async findMany(filters: ProjectFilterParams): Promise<PaginatedResult<Project>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      priority,
      ownerId,
      memberId,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(ownerId && { ownerId }),
      ...(memberId && { members: { some: { userId: memberId } } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { owner: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as unknown as Project[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async create(data: CreateProjectInput): Promise<Project> {
    return prisma.project.create({ data });
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    return prisma.project.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.project.count({ where: { id } });
    return count > 0;
  }

  async addMember(
    projectId: string,
    userId: string,
    role: ProjectRole = ProjectRole.MEMBER
  ): Promise<ProjectMember> {
    return prisma.projectMember.create({
      data: { projectId, userId, role },
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await prisma.projectMember.deleteMany({ where: { projectId, userId } });
  }

  async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
  }

  async findMembers(projectId: string): Promise<ProjectMember[]> {
    return prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
    }) as unknown as ProjectMember[];
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: string
  ): Promise<ProjectMember> {
    return prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role: role as ProjectRole },
    });
  }
}

export const projectRepository = new ProjectRepository();
