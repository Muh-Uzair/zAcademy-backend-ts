import mongoose from "mongoose";

interface InterfaceReqBody {
  _id?: number | string | mongoose.Types.ObjectId;
  id?: number | string;
  createdAt?: Date;
  updatedAt?: Date;
  passwordChangedDate?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  [key: string]: any;
}

export const checkInvalidProperties = (reqBody: InterfaceReqBody) => {
  let flag = false;

  if (
    reqBody._id ||
    reqBody.id ||
    reqBody.createdAt ||
    reqBody.updatedAt ||
    reqBody.passwordChangedDate ||
    reqBody.passwordResetToken ||
    reqBody.passwordResetExpires
  ) {
    flag = true;
  }

  return flag;
};
