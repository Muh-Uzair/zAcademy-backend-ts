import express, { Request, Response, NextFunction } from "express";
import coursesRouter from "./routes/courses-routes";
import userRouter from "./routes/users-routes";
import morgan from "morgan";
import dotenv from "dotenv";
import { AppError } from "./utils/app-error";
import { globalErrorCatcher } from "./utils/global-error-catcher";
const app = express();
dotenv.config({ path: "./config.env" });
app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/courses", coursesRouter);
app.use("/api/users", userRouter);

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handler
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  globalErrorCatcher(err, req, res, next);
});

export default app;
