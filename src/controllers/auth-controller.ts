import * as jose from "jose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";

import { sendEmail } from "../routes/email";
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
    console.log(rolesArr);

    let flag: boolean = false;

    for (let i = 0; i < rolesArr.length; i++) {
      if (req?.user?.role === rolesArr[i]) {
        flag = true;
      }
    }

    if (!flag) {
      return next(
        new AppError(
          `${req?.user?.role} is not authorized to delete a course`,
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
    await sendEmail({
      email: user.email,
      subject: "Reset token is valid 10 mins only",
      message: `make request to ${req.protocol}://${req.get(
        "host"
      )}/api/users/reset-password/${originalResetToken}`,
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

// FUNCTION logged in user updates password
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : tke the jwt token from headers
    const receivedJwtToken: string | undefined | null =
      req.headers.authorization?.split(" ")[1];

    if (!receivedJwtToken) {
      return next(
        new AppError("Jwt token was not provided in request headers", 400)
      );
    }

    // 2 : check the validity of received token
    const jwtSecret: string | null | undefined = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return next(new AppError("Unable to get jwt secret", 500));
    }

    // 3 : verify the received toke
    const decodedToken = jwt.verify(receivedJwtToken, jwtSecret);

    if (!decodedToken || typeof decodedToken !== "object") {
      return next(new AppError("Invalid jwt", 401));
    }

    // 4 : check wether the token has expired or not
    if (decodedToken.exp && decodedToken?.exp < Math.floor(Date.now() / 1000)) {
      return next(new AppError("The current token has been expired", 401));
    }

    // 5 : if token is not expired than set/update the password to received password
    if (!req.body.password || !req.body.confirmPassword) {
      return next(
        new AppError(
          "Provide password and confirmPassword both in request body",
          400
        )
      );
    }

    const user: UserInterface | null | undefined = await UserModel.findById(
      decodedToken?.id
    );

    if (!user) {
      return next(new AppError("No user for provided jwt", 401));
    }

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordChangedDate = new Date(Date.now() + 20000);
    await user.save();

    const jwtToken = signToken(user._id as string);

    res.status(200).json({
      status: "success",
      data: {
        jwtToken: receivedJwtToken,
        user,
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};
