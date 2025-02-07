import multer from "multer";
import sharp from "sharp";

import { NextFunction, Request, Response } from "express";
import { UserInterface, UserModel } from "../models/users-model";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { AppError } from "../utils/app-error";
import { errorMonitor } from "events";
import { getAllDocs, getOneDoc, updateOneDocument } from "./handlerFactory";
import { FileFilterCallback } from "multer";

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION
export const getAllUsers = getAllDocs<UserInterface>(UserModel);

interface InterfaceUpdateObject {
  photo?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  qualification?: string;
}

// FUNCTION
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

// FUNCTION-GROUP update the currently logged in user
const multerStorage = multer.memoryStorage();

// check wether the provided file is an image or not
const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("The provide file is not an image", 400));
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

export const uploadUserPhoto = upload.single("photo");

export const resizeUserImage = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : if the do not want to change the images just exe the next MW
    if (!req.file) return next();

    // 2 : change the file name
    if (!req.user) {
      return next(new AppError("You are not logged in! Please login", 401));
    }

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

    // 3 :
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/images/users/${req.file.filename}`);

    next();
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

export const opBeforeUpdatingUserData = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : check if user have send passwords
    if (req.body.password || req.body.confirmPassword) {
      return next(new AppError("This route is not for changing password", 400));
    }

    // 2 :  correct the format of received of req body
    const correctedObj = correctBodyForUpdate(req.body, [
      "name",
      "email",
      "phoneNumber",
      "qualification",
    ]);

    // 3 : fetch the user based on id
    if (!req.user?.id) {
      return next(new AppError("User id does not exist in user object", 500));
    }

    req.params.id = req.user?.id;

    if (req.file?.filename) {
      req.body = { ...correctedObj, photo: req.file?.filename };
    } else {
      req.body = { ...correctedObj };
    }

    next();
  } catch (err) {
    globalAsyncCatch(err, next);
  }
};

export const updateUserData = updateOneDocument<UserInterface>(UserModel);

// FUNCTION-GROUP
export const opBeforeGettingUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : take user id from params
    const userIdParams = req.params.id;

    if (!userIdParams) {
      return next(new AppError("Provide user id", 400));
    }

    // 2 : take user id out of req.user
    const userIqReq = req.user?.id;

    if (!userIqReq) {
      return next(new AppError("Provide user id", 401));
    }

    if (userIdParams === userIqReq) {
      next();
    } else {
      return next(
        new AppError("You are not authorized to perform this action", 401)
      );
    }
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

export const getUserDataOnId = getOneDoc<UserInterface>(UserModel);
