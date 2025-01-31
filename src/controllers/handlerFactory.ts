import { NextFunction, Request, Response } from "express";
import mongoose, { Model, Document } from "mongoose";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { AppError } from "../utils/app-error";

// FUNCTION
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

// FUNCTION
export const updateOneDocument =
  <T extends Document>(Model: Model<T>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1 : take id out of the params
      const { id } = req.params;

      if (!id) {
        return next(new AppError("Document id is not provided", 400));
      }

      // 2 : update the document of provided id
      const updatedDoc = await Model.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedDoc) {
        return next(new AppError("No document for the provided id", 400));
      }

      // 3 : return a response
      res.status(200).json({
        status: "success",
        updatedDoc,
      });
    } catch (err: unknown) {
      globalAsyncCatch(err, next);
    }
  };

// FUNCTION
export const getOneDoc =
  <T extends Document>(Model: Model<T>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        return next(new AppError("Document id is not provided", 400));
      }

      const doc = await Model.findById(id);

      if (!doc) {
        return next(new AppError("No document found with provided id", 400));
      }

      res.status(200).json({
        status: "success",
        data: {
          doc,
        },
      });
    } catch (err: unknown) {
      globalAsyncCatch(err, next);
    }
  };
