"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorCatcher = void 0;
const sendDevelopmentError = (err, res) => {
    res.status(err.errorStatusCode).json({
        status: err.errorStatus,
        message: err.message,
        errorObj: err,
        stackTrace: err.stack,
    });
};
const sendProductionError = (err, res) => {
    if (err.isOperationalError) {
        res.status(err.errorStatusCode).json({
            status: err.errorStatus,
            message: err.message,
        });
    }
    else {
        res.status(500).json({
            status: "error",
            message: "An unexpected error has occurred",
        });
    }
};
const globalErrorCatcher = (err, req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        sendDevelopmentError(err, res);
    }
    if (process.env.NODE_ENV === "production") {
        sendProductionError(err, res);
    }
};
exports.globalErrorCatcher = globalErrorCatcher;
