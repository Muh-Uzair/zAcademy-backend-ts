import mongoose, { Model, Schema } from "mongoose";
import { isAlpha, isNumber } from "../utils/validation-functions";
import { model } from "mongoose";
import { Document } from "mongoose";
import { CourseModel } from "./courses-model";

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

reviewSchema.post("save", async function (): Promise<void> {
  console.log("__________________________________this");
  console.log(this);
  // 1 : model
  const ReviewModel = this.constructor as Model<ReviewInterface>;

  const stats = await ReviewModel.aggregate([
    {
      $match: { associatedCourse: this?.associatedCourse },
    },
    {
      $group: {
        _id: "$associatedCourse",
        ratingsQuantity: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  const calculatedAvgRat = stats[0].averageRating;
  const calculatedRatingsQuantity = stats[0].ratingsQuantity;

  await CourseModel.findByIdAndUpdate(this?.associatedCourse, {
    averageRating: calculatedAvgRat,
    ratingsQuantity: calculatedRatingsQuantity,
  });

  console.log("_______________________________stats");
  console.log(stats);
});

const ReviewModel = model<ReviewInterface>("Review", reviewSchema);

export { ReviewModel, ReviewInterface };
