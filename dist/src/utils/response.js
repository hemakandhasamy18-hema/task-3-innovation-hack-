"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCreated = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message, statusCode = 200, pagination) => {
    const response = {
        success: true,
        message,
        data,
        ...(pagination && { pagination }),
    };
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 500, code = 'INTERNAL_ERROR', details) => {
    const response = {
        success: false,
        error: {
            code,
            message,
            ...(details !== undefined && { details }),
        },
    };
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
const sendCreated = (res, data, message) => {
    (0, exports.sendSuccess)(res, data, message ?? 'Resource created successfully', 201);
};
exports.sendCreated = sendCreated;
//# sourceMappingURL=response.js.map