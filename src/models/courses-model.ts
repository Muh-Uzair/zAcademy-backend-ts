import { Schema, model, Document } from "mongoose";

// Define the interface for the Course document
interface CourseInterface extends Document {
  createdAt: Date;
  coverImage: string;
  name: string;
  instructor: string;
  summary: string;
  difficulty: string;
  duration: number;
  averageRating: number;
  ratingsQuantity: number;
  price: number;
}

// Define the schema for the Course model
const courseSchema = new Schema<CourseInterface>(
  {
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    coverImage: {
      type: String,
      required: [true, "A course must have a cover image"],
    },
    name: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "A course must have a name"],
      unique: [true, "Every course must have a unique name"],
      minlength: [10, "A course name should be at least 10 characters"],
      maxLength: [50, "A course name should not exceed 50 characters"],
    },
    instructor: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "A course must have an instructor name"],
      minlength: [5, "Instructor name should not be be less than 5 character"],
      maxLength: [20, "Instructor name should not exceed 20 character"],
    },
    summary: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "A course must have a short summary"],
      minlength: [20, "A course summary should not be less than 20 characters"],
      maxLength: [
        50,
        "A course summary should not exceed than 100 50 characters",
      ],
    },
    difficulty: {
      type: String,
      required: [true, "A course must have difficulty level"],
      lowercase: true,
      enum: {
        values: ["beginner", "intermediate", "advance"],
        message:
          '{VALUE} does not belong from ("beginner", "intermediate", "advance")',
      },
    },
    duration: {
      type: Number,
      required: [true, "A course must have a duration"],
      min: [1, "Course duration not be less than 1 hour"],
      max: [200, "Course above 200 hours are not supported"],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Average rating of course should not be less than 0"],
      max: [5, "Average rating should not exceed 5"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A course must have price"],
    },
  },
  { timestamps: true, versionKey: false, strict: true },
);

// Create the model using the schema and interface
const CourseModel = model<CourseInterface>("Course", courseSchema);

export { CourseModel, CourseInterface };

// course schema
