"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const app_error_1 = require("./utils/app-error");
const global_error_catcher_1 = require("./utils/global-error-catcher");
const express_rate_limit_1 = require("express-rate-limit");
const courses_routes_1 = __importDefault(require("./routes/courses-routes"));
const users_routes_1 = __importDefault(require("./routes/users-routes"));
const review_routes_1 = __importDefault(require("./routes/review-routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
dotenv_1.default.config({ path: "./config.env" });
app.use(express_1.default.json({ limit: "10kb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, hpp_1.default)());
app.use((0, cors_1.default)());
app.options("*", (0, cors_1.default)());
app.use((0, compression_1.default)());
app.enable("trust proxy");
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
app.use(limiter);
app.use("/api/courses", courses_routes_1.default);
app.use("/api/users", users_routes_1.default);
app.use("/api/reviews", review_routes_1.default);
app.use("/example", (req, res, next) => {
    res.status(200).json({
        status: "success",
    });
});
app.all("*", (req, res, next) => {
    next(new app_error_1.AppError(`Can't find ${req.protocol}://${req.ip}:${process.env.PORT}/${req.originalUrl} on this server!`, 404));
});
// global error handler
app.use((err, req, res, next) => {
    (0, global_error_catcher_1.globalErrorCatcher)(err, req, res, next);
});
exports.default = app;
