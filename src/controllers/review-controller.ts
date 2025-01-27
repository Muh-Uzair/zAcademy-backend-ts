import { NextFunction, Request, Response } from "express";
import { globalAsyncCatch } from "../utils/global-async-catch";

// FUNCTION
export const getAllReviews = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        message: "/api/reviews get",
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION
export const createNewReview = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        message: "/api/reviews post",
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};
