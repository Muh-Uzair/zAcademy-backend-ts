import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

import Email from "../utils/email";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { AppError } from "../utils/app-error";
import { UserInterface, UserModel } from "../models/users-model";

interface interfaceDecodedToken {
  id: string;
  iat: number;
  exp: number;
}

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION
const signToken = (id: string): string | null => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  const token: string = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "6d",
  });

  const encodedToken = jwt.decode(token);

  return token;
};

// FUNCTION
const cookieAndResponse = (
  req: Request,
  res: Response,
  next: NextFunction,
  actualResponse: object,
  id: string
) => {
  // 1 : sign a token
  const jwt: string | null = signToken(id);

  if (!jwt) {
    return next(new AppError("Unable to generate jwt token", 500));
  }

  res.cookie("jwt", jwt, {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRES_TIME) * 24 * 60 * 60 * 1000
    ),
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    httpOnly: true,
  });

  // 3 : send a response
  res.status(200).json({ ...actualResponse, jwt });
};

// FUNCTION
export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : take the role from the request body
    const role = req.body?.role;

    // 2 : check if role is provided
    if (!role) {
      return next(new AppError("Provide role to signup", 400));
    }

    // 3 : check if role is teacher or student
    if (role !== "teacher" && role !== "student") {
      return next(new AppError("Role can only be teacher or student", 400));
    }

    const newUser: UserInterface = await UserModel.create(req.body);

    // 2 : sign a JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    // 3 : send a response with JWT  in cookie
    cookieAndResponse(
      req,
      res,
      next,
      {
        status: "success",
        data: {
          newUser,
        },
      },
      newUser.id
    );
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
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
        if (user?.passwordChangedDate) {
          await UserModel.updateOne(
            { _id: String(user?._id) },
            { $unset: { passwordChangedDate: 1 } }
          );
        }

        cookieAndResponse(
          req,
          res,
          next,
          { status: "success", data: { user } },
          String(user?._id)
        );
      }
    }
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
export const protect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1 : check if there is authorization in headers
  if (
    (!req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer")) &&
    !req.cookies.jwt
  ) {
    return next(new AppError("Jwt is invalid or missing", 400));
  }

  // --> take the token out the headers
  const receivedToken =
    (req.headers?.authorization
      ? req.headers.authorization.split(" ")[1]
      : null) || req.cookies?.jwt;

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
      if (
        !user.passwordChangedDate ||
        !(user.passwordChangedDate instanceof Date)
      ) {
        return next(
          new AppError("passwordChangeDate does not exist on user", 500)
        );
      }
      const dateString: string | Date = user.passwordChangedDate;
      const date: Date = new Date(dateString);
      const unixTimestamp: number = Math.floor(date.getTime() / 1000);
      throw new AppError(
        `User have recently changes the password. Token issue time (iat) : ${decodedToken.iat} | Password change date : ${unixTimestamp}  `,
        401
      );
    }

    req.user = user;

    next();
  } catch (err) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION
export const restrictTo = (rolesArr: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    let flag: boolean = false;

    for (let i = 0; i < rolesArr.length; i++) {
      if (req?.user?.role === rolesArr[i]) {
        flag = true;
      }
    }

    if (!flag) {
      return next(
        new AppError(
          `${req?.user?.role} is not authorized to perform this action`,
          403
        )
      );
    }

    next();
  };
};

// FUNCTION
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : get user based on e-mail
    if (!req.body.email) {
      return next(new AppError("Email must be provided in body", 400));
    }

    const user = await UserModel.findOne({
      email: req.body.email,
    });

    if (!user) {
      return next(new AppError(`No user for email ${req.body.email}`, 400));
    }

    // 2 : generate the random reset token
    const originalResetToken = user.createPasswordResetToken();

    if (!originalResetToken) {
      return next(new AppError("Error in generating reset token", 500));
    }

    // 3 : save the user bcz we added some properties on user in above instance method
    user.save();

    // 3 : send that token to user via email
    // await sendEmail({
    //   email: user.email,
    //   subject: "Reset token is valid 10 mins only",
    //   message: `make request to ${req.protocol}://${req.get(
    //     "host"
    //   )}/api/users/reset-password/${originalResetToken}`,
    // });

    await new Email(
      '"Muhammad Uzair" <admin@zAcademy.io>',
      user.email as string
    ).sendResetEmail("Reset token is valid 10 mins only", "email-template", {
      resetToken: originalResetToken,
    });

    res.status(200).json({
      status: "success",
      data: {
        message: `Token has been successfully sent to your email ${user?.email}`,
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION this will be performed y user whi us not logged in
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : take the random token out of params
    const originalRandomToken = req.params.resetToken;

    // 2 : encode that token
    const encodedToken = crypto
      .createHash("sha256")
      .update(originalRandomToken)
      .digest("hex");

    // 3 : check a user against that token
    const user: UserInterface | null = await UserModel.findOne({
      passwordResetToken: encodedToken,
      passwordResetExpires: { $gte: Date.now() },
    });

    if (!user) {
      return next(
        new AppError("Either invalid token or the token has been expired", 400)
      );
    }

    if (!req.body.password || !req.body.confirmPassword) {
      return next(
        new AppError(
          "Either password or confirm password is missing in body",
          400
        )
      );
    }

    // 4 : update the properties of the user
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordChangedDate = new Date(Date.now() + 20000);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    if (!user._id) {
      return next(new AppError("_id does not exist on user", 500));
    }

    // 5 : generate a jwt for login
    const jwtToken = signToken(user?._id as string);

    res.status(200).json({
      status: "success",
      jwtToken,
      user,
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION update logged in user password jonas
export const updatePassword = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 :  take the use from the request object
    if (!req.user || !req.user.id) {
      return next(new AppError("Provide user on req object", 400));
    }

    const user = await UserModel.findById(req.user.id).select("+password");

    if (!user) {
      return next(new AppError("No user found", 401));
    }

    // 2 :  check that the current password in req body matched the one stored in db
    if (!req.body.currentPassword) {
      return next(new AppError("Provide current password on user object", 400));
    }
    const passwordMatch = await user.comparePassword(req.body.currentPassword);

    if (!passwordMatch) {
      return next(new AppError("Provided current password is incorrect", 401));
    }

    // 3 :  update properties on user object
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordChangedDate = new Date(Date.now() + 20000);
    await user.save();

    // 4 :  generate token
    if (!user.id) {
      return next(new AppError("No id on user object", 500));
    }

    cookieAndResponse(
      req,
      res,
      next,
      { status: "success", data: { user } },
      user?._id as string
    );
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION
export const logout = (req: Request, res: Response, next: NextFunction) => {
  res.cookie("jwt", "user-logged-out", {
    expires: new Date(Date.now() + 10000),
    httpOnly: true,
  });

  res.status(200).json({
    status: "success",
  });
};
