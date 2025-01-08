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

// FUNCTION
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const newUser: UserInterface = await UserModel.create(req.body);

    res.status(200).json({
      status: "success",
      data: {
        newUser,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};
