import { NextFunction, Request, Response } from "express";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { ReviewModel } from "../models/review-model";

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
export const createNewReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newReview = await ReviewModel.create();
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
