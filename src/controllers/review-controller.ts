import mongoose from "mongoose";
import { NextFunction, Request, Response } from "express";

import { ReviewInterface, ReviewModel } from "../models/review-model";
import { AppError } from "../utils/app-error";
import { UserInterface, UserModel } from "../models/users-model";
import {
  deleteOneDocument,
  getAllDocs,
  getOneDoc,
  updateOneDocument,
} from "./handlerFactory";
import { CourseInterface } from "../models/courses-model";
import { globalAsyncCatch } from "../utils/global-async-catch";

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION-GROUP
export const getAllReviews = getAllDocs<ReviewInterface>(ReviewModel, [
  { path: "associatedCourse", select: "name" },
  {
    path: "associatedUser",
    select: "name role",
  },
]);

export const opBeforeGetReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.params.courseId) {
      next();
    } else {
      await getAllReviews(req, res, next);
    }
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
    // 1 : take the the course id out of params
    const courseId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(
      req.params.courseId
    );

    if (!courseId) {
      return next(new AppError("Invalid course id", 400));
    }

    // 2 : take user id out of req.user
    const userId = req.user?._id;

    if (!userId) {
      return next(new AppError("Invalid user id", 400));
    }

    // 3 : check wether the user have already submit a review on this course
    const alreadyReviewed = await ReviewModel.find({
      associatedCourse: courseId,
      associatedUser: userId,
    });

    if (alreadyReviewed.length > 0) {
      return next(new AppError("You have already reviewed this course", 400));
    }

    // 3 : check wether the user have bought this course or not
    const associatedCoursesResult = await UserModel.find({
      _id: userId,
    }).select("associatedCourses");

    // --> extract the actual array from result
    const associatedCourses = associatedCoursesResult[0].associatedCourses;

    // --> check if the result is not in the form of array
    if (!Array.isArray(associatedCourses))
      return next(
        new AppError(
          "Invalid type! associatedCourses must be of type array",
          5000
        )
      );

    // --> check is the resulted array is empty
    if (associatedCourses.length === 0) {
      return next(
        new AppError("The user have not yet bought this course", 400)
      );
    }

    // --> if the resulted array is not empty then check if the course id exists on resulted array
    let bought: boolean = false;

    associatedCourses.forEach((val) => {
      if (String(val._id) === String(courseId)) {
        bought = true;
      }
    });

    if (!bought) {
      return next(new AppError("The User hve not yet bought this course", 400));
    }

    // 4 :  the user have bought this course
    const { review, rating } = req.body;

    if (!review || !rating) {
      return next(new AppError("Provide rating and review both", 400));
    }

    const newReview = await ReviewModel.create({
      review,
      rating,
      createdAt: new Date(Date.now()),
      associatedCourse: courseId,
      associatedUser: userId,
    });

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $push: { associatedReviews: newReview._id } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        newReview,
        updatedUser,
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION
export const getAllReviewsForCourse = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : get the course id from params
    const courseId = new mongoose.Types.ObjectId(req.params.courseId);

    if (!courseId) {
      return next(new AppError("Course id not provided", 400));
    }

    const allReviews = await ReviewModel.find({ associatedCourse: courseId });

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
export const checkCorrectUserOperation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : take the course Id out
    const courseId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(
      req.params.courseId
    );

    if (!courseId) {
      return next(new AppError("Course id not provided", 400));
    }

    // 2 : take the user id out of req.user
    const userId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(
      req.user?.id
    );

    if (!userId) {
      return next(new AppError("User id not provided", 400));
    }

    const existingReview = await ReviewModel.findOne({
      associatedUser: userId,
      associatedCourse: courseId,
    });

    console.log(existingReview);

    if (existingReview) {
      req.params.id = String(existingReview?._id);
      next();
    } else {
      return next(
        new AppError("You are not authorized to perform this action", 403)
      );
    }
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION
export const deleteReviewById = deleteOneDocument<ReviewInterface>(ReviewModel);

// FUNCTION-GROUP
export const checkUserSubmittedReview = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1 : take course id out of params
    const courseId = req.params?.courseId;

    if (!courseId) {
      return next(new AppError("Provide course id", 400));
    }

    // 2 : take user if out of user on req obj
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError("You are not logged in", 401));
    }

    // 3 : no check that the user have already submitted a review on this course or not
    const existingReview = await ReviewModel.findOne({
      associatedCourse: String(courseId),
      associatedUser: String(userId),
    });

    if (!existingReview) {
      return next(
        new AppError("You do not have any review on this course", 400)
      );
    }

    next();
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

export const updateReviewById = updateOneDocument<ReviewInterface>(ReviewModel);

// FUNCTION-GROUP
export const opBeforeGettingOneReview = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reviewId } = req.params;

    if (!reviewId) {
      return next(new AppError("Provide review id", 400));
    }

    const review = await ReviewModel.findById(reviewId);

    if (!review) {
      return next(new AppError("No review for provided id", 400));
    }

    if (String(review.associatedUser) === String(req.user?.id)) {
      req.params.id = reviewId;
      next();
    } else {
      return next(
        new AppError("You are not authorized to perform this action", 401)
      );
    }
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

export const getReviewById = getOneDoc<ReviewInterface>(ReviewModel);
