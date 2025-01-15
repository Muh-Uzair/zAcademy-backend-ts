import { NextFunction, Request, Response } from "express";
import { UserInterface, UserModel } from "../models/users-model";
import { globalAsyncCatch } from "../utils/global-async-catch";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/app-error";
import bcrypt from "bcryptjs";
import { type } from "node:os";
import * as jose from "jose";

interface interfaceDecodedToken {
  id: string;
  iat: number;
  exp: number;
}

let tokenGlobal = "";

// FUNCTION
const signToken = (id: string): string | null => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  const token: string = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: 86400000,
  });

  tokenGlobal = token;

  const encodedToken = jwt.decode(token);
  console.log(
    `secret-type ${typeof process.env.JWT_SECRET} secret-length ${
      process.env.JWT_SECRET.length
    }`
  );
  console.log(process.env.JWT_SECRET);
  console.log(`token-type ${typeof token} token-length ${token.length}`);
  console.log(token);

  console.log(encodedToken);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    console.log(decoded);
  });

  return token;
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
    console.log(token);

    if (!token) {
      return next(new AppError("Unable to generate jwt token", 500));
    }
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
      // 2 : check is user exists
      const user: UserInterface | null = await UserModel.findOne({
        email: req.body.email,
      }).select("+password");

      // 3 : compare the received password with password in db
      const passwordCorrect = user?.password
        ? await bcrypt.compare(req.body.password, user.password)
        : false;

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

interface interfaceDecodedToken {
  id: string;
  iat: number;
  exp: number;
}

//FUNCTION
export const protect = (req: Request, res: Response, next: NextFunction) => {
  // 1 : check is there are headers
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return next(
      new AppError("No request headers or invalid authorization format", 400)
    );
  }

  const receivedToken = req.headers.authorization.split(" ")[1];

  console.log(receivedToken);
  console.log(tokenGlobal);
  console.log(receivedToken === tokenGlobal);
  console.log(receivedToken.length === tokenGlobal.length);

  try {
    if (!process.env.JWT_SECRET) {
      next(new AppError("no jwt token", 401));
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }
    const decodedToken = jwt.verify(tokenGlobal, process.env.JWT_SECRET);
    console.log(decodedToken);
  } catch (err) {
    globalAsyncCatch(err, next);
  }

  console.log(receivedToken);

  next();
};
