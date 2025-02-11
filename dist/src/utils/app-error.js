"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor(errorMessage, errorStatusCode) {
        super(errorMessage);
        this.errorStatusCode = errorStatusCode;
        this.errorStatus = `${errorStatusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperationalError = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
