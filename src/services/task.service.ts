import { Task, TaskStatus } from '@prisma/client';
import prisma from '../config/prisma';
import { taskRepository } from '../repositories/task.repository';
import { projectRepository } from '../repositories/project.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middleware/error.middleware';
import { CreateTaskInput, UpdateTaskInput, TaskFilterParams } from '../types/task.types';
import { PaginatedResult } from '../types/common.types';

export const taskService = {
  /**
   * TRANSACTION: Create task + log TASK_CREATED activity atomically.
   */
  async create(data: CreateTaskInput): Promise<Task> {
    const projectExists = await projectRepository.exists(data.projectId);
    if (!projectExists) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    if (data.assignedToId) {
      const assigneeExists = await userRepository.exists(data.assignedToId);
      if (!assigneeExists) throw new AppError('Assigned user not found', 404, 'USER_NOT_FOUND');
    }

    return prisma.$transaction(async (tx) => {
      const task = await tx.task.create({ data });

      await tx.productivityActivity.create({
        data: {
          userId: data.createdById,
          taskId: task.id,
          type: 'TASK_CREATED',
          title: `Created task: ${task.title}`,
          scoreImpact: 2,
        },
      });

      // Notify assignee if different from creator
      if (data.assignedToId && data.assignedToId !== data.createdById) {
        await tx.notification.create({
          data: {
            userId: data.assignedToId,
            title: 'New Task Assigned',
            message: `You have been assigned the task: "${task.title}"`,
            type: 'TASK_ASSIGNED',
            link: `/tasks/${task.id}`,
          },
        });
      }

      return task;
    });
  },

  async getById(id: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    return task;
  },

  async getMany(filters: TaskFilterParams): Promise<PaginatedResult<Task>> {
    return taskRepository.findMany(filters);
  },

  async update(id: string, data: UpdateTaskInput, requesterId: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    if (data.assignedToId) {
      const assigneeExists = await userRepository.exists(data.assignedToId);
      if (!assigneeExists) throw new AppError('Assigned user not found', 404, 'USER_NOT_FOUND');
    }

    // Log status change activity
    if (data.status && data.status !== task.status) {
      await prisma.$transaction(async (tx) => {
        await tx.task.update({ where: { id }, data });
        await tx.productivityActivity.create({
          data: {
            userId: requesterId,
            taskId: id,
            type: 'STATUS_CHANGED',
            title: `Task "${task.title}" moved to ${data.status}`,
            scoreImpact: 1,
          },
        });
      });
      return taskRepository.findById(id) as Promise<Task>;
    }

    return taskRepository.update(id, data);
  },

  /**
   * TRANSACTION: Mark task DONE + log TASK_COMPLETED activity + notify creator.
   */
  async complete(id: string, actualHours: number | undefined, requesterId: string): Promise<Task> {
    const task = await taskRepository.findById(id);
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    if (task.status === TaskStatus.DONE) {
      throw new AppError('Task is already completed', 400, 'TASK_ALREADY_DONE');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          status: TaskStatus.DONE,
          ...(actualHours !== undefined && { actualHours }),
        },
      });

      await tx.productivityActivity.create({
        data: {
          userId: requesterId,
          taskId: id,
          type: 'TASK_COMPLETED',
          title: `Completed task: "${task.title}"`,
          scoreImpact: 10,
        },
      });

      // Notify creator if different from completer
      if (task.createdById !== requesterId) {
        await tx.notification.create({
          data: {
            userId: task.createdById,
            title: 'Task Completed',
            message: `Task "${task.title}" has been completed`,
            type: 'SUCCESS',
            link: `/tasks/${id}`,
          },
        });
      }

      return updated;
    });
  },

  async delete(id: string): Promise<void> {
    const exists = await taskRepository.exists(id);
    if (!exists) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    await taskRepository.delete(id);
  },

  async getProjectStats(projectId: string): Promise<Record<string, number>> {
    const projectExists = await projectRepository.exists(projectId);
    if (!projectExists) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    return taskRepository.countByProject(projectId);
  },
};
