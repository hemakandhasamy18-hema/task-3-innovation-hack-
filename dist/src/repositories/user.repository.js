"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
class UserRepository {
    async findById(id) {
        return prisma_1.default.user.findUnique({ where: { id } });
    }
    async findByEmail(email) {
        return prisma_1.default.user.findUnique({ where: { email } });
    }
    async findMany(filters) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', role, isActive, search, } = filters;
        const skip = (page - 1) * limit;
        const where = {
            ...(role && { role }),
            ...(isActive !== undefined && { isActive }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma_1.default.user.count({ where }),
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
        return prisma_1.default.user.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.user.update({ where: { id }, data });
    }
    async delete(id) {
        await prisma_1.default.user.delete({ where: { id } });
    }
    async exists(id) {
        const count = await prisma_1.default.user.count({ where: { id } });
        return count > 0;
    }
    async existsByEmail(email) {
        const count = await prisma_1.default.user.count({ where: { email } });
        return count > 0;
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map