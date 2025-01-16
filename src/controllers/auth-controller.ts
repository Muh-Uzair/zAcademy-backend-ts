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

interface CustomRequest extends Request {
  user?: UserInterface;
}

let tokenGlobal = "";

// FUNCTION
const signToken = (id: string): string | null => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  const token: string = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "6d",
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

// FUNCTION
export const protect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1 : check if there is authorization in headers
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return next(
      new AppError("No request headers or invalid authorization format", 400)
    );
  }

  // --> take the token out the headers
  const receivedToken = req.headers.authorization.split(" ")[1];

  try {
    if (!receivedToken || !process.env.JWT_SECRET) {
      throw new AppError("Either token or secret is invalid", 400);
    }

    // 2 : verify token
    const decodedToken = jwt.verify(receivedToken, process.env.JWT_SECRET);

    if (typeof decodedToken !== "object" || !decodedToken.id) {
      throw new AppError(
        "Invalid decoded token or id does not exist on decoded token",
        500
      );
    }

    const { id } = decodedToken;

    // 3 : check the user against the id in the token
    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError(`No user for id ${id}`, 400);
    }

    // 4 : check if the user has change the password after the token was issued
    if (user.checkPasswordChangedAfter(decodedToken.iat as number)) {
      throw new AppError("User have recently changes the password", 401);
    }

    req.user = user;

    next();
  } catch (err) {
    globalAsyncCatch(err, next);
  }
};
