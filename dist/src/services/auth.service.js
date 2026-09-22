"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const error_middleware_1 = require("../middleware/error.middleware");
function toDTO(user) {
    const { passwordHash: _omit, ...dto } = user;
    return dto;
}
exports.authService = {
    async register(data) {
        const emailExists = await user_repository_1.userRepository.existsByEmail(data.email);
        if (emailExists) {
            throw new error_middleware_1.AppError('Email is already registered', 409, 'EMAIL_CONFLICT');
        }
        const passwordHash = await (0, password_1.hashPassword)(data.password);
        const user = await user_repository_1.userRepository.create({
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role,
        });
        const token = (0, jwt_1.signToken)({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
        return { user: toDTO(user), token };
    },
    async login(data) {
        const user = await user_repository_1.userRepository.findByEmail(data.email);
        if (!user || !user.isActive) {
            throw new error_middleware_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        const valid = await (0, password_1.comparePassword)(data.password, user.passwordHash);
        if (!valid) {
            throw new error_middleware_1.AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
        const token = (0, jwt_1.signToken)({
            sub: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });
        return { user: toDTO(user), token };
    },
    async refreshProfile(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new error_middleware_1.AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        return toDTO(user);
    },
};
//# sourceMappingURL=auth.service.js.map