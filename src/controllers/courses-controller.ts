import { Request, Response, NextFunction } from "express";
import { CourseInterface, CourseModel } from "../models/courses-model";
import { apiFeatures } from "../utils/api-features";
import { AppError } from "../utils/app-error";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { UserInterface } from "../models/users-model";

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
export const checkIdExist = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.body?.id) {
    next(new AppError("id should not be sent when creating course", 400));
  } else {
    next();
  }
};

// FUNCTION
export const createCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newCreatedCourse = await CourseModel.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        newCreatedCourse,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
export const checkIdValid = async (
  req: Request,
  res: Response,
  next: NextFunction,
  val: string
): Promise<void> => {
  if (!/^[1-9]$/.test(val)) {
    next(new AppError(`${val} is invalid course id`, 400));
  } else {
    const allCoursesLength: number = await CourseModel.countDocuments();
    req.body.allCoursesLength = allCoursesLength;

    if (Number(val) > allCoursesLength) {
      next(new AppError(`${val} is invalid course id`, 400));
    } else {
      next();
    }
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const course = await CourseModel.find({
      $or: [
        { id: { $eq: req.params.id } },
        { id: { $eq: Number(req.params.id) } },
      ],
    });

    res.status(200).json({
      status: "success",
      data: {
        course: course[0],
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
