"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalAsyncCatch = void 0;
const app_error_1 = require("./app-error");
const globalAsyncCatch = (error, next) => {
    if (error instanceof Error) {
        next(new app_error_1.AppError(error.message, 500));
    }
    else {
        next(new app_error_1.AppError("An unexpected error occurred", 500));
    }
};
exports.globalAsyncCatch = globalAsyncCatch;
