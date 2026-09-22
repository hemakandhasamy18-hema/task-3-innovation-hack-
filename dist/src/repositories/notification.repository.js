"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = exports.NotificationRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class NotificationRepository {
    async findById(id) {
        return prisma_1.default.notification.findUnique({ where: { id } });
    }
    async findMany(filters) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', userId, type, isRead, } = filters;
        const skip = (page - 1) * limit;
        const where = {
            ...(userId && { userId }),
            ...(type && { type }),
            ...(isRead !== undefined && { isRead }),
        };
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma_1.default.notification.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data,
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
        return prisma_1.default.notification.create({ data });
    }
    async markAsRead(id) {
        return prisma_1.default.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        const result = await prisma_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return result.count;
    }
    async delete(id) {
        await prisma_1.default.notification.delete({ where: { id } });
    }
    async countUnread(userId) {
        return prisma_1.default.notification.count({ where: { userId, isRead: false } });
    }
}
exports.NotificationRepository = NotificationRepository;
exports.notificationRepository = new NotificationRepository();
//# sourceMappingURL=notification.repository.js.map