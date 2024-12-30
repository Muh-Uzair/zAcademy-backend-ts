import { Schema, model, Document } from "mongoose";

// Define the interface for the Course document
interface CourseInterface extends Document {
  id: number;
  courseName: string;
}

// Define the schema for the Course model
const courseSchema = new Schema<CourseInterface>({
  id: {
    type: Number,
    unique: true,
  },
  courseName: {
    type: String,
    required: [true, "Course name is required"],
    unique: true,
  },
});

// Create the model using the schema and interface
const CourseModel = model<CourseInterface>("Course", courseSchema);

export { CourseModel, CourseInterface };
