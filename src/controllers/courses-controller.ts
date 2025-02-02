import { Request, Response, NextFunction } from "express";
import { CourseInterface, CourseModel } from "../models/courses-model";
import { apiFeatures } from "../utils/api-features";
import { AppError } from "../utils/app-error";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { UserInterface, UserModel } from "../models/users-model";
import {
  deleteOneDocument,
  getAllDocs,
  getOneDoc,
  updateOneDocument,
} from "./handlerFactory";
import { Document } from "mongoose";
import { ReviewModel } from "../models/review-model";

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION
export const getAllCourses = getAllDocs<CourseInterface>(CourseModel);

// FUNCTION
export const createCourse = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : check wether user exists or not
    if (!req.user) {
      return next(new AppError("Provide user", 401));
    }

    // 3 : take the user object from the DB
    const instructor = {
      name: req.user?.name,
      email: req.user?.email,
      qualification: req.user?.qualification || null,
      location: req.user?.location,
    };

    // 4 : create the course
    const newCreatedCourse = await CourseModel.create({
      ...req.body,
      instructor,
    });

    if (!newCreatedCourse) {
      return next(new AppError("Error in creating course", 500));
    }

    // 5 : associate the course
    const updatedInstructor = await UserModel.findByIdAndUpdate(
      req.user?.id,
      { $push: { associatedCourses: newCreatedCourse._id } },
      { new: true, runValidators: true }
    );

    res.status(201).json({
      status: "success",
      data: {
        newCreatedCourse,
        updatedInstructor,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
export const getCourseById = getOneDoc<CourseInterface>(CourseModel);

// FUNCTION this check that the curr is the owner of course which is going to be deleted
export const checkCorrectUserOperation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 :  take user id
    const userId = req.user?.id || req.user?._id;

    // 2 : get the user out of db
    const result = await UserModel.findById(userId).select(
      "+associatedCourses"
    );

    if (!result) {
      return next(new AppError("Curr user does not awn any courses", 401));
    }

    // 4 : check that the course on which the operation is performing exists in the current user associated courses arr
    let correctUser = false;
    const courseId = req.params?.id;

    if (!courseId) {
      return next(new AppError("Provide course id", 400));
    }

    result.associatedCourses?.forEach((val, i) => {
      if (String(val._id) === String(courseId)) {
        correctUser = true;
      }
    });

    // 5 : send response accordingly
    if (!correctUser) {
      return next(
        new AppError("You are not allowed to perform this operation", 401)
      );
    } else {
      next();
    }
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION-GROUP
export const checkDiscountValid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // if there is discount thn check is that valid
  if (req.body?.discount) {
    //
    interface Course {
      price: number;
    }
    // fetch the course price
    const course: Course | null = await CourseModel.findById(
      req.params.id
    ).select("price");

    const coursePrice = course?.price || 0;

    if (req.body.discount > coursePrice) {
      res.status(400).json({
        status: "fail",
        message: "Discount price should not be greater than actual price",
      });
    } else {
      next();
    }
  } else {
    next();
  }
  // if there is no discount then move to next middleware
};

export const updateCourseById = updateOneDocument<CourseInterface>(CourseModel);

// FUNCTION-GROUP
export const syncOtherCollections = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params?.id;

    // DIVIDER 1 : sync reviews associated with that course

    const allReviews = await ReviewModel.find({ associatedCourse: courseId });

    if (!allReviews) {
      return next(
        new AppError("Error in fetching reviews for provided course", 500)
      );
    }

    const deletedReviews = await ReviewModel.deleteMany({
      associatedCourse: courseId,
    });

    if (!deletedReviews) {
      return next(new AppError("Error in deleting associated reviews", 500));
    }

    // DIVIDER 2 : sync associatedCourses arr on teacher who created the course
    // --> take the user id out
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return next(new AppError("Provide user id ", 401));
    }

    // --> take the curr logged user out of db and also the owner of the course who is deleting
    const user = await UserModel.findById(userId);

    if (!user) {
      return next(new AppError("No user found for provided id", 401));
    }

    if (!user?.associatedCourses) {
      return next(
        new AppError("Current user is not the owner of this course", 400)
      );
    }

    user.associatedCourses = user?.associatedCourses.filter((val) => {
      return String(val._id) !== String(courseId);
    });

    await user.save();

    // DIVIDER 3 : sync the associatedCourses arr on student who bought this course
    const userData = await CourseModel.findById(courseId).select("students");

    if (!userData) {
      return next(
        new AppError("Error in fetching students of the course", 500)
      );
    }

    const { students } = userData;

    if (students?.length === 0) {
      next();
    }

    students?.forEach(async (val): Promise<void> => {
      const studentData = await UserModel.findById(val).select(
        "associatedCourses associatedReviews"
      );

      if (!studentData) {
        return next(new AppError("User does not exists for provided id", 400));
      }

      if (!studentData?.associatedCourses || !studentData?.associatedReviews) {
        return next(
          new AppError(
            "Error in fetching associated courses and associated reviews",
            500
          )
        );
      }

      if (studentData?.associatedCourses?.length === 0) {
        return next(new AppError("Db is not sync correctly", 500));
      }

      studentData.associatedCourses = studentData?.associatedCourses?.filter(
        ({ _id: id }) => {
          console.log(
            String(id),
            String(courseId),
            String(id) === String(courseId)
          );
          return String(id) !== String(courseId);
        }
      );

      studentData.associatedReviews = studentData?.associatedReviews?.filter(
        (val) => {
          return !allReviews.some(
            (review) => String(review._id) === String(val)
          );
        }
      );

      await studentData.save();

      next();
    });

    // DIVIDER 4 : sync Associated Reviews
  } catch (err) {
    globalAsyncCatch(err, next);
  }
};

