"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const SALT_ROUNDS = 12;
const hashPassword = async (plaintext) => {
    return bcryptjs_1.default.hash(plaintext, SALT_ROUNDS);
};
exports.hashPassword = hashPassword;
const comparePassword = async (plaintext, hash) => {
    return bcryptjs_1.default.compare(plaintext, hash);
};
exports.comparePassword = comparePassword;
//# sourceMappingURL=password.js.map