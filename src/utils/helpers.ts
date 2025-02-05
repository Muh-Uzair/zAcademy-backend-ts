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