export const deleteCourseById = deleteOneDocument<CourseInterface>(CourseModel);

// FUNCTION-GROUP
export const getCoursesStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courses = await CourseModel.aggregate([
      {
        $group: {
          _id: "$difficulty",
          totalDocsScanned: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          averageRating: { $avg: "$averageRating" },
          averageDuration: { $avg: "$duration" },
          ratingsQuantity: { $avg: "$ratingsQuantity" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        courses,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

export const getBestCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bestCourse = await CourseModel.aggregate([
      {
        $group: {
          _id: "$averageRating",
          name: { $first: "$name" },
          instructor: { $first: "$instructor" },
          averageRating: { $first: "$averageRating" },
        },
      },
      {
        $sort: { averageRating: -1 },
      },
      {
        $project: { name: 1, instructor: 1, averageRating: 1, _id: 0 },
      },
      {
        $limit: 1,
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        bestCourse,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

export const aliasTop5Courses = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  //?limit=5&sort=-ratingsAverage

  req.query.limit = "5";
  req.query.sort = "-ratingsAverage";

  next();
};

export const aliasTop5Cheapest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.query.limit = "5";
  req.query.sort = "price";

  next();
};

export const aliasTop5Longest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.query.limit = "5";
  req.query.sort = "-duration";

  next();
};

export const paymentConfirmed = (): boolean => {
  return true;
};

export const buyCourse = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : check if payment is confirmed
    if (!paymentConfirmed()) {
      return next(new AppError("Payment not confirmed", 400));
    }

    // 2 : update the course and user
    if (!req.query.courseId) {
      return next(new AppError("Course id not provided", 400));
    }

    const { courseId } = req.query;

    const updatedCourse = await CourseModel.findByIdAndUpdate(
      courseId,
      { $addToSet: { students: req.user?.id } },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedCourse) {
      return next(new AppError("Error in updating course", 500));
    }

    // 3 : update the user
    if (!req.user?.id) {
      return next(new AppError("User id not found in request object", 500));
    }
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.user?.id,
      { $addToSet: { associatedCourses: updatedCourse._id } },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedUser) {
      return next(new AppError("Error in updating user", 500));
    }

    res.status(200).json({
      status: "success",
      data: {
        updatedCourse,
        updatedUser,
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};
