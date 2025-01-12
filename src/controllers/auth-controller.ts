import { NextFunction, Request, Response } from "express";
import { UserInterface, UserModel } from "../models/users-model";
import { globalAsyncCatch } from "../utils/global-async-catch";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/app-error";
import bcrypt from "bcryptjs";

//FUNCTION
const signToken = (id: string): string | null => {
  return id && process.env.JWT_SECRET
    ? jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" })
    : null;
};

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
    const token: string | null = signToken(newUser.id);

    if (!token) {
      return next(new AppError("Unable to generate jwt token", 500));
    }
    // 3 : send a response with JWT token
    res.status(200).json({
      status: "success",
      jwtToken: token,
      data: {
        //www.youtube.com/watch?list=LL&v=9XaS93WMRQQ
        https: newUser,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

//  FUNCTION
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : check is req.body contain user name or passwords
    if (!req.body.email || !req.body.password) {
      next(new AppError("Please provide email and passwords", 400));
    } else {
      console.log(req.body.email, req.body.password);

      // 2 : check is user exists
      const user: UserInterface | null = await UserModel.findOne({
        email: req.body.email,
      }).select("+password");

      console.log(user);

      // 3 : compare the received password with password in db
      const passwordCorrect = user?.password
        ? await bcrypt.compare(req.body.password, user.password)
        : false;

      console.log("_____________________________________________________");
      console.log(passwordCorrect);

      // 4 : send response accordingly
      if (!user || !passwordCorrect) {
        next(new AppError("Incorrect email or password", 400));
      } else {
        const token: string | null = signToken(user._id as string);

        if (!token) {
          return next(new AppError("Unable to generate jwt token", 500));
        }
        res.status(200).json({
          status: "success",
          token,
          data: {
            user,
          },
        });
      }
    }
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};
