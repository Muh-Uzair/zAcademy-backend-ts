import { Request, Response, NextFunction } from "express";
import { CourseInterface, CourseModel } from "../models/courses-model";
import { apiFeatures } from "../utils/api-features";
import { AppError } from "../utils/app-error";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { UserInterface, UserModel } from "../models/users-model";

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION
export const getAllCourses = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    //
    const apiFeaturesObj = new apiFeatures(CourseModel.find(), req.query)
      .sorting()
      .projection()
      .limiting();

    await apiFeaturesObj.pagination();

    const courses: CourseInterface[] = await apiFeaturesObj.query;

    if (courses.length === 0 && !courses) {
      next(new AppError("No courses found", 404));
    }

    res.status(200).json({
      status: "success",
      results: courses.length,
      user: req.user,
      data: {
        courses,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
export const createCourse = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : check for the user in request object
    if (!req.user?.id) {
      next(new AppError("No user in request oject", 500));
    }

    // 2 : take the id out of the request body
    const authUserId = req.user?.id;

    // 3 : take the user object from the DB
    const instructor = await UserModel.findById(authUserId).select(
      "name email qualification location associatedCourses"
    );

    if (!instructor) {
      return next(new AppError("Error in finding user with provided id", 500));
    }

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
      instructor?._id,
      {
        associatedCourses: [
          ...(instructor?.associatedCourses || []),
          newCreatedCourse?._id,
        ],
      },
      { returnDocument: "after", runValidators: true }
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
export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params.id;

    if (!courseId) {
      return next(new AppError("Course id not provided", 400));
    }

    const course = await CourseModel.findOne({ _id: courseId });

    if (!course) {
      return next(new AppError("Course not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        course,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
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
    const course: Course | null = await CourseModel.findOne({
      id: Number(req.params.id),
    })
      .select("price")
      .lean();

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

// FUNCTION
export const updateCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const updatedCourse = await CourseModel.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        updatedCourse,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
export const deleteCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await CourseModel.deleteOne({ id: Number(req.params.id) });

    res.status(204).json({
      status: "success",
      message: `deleted course with id ${req.params.id}`,
      data: null,
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
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

// FUNCTION
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

// FUNCTION
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

// FUNCTION
export const aliasTop5Cheapest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.query.limit = "5";
  req.query.sort = "price";

  next();
};

// FUNCTION
export const aliasTop5Longest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.query.limit = "5";
  req.query.sort = "-duration";

  next();
};

// FUNCTION
export const paymentConfirmed = (): boolean => {
  return true;
};

// FUNCTION
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
