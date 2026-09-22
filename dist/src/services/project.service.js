"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const project_repository_1 = require("../repositories/project.repository");
const user_repository_1 = require("../repositories/user.repository");
const error_middleware_1 = require("../middleware/error.middleware");
exports.projectService = {
    /**
     * TRANSACTION: Create project + owner membership + audit activity atomically.
     */
    async create(data) {
        const ownerExists = await user_repository_1.userRepository.exists(data.ownerId);
        if (!ownerExists)
            throw new error_middleware_1.AppError('Project owner not found', 404, 'USER_NOT_FOUND');
        return prisma_1.default.$transaction(async (tx) => {
            // 1. Create the project
            const project = await tx.project.create({ data });
            // 2. Add owner as OWNER membership
            await tx.projectMember.create({
                data: { projectId: project.id, userId: data.ownerId, role: client_1.ProjectRole.OWNER },
            });
            // 3. Log activity
            await tx.productivityActivity.create({
                data: {
                    userId: data.ownerId,
                    type: 'TASK_CREATED',
                    title: `Created project: ${project.name}`,
                    scoreImpact: 5,
                },
            });
            return project;
        });
    },
    async getById(id) {
        const project = await project_repository_1.projectRepository.findById(id, true, true);
        if (!project)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        return project;
    },
    async getMany(filters) {
        return project_repository_1.projectRepository.findMany(filters);
    },
    async update(id, data, requesterId) {
        const project = await project_repository_1.projectRepository.findById(id);
        if (!project)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        // Only owner or ADMIN can update
        const member = await project_repository_1.projectRepository.findMember(id, requesterId);
        if (!member || (member.role !== client_1.ProjectRole.OWNER && member.role !== client_1.ProjectRole.LEAD)) {
            // Also allow if the user is project owner directly
            if (project.ownerId !== requesterId) {
                throw new error_middleware_1.AppError('Insufficient permissions to update this project', 403, 'FORBIDDEN');
            }
        }
        return project_repository_1.projectRepository.update(id, data);
    },
    /**
     * TRANSACTION: Delete project — Prisma cascades handle members/tasks.
     */
    async delete(id, requesterId) {
        const project = await project_repository_1.projectRepository.findById(id);
        if (!project)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        if (project.ownerId !== requesterId) {
            throw new error_middleware_1.AppError('Only the project owner can delete this project', 403, 'FORBIDDEN');
        }
        await project_repository_1.projectRepository.delete(id);
    },
    async addMember(projectId, userId, role, requesterId) {
        const project = await project_repository_1.projectRepository.findById(projectId);
        if (!project)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        const requester = await project_repository_1.projectRepository.findMember(projectId, requesterId);
        if (!requester ||
            (requester.role !== client_1.ProjectRole.OWNER && requester.role !== client_1.ProjectRole.LEAD)) {
            throw new error_middleware_1.AppError('Only project owners or leads can add members', 403, 'FORBIDDEN');
        }
        const userExists = await user_repository_1.userRepository.exists(userId);
        if (!userExists)
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        const existing = await project_repository_1.projectRepository.findMember(projectId, userId);
        if (existing)
            throw new error_middleware_1.AppError('User is already a project member', 409, 'ALREADY_MEMBER');
        await project_repository_1.projectRepository.addMember(projectId, userId, role);
    },
    async removeMember(projectId, userId, requesterId) {
        const project = await project_repository_1.projectRepository.findById(projectId);
        if (!project)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        const requester = await project_repository_1.projectRepository.findMember(projectId, requesterId);
        const isOwnerRequest = project.ownerId === requesterId;
        const isSelfLeave = userId === requesterId;
        if (!isOwnerRequest && !isSelfLeave) {
            if (!requester || requester.role !== client_1.ProjectRole.OWNER) {
                throw new error_middleware_1.AppError('Cannot remove this member', 403, 'FORBIDDEN');
            }
        }
        // Cannot remove the owner
        const targetMember = await project_repository_1.projectRepository.findMember(projectId, userId);
        if (targetMember?.role === client_1.ProjectRole.OWNER) {
            throw new error_middleware_1.AppError('Cannot remove the project owner', 400, 'CANNOT_REMOVE_OWNER');
        }
        await project_repository_1.projectRepository.removeMember(projectId, userId);
    },
    async getMembers(projectId) {
        const project = await project_repository_1.projectRepository.findById(projectId);
        if (!project)
            throw new error_middleware_1.AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
        return project_repository_1.projectRepository.findMembers(projectId);
    },
};
//# sourceMappingURL=project.service.js.map