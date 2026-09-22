"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
const notFound = (_req, _res, next) => {
    next(new AppError(`Route not found`, 404, 'NOT_FOUND'));
};
exports.notFound = notFound;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof AppError && err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details !== undefined && { details: err.details }),
            },
        });
        return;
    }
    // Prisma unique constraint violation
    if (err.code === 'P2002') {
        const fields = err.meta?.target;
        res.status(409).json({
            success: false,
            error: {
                code: 'UNIQUE_CONSTRAINT_VIOLATION',
                message: `A record with that ${fields?.join(', ') ?? 'value'} already exists`,
            },
        });
        return;
    }
    // Prisma record not found
    if (err.code === 'P2025') {
        res.status(404).json({
            success: false,
            error: {
                code: 'RECORD_NOT_FOUND',
                message: err.meta?.cause ?? 'Record not found',
            },
        });
        return;
    }
    // Unexpected error
    logger_1.logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected internal server error occurred',
        },
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map