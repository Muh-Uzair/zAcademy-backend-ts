import { Request, Response } from "express";

export const getCourses = (req: Request, res: Response): void => {
  res.status(200).json({
    status: "success",
    data: {
      message: "/api/courses",
    },
  });
};

export const createCourses = (req: Request, res: Response): void => {
  res.status(200).json({
    status: "success",
    data: {
      message: "/api/courses/post",
    },
  });
};
