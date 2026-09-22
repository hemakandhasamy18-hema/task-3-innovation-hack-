"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const password_1 = require("../utils/password");
const error_middleware_1 = require("../middleware/error.middleware");
function toDTO(user) {
    const { passwordHash: _omit, ...dto } = user;
    return dto;
}
exports.userService = {
    async getById(id) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user)
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        return toDTO(user);
    },
    async getMany(filters) {
        const result = await user_repository_1.userRepository.findMany(filters);
        return {
            ...result,
            data: result.data.map(toDTO),
        };
    },
    async update(id, data) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user)
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        // If updating email, check uniqueness
        if (data.email && data.email !== user.email) {
            const emailTaken = await user_repository_1.userRepository.existsByEmail(data.email);
            if (emailTaken)
                throw new error_middleware_1.AppError('Email is already taken', 409, 'EMAIL_CONFLICT');
        }
        const updatePayload = { ...data };
        // If a new password is provided, hash it
        if (data.password) {
            updatePayload.passwordHash = await (0, password_1.hashPassword)(data.password);
        }
        delete updatePayload.password;
        const updated = await user_repository_1.userRepository.update(id, updatePayload);
        return toDTO(updated);
    },
    async deactivate(id) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user)
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        const updated = await user_repository_1.userRepository.update(id, { isActive: false });
        return toDTO(updated);
    },
    async delete(id) {
        const exists = await user_repository_1.userRepository.exists(id);
        if (!exists)
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        await user_repository_1.userRepository.delete(id);
    },
};
//# sourceMappingURL=user.service.js.map