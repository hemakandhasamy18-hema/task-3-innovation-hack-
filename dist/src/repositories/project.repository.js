"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRepository = exports.ProjectRepository = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
class ProjectRepository {
    async findById(id, includeOwner = false, includeMembers = false) {
        return prisma_1.default.project.findUnique({
            where: { id },
            include: {
                ...(includeOwner && { owner: true }),
                ...(includeMembers && { members: { include: { user: true } } }),
            },
        });
    }
    async findMany(filters) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, priority, ownerId, memberId, search, } = filters;
        const skip = (page - 1) * limit;
        const where = {
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
        const [data, total] = await prisma_1.default.$transaction([
            prisma_1.default.project.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: { owner: { select: { id: true, name: true, email: true, avatarUrl: true } } },
            }),
            prisma_1.default.project.count({ where }),
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
        return prisma_1.default.project.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.project.update({ where: { id }, data });
    }
    async delete(id) {
        await prisma_1.default.project.delete({ where: { id } });
    }
    async exists(id) {
        const count = await prisma_1.default.project.count({ where: { id } });
        return count > 0;
    }
    async addMember(projectId, userId, role = client_1.ProjectRole.MEMBER) {
        return prisma_1.default.projectMember.create({
            data: { projectId, userId, role },
        });
    }
    async removeMember(projectId, userId) {
        await prisma_1.default.projectMember.deleteMany({ where: { projectId, userId } });
    }
    async findMember(projectId, userId) {
        return prisma_1.default.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
        });
    }
    async findMembers(projectId) {
        return prisma_1.default.projectMember.findMany({
            where: { projectId },
            include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } } },
        });
    }
    async updateMemberRole(projectId, userId, role) {
        return prisma_1.default.projectMember.update({
            where: { projectId_userId: { projectId, userId } },
            data: { role: role },
        });
    }
}
exports.ProjectRepository = ProjectRepository;
exports.projectRepository = new ProjectRepository();
//# sourceMappingURL=project.repository.js.map