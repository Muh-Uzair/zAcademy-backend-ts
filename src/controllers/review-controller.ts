import { NextFunction, Request, Response } from "express";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { ReviewInterface, ReviewModel } from "../models/review-model";
import { AppError } from "../utils/app-error";
import { UserInterface, UserModel } from "../models/users-model";
import mongoose from "mongoose";

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
    const allReviews = await ReviewModel.find()
      .select("-id")
      .populate({
        path: "associatedUser",
        select: "name role",
      })
      .populate({ path: "associatedCourse", select: "name" });

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

// // FUNCTION
// export const createNewReview = async (
//   req: CustomRequest,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     // 1 : get the course id
//     const { courseId } = req.query;

//     if (!courseId) {
//       return next(new AppError("Course id not provided in query", 400));
//     }

//     // 2 : get the user if out
//     const userId = req.user?.id;

//     if (!userId) {
//       return next(new AppError("User id not not provided", 500));
//     }

//     // 3 : get review rating out of the body
//     const { review, rating } = req.body;

//     if (!review || !rating) {
//       return next(
//         new AppError("Provide review and rating in request body", 400)
//       );
//     }

//     // 4 : create a review
//     const newReview = await ReviewModel.create({
//       review,
//       rating,
//       createdAt: new Date(Date.now()),
//       associatedCourse: courseId,
//       associatedUser: userId,
//     });

//     // 5 : send a response
//     res.status(200).json({
//       status: "success",
//       data: {
//         newReview,
//       },
//     });
//   } catch (err: unknown) {
//     globalAsyncCatch(err, next);
//   }
// };

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

    console.log(courseId);

    if (!courseId) {
      return next(new AppError("Invalid course id", 400));
    }

    // 2 : take user id out of req.user
    const userId = req.user?._id;

    if (!userId) {
      return next(new AppError("Invalid user id", 400));
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
