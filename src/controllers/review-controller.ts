import { NextFunction, Request, Response } from "express";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { ReviewInterface, ReviewModel } from "../models/review-model";
import { AppError } from "../utils/app-error";
import { UserInterface } from "../models/users-model";

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION
export const getAllReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allReviews = await ReviewModel.find();

    if (!allReviews) {
      return next(new AppError("Unable to get reviews", 500));
    }

    res.status(200).json({
      status: "success",
      data: {
        allReviews,
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION
export const createNewReview = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : get the course id
    const { courseId } = req.query;

    if (!courseId) {
      return next(new AppError("Course id not provided in query", 400));
    }

    // 2 : get the user if out
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("User id not not provided", 500));
    }

    // 3 : check if the user has submitted review already
    const existingReview = await ReviewModel.findOne({
      associatedCourse: courseId,
      associatedUser: userId,
    });

    // 4 :
    const { review, rating } = req.body;

    if (!review || !rating) {
      return next(
        new AppError("Provide review and rating in request body", 400)
      );
    }

    // 5 : if the review is new create a new review
    if (existingReview) {
      existingReview.review = review;
      existingReview.rating = rating;
      existingReview.save();

      res.status(200).json({
        status: "success",
        data: {
          updatedReview: existingReview,
        },
      });
    } else {
      const newReview = await ReviewModel.create({
        review,
        rating,
        createdAt: new Date(Date.now()),
        associatedCourse: courseId,
        associatedUser: userId,
      });
      res.status(200).json({
        status: "success",
        data: {
          newReview,
        },
      });
    }
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};
