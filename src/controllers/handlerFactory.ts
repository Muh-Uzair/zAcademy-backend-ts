import { NextFunction, Request, Response } from "express";
import mongoose, { Model, Document } from "mongoose";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { AppError } from "../utils/app-error";

export const deleteOneDocument =
  <T extends Document>(Model: Model<T>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const docId = new mongoose.Types.ObjectId(req.params.id);

      if (!docId) {
        return next(new AppError("Document id not provided", 400));
      }

      const doc = await Model.findByIdAndDelete(docId);

      if (!doc) {
        return next(
          new AppError(`No document found with that id ${docId} `, 404)
        );
      }

      res.status(204).json({
        status: "success",
        message: `Document with id ${docId} has been deleted`,
      });
    } catch (err: unknown) {
      globalAsyncCatch(err, next);
    }
  };
