import { NextFunction, Request, Response } from "express";
import { AppError } from "./appError";
import { resolve } from "node:path/posix";

const sendDevelopmentError = (err: AppError, res: Response) => {
  res.status(err.errorStatusCode).json({
    status: err.errorStatus,
    message: err.message,
    errorObj: err,
    stackTrace: err.stack,
  });
};
const sendProductionError = (err: AppError, res: Response) => {
  if (err.isOperationalError) {
    res.status(err.errorStatusCode).json({
      status: err.errorStatus,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "An unexpected error has occurred",
    });
  }
};

const globalErrorCatcher = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(process.env.NODE_ENV);

  if (process.env.NODE_ENV === "development") {
    sendDevelopmentError(err, res);
  }
  if (process.env.NODE_ENV === "production") {
    sendProductionError(err, res);
  }
};

export { globalErrorCatcher };
