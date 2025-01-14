import { NextFunction, Request, Response } from "express";
import { UserInterface, UserModel } from "../models/users-model";
import { globalAsyncCatch } from "../utils/global-async-catch";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/app-error";
import bcrypt from "bcryptjs";
import { type } from "node:os";

interface interfaceDecodedToken {
  id: string;
  iat: number;
  exp: number;
}

// FUNCTION
const signToken = (id: string): string | null => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  const token: string = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: 86400000,
  });

  const encodedToken = jwt.decode(token);
  console.log(
    `secret-type ${typeof process.env.JWT_SECRET} secret-length ${
      process.env.JWT_SECRET.length
    }`
  );
  console.log(process.env.JWT_SECRET);
  console.log(`token-type${typeof token} token-length${token.length}`);
  console.log(token);

  console.log(encodedToken);

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

// FUNCTION
export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token: string | null = null;
  // 1 : get the token from the header received in the request
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1].trim();
  }

  if (!token) {
    return next(new AppError("Provide token in request headers", 401));
  }

  // 2 : now if token exist than check that the token is not expired
  // and also check that some has not changed the payload of token
  console.log("step 2 : start");

  // -> check the jwt secret exists
  if (!process.env.JWT_SECRET) {
    return next(new AppError("Invalid jwt secret", 401));
  }
  // --> verify the token
  console.log(
    `secret-type ${typeof process.env.JWT_SECRET} secret-length ${
      process.env.JWT_SECRET.length
    }`
  );
  console.log(process.env.JWT_SECRET);
  console.log(`token-type ${typeof token} token-length ${token.length}`);
  console.log(token);
  const encodedToken1 = jwt.decode(token);
  console.log(encodedToken1);

  next();
};

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODUxOWJjZWUwM2UwM2NlYjQwNTDNEpUTHQoQUJMHLrErGJyHg89uy71MyuHwIjoxNzM2ODYyNTI1fQ.5n7Z-rYzCQnpWUe3ppAc9RTNixht33gYNEUHcnNn6AI
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODUxOWJjZWUwM2UwM2NlYjQwNTDNEpUTHQoQUJMHLrErGJyHg89uy71MyuHwIjoxNzM2ODYyNTY4fQ.srmYeeTRpqN-lDjfRkYhO_j7AvxKw6VQZ0UPYyJC6xU
