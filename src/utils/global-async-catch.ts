import { NextFunction } from "express";
import { AppError } from "./appError";

const globalAsyncCatch = (error: unknown, next: NextFunction) => {
  if (error instanceof Error) {
    next(new AppError(error.message, 500));
  } else {
    next(new AppError("An unexpected error occurred", 500));
  }
};

export { globalAsyncCatch };
