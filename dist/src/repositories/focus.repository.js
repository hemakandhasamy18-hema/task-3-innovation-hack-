"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.focusRepository = exports.FocusRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class FocusRepository {
    async findById(id) {
        return prisma_1.default.focusSession.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                task: { select: { id: true, title: true } },
            },
        });
    }
    async findMany(filters) {
        const { page = 1, limit = 20, sortBy = 'completedAt', sortOrder = 'desc', userId, taskId, energyLevel, from, to, } = filters;
        const skip = (page - 1) * limit;
        const where = {
            ...(userId && { userId }),
            ...(taskId && { taskId }),
            ...(energyLevel && { energyLevel }),
            ...(from || to
                ? {
                    completedAt: {
                        ...(from && { gte: from }),
                        ...(to && { lte: to }),
                    },
                }
                : {}),
        };
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.focusSession.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    task: { select: { id: true, title: true } },
                },
            }),
            prisma_1.default.focusSession.count({ where }),
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
        return prisma_1.default.focusSession.create({ data });
    }
    async delete(id) {
        await prisma_1.default.focusSession.delete({ where: { id } });
    }
    async getTotalFocusMinutes(userId, from, to) {
        const result = await prisma_1.default.focusSession.aggregate({
            where: {
                userId,
                ...(from || to
                    ? {
                        completedAt: {
                            ...(from && { gte: from }),
                            ...(to && { lte: to }),
                        },
                    }
                    : {}),
            },
            _sum: { durationMinutes: true },
        });
        return result._sum.durationMinutes ?? 0;
    }
    async getAverageDuration(userId) {
        const result = await prisma_1.default.focusSession.aggregate({
            where: { userId },
            _avg: { durationMinutes: true },
        });
        return result._avg.durationMinutes ?? 0;
    }
}
exports.FocusRepository = FocusRepository;
exports.focusRepository = new FocusRepository();
//# sourceMappingURL=focus.repository.js.map