import mongoose, { Schema, model, Document } from "mongoose";
import { maxHeaderSize } from "node:http";
import { isAlpha, isEmail, isNumber } from "../utils/validation-functions";

// Define the interface for the Course document
interface InterfaceInstructor {
  name: string;
  email: string;
  qualification?: string;
  type: string;
  coordinates: number[];
}

interface CourseInterface extends Document {
  createdAt: Date;
  coverImage?: string;
  name: string;
  instructor: InterfaceInstructor;
  summary: string;
  difficulty: string;
  duration: number;
  averageRating?: number;
  ratingsQuantity: number;
  price: number;
  discount?: number;
  students?: mongoose.Types.ObjectId[];
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
    },
    name: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "A course must have a name"],
      unique: [true, "Every course must have a unique name"],
      minlength: [10, "A course name should be at least 10 characters"],
      maxLength: [50, "A course name should not exceed 50 characters"],
      validate: {
        validator: (value: string) => isAlpha(value),
        message: "Course name must contain only alphabetic characters",
      },
    },
    instructor: {
      name: {
        type: String,
        required: [true, "Instructor must have a name"],
        minLength: [10, "Instructor name should be at least 10 characters"],
        maxLength: [50, "Instructor name should not exceed 50 characters"],
        validate: {
          validator: (value: string) => isAlpha(value),
          message: "Instructor name must contain only alphabetic characters",
        },
      },
      email: {
        type: String,
        required: [true, "Instructor must have an email"],
        unique: [true, "Instructor email must be unique"],
        minLength: [10, "Instructor email should be at least 10 characters"],
        maxLength: [50, "Instructor email should not exceed 50 characters"],
        validate: {
          validator: (value: string) => isEmail(value),
          message: "Instructor name must contain only alphabetic characters",
        },
      },
      qualification: {
        type: String,
        minLength: [
          3,
          "Instructor qualification should be at least 3 characters",
        ],
        maxLength: [
          20,
          "Instructor qualification should not exceed 20 characters",
        ],
        validate: {
          validator: (value: string) => isAlpha(value),
          message: "qualification must contain only alphabetic characters",
        },
      },
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        required: [true, "Instructor must have coordinates"],
      },
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
      validate: {
        validator: (value: string) => isAlpha(value),
        message: "Summary must contain only alphabetic characters",
      },
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
      validate: {
        validator: (value: number) => isNumber(value),
        message: "Duration can only contain numbers",
      },
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, "Average rating of course should not be less than 0"],
      max: [5, "Average rating should not exceed 5"],
      validate: {
        validator: (value: number) => isNumber(value),
        message: "Average rating can only contain numbers",
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      validate: {
        validator: (value: number) => isNumber(value),
        message: "Ratings quantity can only contain numbers",
      },
    },
    price: {
      type: Number,
      required: [true, "A course must have price"],
      validate: {
        validator: (value: number) => isNumber(value),
        message: "Price can only contain numbers",
      },
    },
    discount: {
      type: Number,
      default: 0,
      validate: [
        {
          validator: (value: number) => isNumber(value),
          message: "Discount must be a number",
        },
        {
          validator: function (value: number) {
            return value <= this.price;
          },
          message: "Discount should not be grater than actual price",
        },
      ],
    },
    students: [{ type: Schema.Types.ObjectId, ref: "Users" }],
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
    versionKey: false,
    strict: true,
  }
);

// virtual properties
courseSchema.virtual("durationMins").get(function (): number {
  return Number(this.duration) * 60; // return the duration in minutes
});

// document middleware _________________________________________
courseSchema.pre("save", async function (next): Promise<void> {
  const totalDocuments = await this.model("Course").countDocuments();

  this.id = totalDocuments + 1;

  if (this.discount && this.discount > this.price) {
    throw new Error("Discount price should not be greater than actual price");
  }

  console.log(this);
  next();
});

courseSchema.pre("findOneAndUpdate", function (next): void {
  console.log(this);

  next();
});

// courseSchema.post("save", function (doc, next): void {
//   console.log("Document saved successfully");
//   console.log(doc);
//   next();
// });

// query middle ware ___________________________________________
// courseSchema.pre("countDocuments", function (next): void {
//   console.log(" ");
//   console.log("Actual query");
//   console.log(this);
//   console.log("Running before countDocuments query middleware");
//   next();
// });

// courseSchema.post("countDocuments", function (doc, next): void {
//   console.log("Running after countDocuments query middleware");
//   next();
// });

// aggregation middleware _______________________________________
// courseSchema.pre("aggregate", function (next): void {
//   console.log("Running before aggregation middleware");
//   next();
// });

// courseSchema.post("aggregate", function (doc, next): void {
//   console.log("Running after aggregation middleware");
//   next();
// });

// Create the model using the schema and interface
const CourseModel = model<CourseInterface>("Course", courseSchema);

export { CourseModel, CourseInterface };

// course schema
