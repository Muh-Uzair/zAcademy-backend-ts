import { Request, Response, NextFunction } from "express";
import { CourseInterface, CourseModel } from "../models/courses-model";
import { Query } from "mongoose";
import { apiFeatures } from "../utils/apiFeatures";

// FUNCTION
export const getAllCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    //
    const apiFeaturesObj = new apiFeatures(CourseModel.find(), req.query)
      .sorting()
      .projection()
      .limiting();

    await apiFeaturesObj.pagination();

    const courses: CourseInterface[] = await apiFeaturesObj.query;

    res.status(200).json({
      status: "success",
      results: courses.length,
      data: {
        courses,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unexpected error occurred.",
      });
    }
  }
};

// FUNCTION
export const checkIdExist = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.body?.id) {
    res.status(400).json({
      status: "fail",
      message: "id should not be sent in the course creation",
    });
  } else {
    next();
  }
};

// FUNCTION
export const createCourse = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // 1 : get all the course
    const allCourse: CourseInterface[] = await CourseModel.find();

    // 2 : find the new course id
    const courseId: number = allCourse.length + 1;

    // 3 : create a new course
    const newCourseObj: CourseInterface = { id: courseId, ...req.body };

    const newCreatedCourse: CourseInterface =
      await CourseModel.create(newCourseObj);
    res.status(201).json({
      status: "success",
      data: {
        newCreatedCourse,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unexpected error occurred.",
      });
    }
  }
};

// FUNCTION
export const checkIdValid = async (
  req: Request,
  res: Response,
  next: NextFunction,
  val: string,
): Promise<void> => {
  const allCoursesLength: number = await CourseModel.countDocuments();
  req.body.allCoursesLength = allCoursesLength;

  if (Number(val) > allCoursesLength) {
    res.status(500).json({
      status: "fail",
      message: `${val} is invalid course id`,
    });
  } else {
    next();
  }
};

export const getCourseById = async (
  req: Request,
  res: Response,
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
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unexpected error occurred.",
      });
    }
  }
};

// FUNCTION
export const updateCourseById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const updatedCourse = await CourseModel.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      status: "success",
      data: {
        updatedCourse,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unexpected error has occurred",
      });
    }
  }
};

// FUNCTION
export const deleteCourseById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await CourseModel.deleteOne({ id: Number(req.params.id) });

    res.status(204).json({
      status: "success",
      message: `deleted course with id ${req.params.id}`,
      data: null,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unexpected error has occurred",
      });
    }
  }
};

// FUNCTION
export const aliasTop5Courses = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //?limit=5&sort=-ratingsAverage

  req.query.limit = "5";
  req.query.sort = "-ratingsAverage";

  next();
};

// FUNCTION
export const aliasTop5Cheapest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.query.limit = "5";
  req.query.sort = "price";

  next();
};

// FUNCTION
export const aliasTop5Longest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.query.limit = "5";
  req.query.sort = "-duration";

  next();
};

// FUNCTION
export const getAllCoursesRef = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // 1 : building

    // --->
    // creating an empty query object
    let queryURLObj: Record<string, string | number | object> = {};

    // remove any undefined or those 4 words from query query object
    Object.entries(req.query).forEach(([key, val]) => {
      if (
        val !== undefined &&
        val !== "" &&
        key !== "sort" &&
        key !== "fields" &&
        key !== "limit" &&
        key !== "page"
      ) {
        queryURLObj[key] = val;
      }
    });

    // advance filtering for eg {lte} {gte} {lt} {gt}
    let queryURLSt: string = JSON.stringify(queryURLObj);
    queryURLSt = queryURLSt.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );

    queryURLObj = JSON.parse(queryURLSt);

    // --->
    let query: Query<CourseInterface[], CourseInterface> =
      CourseModel.find(queryURLObj);

    // implement sorting
    if (req.query.sort) {
      const sortingOptionsArr: string[] =
        typeof req.query.sort === "string" ? req.query.sort.split(",") : [];
      query = query.sort(sortingOptionsArr.join(" "));
    } else {
      query = query.sort("createdAt");
    }

    // field projection , sending some fields and not sending some fields
    if (req.query.fields) {
      query = query.select(req.query.fields.toString().split(",").join(" "));
    } else {
      query = query.select("-__v -updatedAt");
    }

    if (req.query.limit) {
      const limit: number = Number(req.query.limit);
      query = query.limit(limit);
    }

    // pagination
    if (req.query.page) {
      const page: number = Number(req.query.page);
      const limit: number = 4;
      const skip: number = (page - 1) * limit;

      const totalCourses: number = await CourseModel.countDocuments();
      if (skip >= totalCourses) {
        throw new Error("This page does not exist");
      }

      query = query.skip(skip).limit(limit);
    }

    // 2 : executing query
    const courses: CourseInterface[] = await query;

    // 3 : sending response

    res.status(200).json({
      status: "success",
      results: courses.length,
      data: {
        courses,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        status: "fail",
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: "fail",
        message: "An unexpected error occurred.",
      });
    }
  }
};
