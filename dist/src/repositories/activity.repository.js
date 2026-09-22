"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRepository = exports.ActivityRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class ActivityRepository {
    async findById(id) {
        return prisma_1.default.productivityActivity.findUnique({ where: { id } });
    }
    async findMany(filters) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', userId, taskId, type, from, to, } = filters;
        const skip = (page - 1) * limit;
        const where = {
            ...(userId && { userId }),
            ...(taskId && { taskId }),
            ...(type && { type }),
            ...(from || to
                ? {
                    createdAt: {
                        ...(from && { gte: from }),
                        ...(to && { lte: to }),
                    },
                }
                : {}),
        };
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.productivityActivity.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    task: { select: { id: true, title: true } },
                },
            }),
            prisma_1.default.productivityActivity.count({ where }),
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
        return prisma_1.default.productivityActivity.create({ data });
    }
    async delete(id) {
        await prisma_1.default.productivityActivity.delete({ where: { id } });
    }
    async getTotalScore(userId, from, to) {
        const result = await prisma_1.default.productivityActivity.aggregate({
            where: {
                userId,
                ...(from || to
                    ? {
                        createdAt: {
                            ...(from && { gte: from }),
                            ...(to && { lte: to }),
                        },
                    }
                    : {}),
            },
            _sum: { scoreImpact: true },
        });
        return result._sum.scoreImpact ?? 0;
    }
}
exports.ActivityRepository = ActivityRepository;
exports.activityRepository = new ActivityRepository();
//# sourceMappingURL=activity.repository.js.map