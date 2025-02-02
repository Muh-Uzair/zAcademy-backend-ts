import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import mongoose from "mongoose";
import fs from "fs";
import { CourseInterface, CourseModel } from "../models/courses-model";
import { UserInterface, UserModel } from "../models/users-model";

// 1 : read all the data from the file
// const allCourses: CourseInterface[] = JSON.parse(
//   fs.readFileSync("src/app-data/courses.json", {
//     encoding: "utf-8",
//     flag: "r",
//   }),
// );

const allUsers: UserInterface[] = JSON.parse(
  fs.readFileSync("src/data/users-data.json", {
    encoding: "utf-8",
    flag: "r",
  })
);

// 2 : delete all the items from db
const deleteAllData = async (): Promise<void> => {
  try {
    // await CourseModel.deleteMany({});
    await UserModel.deleteMany({});
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`There was an error occurred ${error.message}`);
    } else {
      throw new Error("There was an error occurred");
    }
  }
};

// 3 : upload all the items to db
const uploadAllData = async (): Promise<void> => {
  try {
    await deleteAllData();
    console.log("All data deleted from db");
    // await CourseModel.insertMany([...allCourses], { ordered: true });
    await UserModel.insertMany([...allUsers], { ordered: true });
    console.log("All data uploaded to db");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(error);
      throw new Error(`There was an error occurred ${error.message}`);
    } else {
      throw new Error("There was an error occurred");
    }
  }
};
uploadAllData();

// 1 : connect to db
// _________________________________ connecting to local db
if (!process.env.DB_CONNECTION_STRING_LOCAL) {
  throw new Error("Missing required environment variables.");
}
const dbConnectionString = process.env.DB_CONNECTION_STRING_LOCAL;
mongoose.connect(dbConnectionString).then(async () => {
  console.log("connection to local db success");
  await uploadAllData();
  process.exit();
});
//___________________________________________________________
