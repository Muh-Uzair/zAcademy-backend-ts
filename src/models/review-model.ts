import mongoose, { Schema } from "mongoose";
import { isAlpha, isNumber } from "../utils/validation-functions";
import { model } from "mongoose";
import { Document } from "mongoose";

interface ReviewInterface extends Document {
  review: string;
  rating: Number;
  createdAt?: Date;
  associatedCourse?: mongoose.Types.ObjectId;
  associatedUser?: mongoose.Types.ObjectId;
}

const reviewSchema = new Schema<ReviewInterface>(
  {
    review: {
      type: String,
      trim: true,
      required: [true, "Review is required"],
      minlength: [3, "Review should not be less than 3 characters"],
      maxlength: [100, "Review should not exceed 100 characters"],
      validate: {
        validator: (val: string) => isAlpha(val),
        message: "Review must contain only alphabetic characters and spaces",
      },
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating should not be less than 1"],
      max: [5, "Rating should not increase 10"],
      validate: {
        validator: (val: Number) => isNumber(val),
        message: "Rating should of type number",
      },
    },
    createdAt: {
      type: Date,
      default: new Date(Date.now()),
      select: false,
    },
    associatedCourse: { type: Schema.Types.ObjectId, ref: "Course" },
    associatedUser: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);

const ReviewModel = model<ReviewInterface>("Review", reviewSchema);

export { ReviewModel, ReviewInterface };
