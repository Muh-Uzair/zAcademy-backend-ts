import mongoose, { Query } from "mongoose";
import { CourseInterface, CourseModel } from "../models/courses-model";

interface CustomQuery {
  sort?: string;
  fields?: string;
  limit?: string;
  page?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Add any other query parameters you expect
}

class apiFeatures {
  query: Query<CourseInterface[], CourseInterface>;
  queryString: CustomQuery;

  constructor(
    query: Query<CourseInterface[], CourseInterface>,
    queryString: CustomQuery
  ) {
    this.query = query;
    this.queryString = queryString;
  }

  // sorting
  sorting() {
    if (this.queryString.sort) {
      const sortingOptionsArr: string[] =
        typeof this.queryString.sort === "string"
          ? this.queryString.sort.split(",")
          : [];
      this.query = this.query.sort(sortingOptionsArr.join(" "));
    } else {
      this.query = this.query.sort("createdAt");
    }

    return this;
  }

  // field projection, sending some field and some not
  projection() {
    if (this.queryString.fields) {
      this.query = this.query.select(
        this.queryString.fields.toString().split(",").join(" ")
      );
    } else {
      this.query = this.query.select("-__v -updatedAt");
    }

    return this;
  }

  // limiting
  limiting() {
    if (this.queryString.limit) {
      const limit: number = Number(this.queryString.limit);
      this.query = this.query.limit(limit);
    } else {
      this.query = this.query.limit(10);
    }

    return this;
  }

  // check total documents
  async countDocuments<T extends Document>(
    Model: typeof mongoose.Model
  ): Promise<number> {
    return await Model.countDocuments();
  }

  // pagination
  async pagination<T extends Document>(Model: typeof mongoose.Model) {
    if (this.queryString.page) {
      const page: number = Number(this.queryString.page);
      const limit: number = 10;
      const skip: number = (page - 1) * limit;

      const totalCourses: number = await this.countDocuments(Model);
      if (skip >= totalCourses) {
        throw new Error(`No data for page ${this.queryString.page}`);
      }

      this.query = this.query.skip(skip).limit(limit);
    }

    return this;
  }
}

export { apiFeatures };
