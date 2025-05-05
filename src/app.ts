import express, { Request, Response, NextFunction, Router } from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cors from "cors";
import compression from "compression";

import { AppError } from "./utils/app-error";
import { globalErrorCatcher } from "./utils/global-error-catcher";
import { rateLimit } from "express-rate-limit";

import coursesRouter from "./routes/courses-routes";
import userRouter from "./routes/users-routes";
import reviewRouter from "./routes/review-routes";
import cookieParser from "cookie-parser";
import router from "./routes/review-routes";
import { CourseModel } from "./models/courses-model";
import { globalAsyncCatch } from "./utils/global-async-catch";
import { ReviewModel } from "./models/review-model";
import { createWebhookCheckout } from "./controllers/courses-controller";

const app = express();

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  createWebhookCheckout
);

app.set("trust proxy", 1);

app.use(helmet());

app.use(mongoSanitize());

dotenv.config({ path: "./config.env" });

app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());

app.use(hpp());

app.use(cors());

app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

app.use(limiter);

app.use("/api/courses", coursesRouter);
app.use("/api/users", userRouter);
app.use("/api/reviews", reviewRouter);
app.get(
  "/example",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = String("67aa083ef623793cea967156");
      const review = await ReviewModel.findById(reviewId).select("review");

      res.status(200).json({
        status: "success hello",
        data: {
          review,
        },
      });
    } catch (err: unknown) {
      globalAsyncCatch(err, next);
    }
  }
);

const exampleRouter2: Router = express.Router();
app.use("/exampleRoute", exampleRouter2);
exampleRouter2
  .route("/")
  .get((req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: "success example",
    });
  });

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: "success",
    data: {
      message: "Hello from back end",
    },
  });
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  next(
    new AppError(
      `Can't find ${req.protocol}://${req.ip}:${process.env.PORT}/${req.originalUrl} on this server!`,
      404
    )
  );
});

// global error handler
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  globalErrorCatcher(err, req, res, next);
});

export default app;
