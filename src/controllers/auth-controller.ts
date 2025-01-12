import { NextFunction, Request, Response } from "express";
import { UserInterface, UserModel } from "../models/users-model";
import { globalAsyncCatch } from "../utils/global-async-catch";
import jwt from "jsonwebtoken";

// FUNCTION
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : create a user in DB with encrypted passwords
    const newUser: UserInterface = await UserModel.create(req.body);

    // 2 : sign a JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const token: string = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    // 3 : send a response with JWT token
    res.status(200).json({
      status: "success",
      jwtToken: token,
      data: {
        newUser,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};
