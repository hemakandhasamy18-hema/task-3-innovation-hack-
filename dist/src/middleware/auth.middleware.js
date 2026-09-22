"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const error_middleware_1 = require("./error.middleware");
const authenticate = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        throw new error_middleware_1.AppError('No authentication token provided', 401, 'UNAUTHORIZED');
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        };
        next();
    }
    catch {
        throw new error_middleware_1.AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedRoles) => (req, _res, next) => {
    if (!req.user) {
        throw new error_middleware_1.AppError('Not authenticated', 401, 'UNAUTHORIZED');
    }
    if (!allowedRoles.includes(req.user.role)) {
        throw new error_middleware_1.AppError('You do not have permission to perform this action', 403, 'FORBIDDEN');
    }
    next();
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map