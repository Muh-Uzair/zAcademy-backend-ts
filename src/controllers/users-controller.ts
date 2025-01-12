import { NextFunction, Request, Response } from "express";
import { UserInterface, UserModel } from "../models/users-model";
import { globalAsyncCatch } from "../utils/global-async-catch";

// FUNCTION
export const getAllUsers = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).json({
    status: "success",
    data: {
      message: "/api/user get 200",
    },
  });
};
