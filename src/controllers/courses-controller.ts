import { Request, Response, NextFunction } from "express";
import { CourseInterface, CourseModel } from "../models/courses-model";

// FUNCTION
export const getAllCourses = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // 1 : building

    console.log("Raw query object");
    console.log(req.query);

    // --->
    // creating an empty query object
    let queryURLObj: Record<string, string | number | object> = {};

    // remove any undefined or those 4 words from query query object
    Object.entries(req.query).forEach(([key, val]) => {
      if (
        val !== undefined &&
        val !== "" &&
        key !== "sort" &&
        key !== "field" &&
        key !== "limit" &&
        key !== "page"
      ) {
        queryURLObj[key] = val;
      }
    });
    console.log(
      "After removing sort, field, limit, page etc from the raw query object",
    );
    console.log(queryURLObj);

    // advance filtering for eg {lte} {gte} {lt} {gt}
    let queryURLSt = JSON.stringify(queryURLObj);
    queryURLSt = queryURLSt.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );

    queryURLObj = JSON.parse(queryURLSt);

    console.log(queryURLObj);

    // --->
    const queryObj = CourseModel.find(queryURLObj).exec();

    // 2 : executing query
    const courses: CourseInterface[] = await queryObj;

    // 3 : sending response

    res.status(200).json({
      status: "success",
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
