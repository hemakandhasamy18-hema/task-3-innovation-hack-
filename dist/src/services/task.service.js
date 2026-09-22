"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const task_repository_1 = require("../repositories/task.repository");
const project_repository_1 = require("../repositories/project.repository");
const user_repository_1 = require("../repositories/user.repository");
const error_middleware_1 = require("../middleware/error.middleware");
exports.taskService = {
    /**
     * TRANSACTION: Create task + log TASK_CREATED activity atomically.
     */
    async create(data) {
        const projectExists = await project_repository_1.projectRepository.exists(data.projectId);
        if (!projectExists)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        if (data.assignedToId) {
            const assigneeExists = await user_repository_1.userRepository.exists(data.assignedToId);
            if (!assigneeExists)
                throw new error_middleware_1.AppError('Assigned user not found', 404, 'USER_NOT_FOUND');
        }
        return prisma_1.default.$transaction(async (tx) => {
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
    async getById(id) {
        const task = await task_repository_1.taskRepository.findById(id);
        if (!task)
            throw new error_middleware_1.AppError('Task not found', 404, 'TASK_NOT_FOUND');
        return task;
    },
    async getMany(filters) {
        return task_repository_1.taskRepository.findMany(filters);
    },
    async update(id, data, requesterId) {
        const task = await task_repository_1.taskRepository.findById(id);
        if (!task)
            throw new error_middleware_1.AppError('Task not found', 404, 'TASK_NOT_FOUND');
        if (data.assignedToId) {
            const assigneeExists = await user_repository_1.userRepository.exists(data.assignedToId);
            if (!assigneeExists)
                throw new error_middleware_1.AppError('Assigned user not found', 404, 'USER_NOT_FOUND');
        }
        // Log status change activity
        if (data.status && data.status !== task.status) {
            await prisma_1.default.$transaction(async (tx) => {
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
            return task_repository_1.taskRepository.findById(id);
        }
        return task_repository_1.taskRepository.update(id, data);
    },
    /**
     * TRANSACTION: Mark task DONE + log TASK_COMPLETED activity + notify creator.
     */
    async complete(id, actualHours, requesterId) {
        const task = await task_repository_1.taskRepository.findById(id);
        if (!task)
            throw new error_middleware_1.AppError('Task not found', 404, 'TASK_NOT_FOUND');
        if (task.status === client_1.TaskStatus.DONE) {
            throw new error_middleware_1.AppError('Task is already completed', 400, 'TASK_ALREADY_DONE');
        }
        return prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.task.update({
                where: { id },
                data: {
                    status: client_1.TaskStatus.DONE,
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
    async delete(id) {
        const exists = await task_repository_1.taskRepository.exists(id);
        if (!exists)
            throw new error_middleware_1.AppError('Task not found', 404, 'TASK_NOT_FOUND');
        await task_repository_1.taskRepository.delete(id);
    },
    async getProjectStats(projectId) {
        const projectExists = await project_repository_1.projectRepository.exists(projectId);
        if (!projectExists)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        return task_repository_1.taskRepository.countByProject(projectId);
    },
};
//# sourceMappingURL=task.service.js.map