import { NextFunction, Request, Response } from "express";
import { UserInterface, UserModel } from "../models/users-model";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { AppError } from "../utils/app-error";

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allUsers = await UserModel.find().populate("associatedCourses");
    res.status(200).json({
      status: "success",
      data: {
        allUsers,
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

interface InterfaceUpdateObject {
  photo?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
}

const correctBodyForUpdate = (
  reqBody: { [key: string]: string },
  keepFieldsArr: string[]
): InterfaceUpdateObject => {
  let newObj: InterfaceUpdateObject = {};

  Object.keys(reqBody).forEach((val) => {
    if (keepFieldsArr.includes(val)) {
      newObj[val as keyof InterfaceUpdateObject] = reqBody[val];
    }
  });

  return newObj;
};

// FUNCTION update the currently logged in user
export const updateLoggedUserData = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : check is user have send passwords
    if (req.body.password || req.body.confirmPassword) {
      return next(new AppError("This route is not for changing password", 400));
    }

    // 2 :  correct the format of received of req body
    const correctedObj = correctBodyForUpdate(req.body, [
      "photo",
      "name",
      "email",
      "phoneNumber",
    ]);

    // 3 : fetch the user based on id
    if (!req.user?.id) {
      return next(new AppError("User id does not exist in user object", 500));
    }

    const user = await UserModel.findByIdAndUpdate(req.user?.id, correctedObj, {
      returnDocument: "after",
      runValidators: true,
    });

    res.status(200).json({
      status: "success",
      data: {
        user,
      },
    });
  } catch (err) {
    globalAsyncCatch(err, next);
  }
};
