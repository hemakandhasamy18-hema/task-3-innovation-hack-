import { Task, Prisma, TaskStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import { CreateTaskInput, UpdateTaskInput, TaskFilterParams } from '../types/task.types';
import { PaginatedResult } from '../types/common.types';

export class TaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }) as unknown as Task | null;
  }

  async findMany(filters: TaskFilterParams): Promise<PaginatedResult<Task>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      projectId,
      assignedToId,
      createdById,
      status,
      priority,
      search,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {
      ...(projectId && { projectId }),
      ...(assignedToId && { assignedToId }),
      ...(createdById && { createdById }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: { select: { id: true, name: true, avatarUrl: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as unknown as Task[],
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

  async create(data: CreateTaskInput): Promise<Task> {
    return prisma.task.create({ data });
  }

  async update(id: string, data: UpdateTaskInput): Promise<Task> {
    return prisma.task.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.task.count({ where: { id } });
    return count > 0;
  }

  async countByProject(projectId: string): Promise<Record<string, number>> {
    const grouped = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { _all: true },
    });

    const result: Record<string, number> = {};
    for (const item of grouped) {
      result[item.status] = item._count._all;
    }

    // Ensure all statuses are represented
    for (const status of Object.values(TaskStatus)) {
      if (!(status in result)) {
        result[status] = 0;
      }
    }

    return result;
  }
}

export const taskRepository = new TaskRepository();
