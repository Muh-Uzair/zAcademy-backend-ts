import mongoose, { Model, Schema } from "mongoose";
import { isAlpha, isNumber } from "../utils/validation-functions";
import { model } from "mongoose";
import { Document } from "mongoose";
import { CourseModel } from "./courses-model";
import { AppError } from "../utils/app-error";
import { globalAsyncCatch } from "../utils/global-async-catch";

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

// FUNCTION-GROUP
async function calculateStats(this: Document & ReviewInterface): Promise<void> {
  const ReviewModel = this.constructor as Model<ReviewInterface>;

  const stats = await ReviewModel.aggregate([
    {
      $match: { associatedCourse: this.associatedCourse },
    },
    {
      $group: {
        _id: "$associatedCourse",
        ratingsQuantity: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await CourseModel.findByIdAndUpdate(this.associatedCourse, {
      averageRating: stats[0].averageRating,
      ratingsQuantity: stats[0].ratingsQuantity,
    });
  } else {
    await CourseModel.findByIdAndUpdate(this.associatedCourse, {
      averageRating: 0,
      ratingsQuantity: 0,
    });
  }
}

reviewSchema.post("save", async function (): Promise<void> {
  await calculateStats.call(this);
});

reviewSchema.post("findOneAndUpdate", async function () {
  const updatedDocument = await this.model.findById(
    (this as any).docGettingUpdated?._id
  );

  await calculateStats.call(updatedDocument);
});

reviewSchema.pre("findOneAndUpdate", async function (next) {
  // Get the filter criteria used in the update operation
  const queryFilter = this.getQuery();

  // Find the document before the update
  const docGettingUpdated = await this.model.findOne(queryFilter);

  if (!docGettingUpdated) {
    return next(
      new AppError("Error in getting document that is getting updated", 500)
    );
  }

  // Store the document on the query object using type assertion
  (this as any).docGettingUpdated = docGettingUpdated;

  next();
});

reviewSchema.post("findOneAndDelete", async function (deletedDoc) {
  await calculateStats.call(deletedDoc);
});

const ReviewModel = model<ReviewInterface>("Review", reviewSchema);

export { ReviewModel, ReviewInterface };
