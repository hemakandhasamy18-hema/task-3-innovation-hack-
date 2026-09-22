"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidParamSchema = exports.validateAll = exports.validate = void 0;
const zod_1 = require("zod");
const error_middleware_1 = require("./error.middleware");
const validate = (schema, target = 'body') => (req, _res, next) => {
    try {
        const parsed = schema.parse(req[target]);
        req[target] = parsed;
        next();
    }
    catch (err) {
        if (err instanceof zod_1.ZodError) {
            const details = err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            next(new error_middleware_1.AppError('Validation failed', 422, 'VALIDATION_ERROR', details));
        }
        else {
            next(err);
        }
    }
};
exports.validate = validate;
// Utility to compose body + params + query validation
const validateAll = (schemas) => (req, _res, next) => {
    const errors = [];
    for (const [target, schema] of Object.entries(schemas)) {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            result.error.errors.forEach((e) => errors.push({ field: `${target}.${e.path.join('.')}`, message: e.message }));
        }
        else {
            req[target] = result.data;
        }
    }
    if (errors.length > 0) {
        next(new error_middleware_1.AppError('Validation failed', 422, 'VALIDATION_ERROR', errors));
    }
    else {
        next();
    }
};
exports.validateAll = validateAll;
// Common param schemas
exports.uuidParamSchema = zod_1.z.object({ id: zod_1.z.string().uuid('Invalid UUID format') });
//# sourceMappingURL=validate.middleware.js.map