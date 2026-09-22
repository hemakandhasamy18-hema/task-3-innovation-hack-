"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRepository = exports.TaskRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
class TaskRepository {
    async findById(id) {
        return prisma_1.default.task.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
    }
    async findMany(filters) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', projectId, assignedToId, createdById, status, priority, search, } = filters;
        const skip = (page - 1) * limit;
        const where = {
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
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.task.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    assignedTo: { select: { id: true, name: true, avatarUrl: true } },
                    createdBy: { select: { id: true, name: true } },
                },
            }),
            prisma_1.default.task.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: data,
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
    async create(data) {
        return prisma_1.default.task.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.task.update({ where: { id }, data });
    }
    async delete(id) {
        await prisma_1.default.task.delete({ where: { id } });
    }
    async exists(id) {
        const count = await prisma_1.default.task.count({ where: { id } });
        return count > 0;
    }
    async countByProject(projectId) {
        const grouped = await prisma_1.default.task.groupBy({
            by: ['status'],
            where: { projectId },
            _count: { _all: true },
        });
        const result = {};
        for (const item of grouped) {
            result[item.status] = item._count._all;
        }
        // Ensure all statuses are represented
        for (const status of Object.values(client_1.TaskStatus)) {
            if (!(status in result)) {
                result[status] = 0;
            }
        }
        return result;
    }
}
exports.TaskRepository = TaskRepository;
exports.taskRepository = new TaskRepository();
//# sourceMappingURL=task.repository.js.map