import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import Stripe from "stripe";

import { Request, Response, NextFunction } from "express";
import { CourseInterface, CourseModel } from "../models/courses-model";
import { apiFeatures } from "../utils/api-features";
import { AppError } from "../utils/app-error";
import { globalAsyncCatch } from "../utils/global-async-catch";
import { UserInterface, UserModel } from "../models/users-model";
import {
  deleteOneDocument,
  getAllDocs,
  getOneDoc,
  updateOneDocument,
} from "./handlerFactory";
import { Document } from "mongoose";
import { ReviewModel } from "../models/review-model";

interface CustomRequest extends Request {
  user?: UserInterface;
}

// FUNCTION
export const getAllCourses = getAllDocs<CourseInterface>(CourseModel);

// FUNCTION
export const createCourse = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : check wether user exists or not
    if (!req.user) {
      return next(new AppError("Provide user", 401));
    }

    // 3 : take the user object from the DB
    const instructor = {
      name: req.user?.name,
      email: req.user?.email,
      qualification: req.user?.qualification || null,
      location: req.user?.location,
    };

    // 4 : create the course
    const newCreatedCourse = await CourseModel.create({
      ...req.body,
      instructor,
    });

    if (!newCreatedCourse) {
      return next(new AppError("Error in creating course", 500));
    }

    // 5 : associate the course
    const updatedInstructor = await UserModel.findByIdAndUpdate(
      req.user?.id,
      { $push: { associatedCourses: newCreatedCourse._id } },
      { new: true, runValidators: true }
    );

    res.status(201).json({
      status: "success",
      data: {
        newCreatedCourse,
        updatedInstructor,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

// FUNCTION
export const getCourseById = getOneDoc<CourseInterface>(CourseModel);

// FUNCTION this check that the curr is the owner of course which is going to be deleted
export const checkCorrectUserOperation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 :  take user id
    const userId = req.user?.id || req.user?._id;

    // 2 : get the user out of db
    const result = await UserModel.findById(userId).select(
      "+associatedCourses"
    );

    if (!result) {
      return next(new AppError("Curr user does not awn any courses", 401));
    }

    // 4 : check that the course on which the operation is performing exists in the current user associated courses arr
    let correctUser = false;
    const courseId = req.params?.id;

    if (!courseId) {
      return next(new AppError("Provide course id", 400));
    }

    result.associatedCourses?.forEach((val, i) => {
      if (String(val._id) === String(courseId)) {
        correctUser = true;
      }
    });

    // 5 : send response accordingly
    if (!correctUser) {
      return next(
        new AppError("You are not allowed to perform this operation", 401)
      );
    } else {
      next();
    }
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION-GROUP
export const checkDiscountValid = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // if there is discount thn check is that valid
  if (req.body?.discount) {
    //
    interface Course {
      price: number;
    }
    // fetch the course price
    const course: Course | null = await CourseModel.findById(
      req.params.id
    ).select("price");

    const coursePrice = course?.price || 0;

    if (req.body.discount > coursePrice) {
      res.status(400).json({
        status: "fail",
        message: "Discount price should not be greater than actual price",
      });
    } else {
      next();
    }
  } else {
    next();
  }
  // if there is no discount then move to next middleware
};

const multerStorage = multer.memoryStorage();

const multerFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file?.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Provided file is not image", 400));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadCourseImages = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

export const resizeCourseImages = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    interface multerFile {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      buffer: Buffer;
      size: number;
    }

    interface multerFiles {
      coverImage?: multerFile[];
      images?: multerFile[];
    }

    const files: multerFiles | undefined = req.files as multerFiles;

    // 1 : user does not want to update any of the images so go to the next middleware
    if (!files.coverImage && !files.images) {
      return next();
    }

    // 2 : check the user is authenticated
    if (!req.user) {
      return next(
        new AppError("You are not allowed to perform this action", 401)
      );
    }

    // 2 : resize the cover Image
    const coverImageBuffer =
      files?.coverImage && files.coverImage[0]?.buffer
        ? files.coverImage[0].buffer
        : null;
    if (coverImageBuffer) {
      const coverImageFileName = `course-${
        req.user.id
      }-${Date.now()}-cover.jpg`;
      await sharp(coverImageBuffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/images/courses/${coverImageFileName}`);

      req.body.coverImage = coverImageFileName;
    }

    // 3 : resize the rest of the images
    const images =
      files?.images && Object.entries(files?.images).length > 0
        ? files?.images
        : null;

    if (images) {
      req.body.images = [];
      await Promise.all(
        images.map(async (val, i) => {
          const imageFileName = `course-${
            req.user && req.user.id ? req.user.id : null
          }-${Date.now()}-${i + 1}.jpg`;
          await sharp(images[i].buffer)
            .resize(2000, 1333)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`public/images/courses/${imageFileName}`);

          req.body.images.push(imageFileName);
        })
      );
    }

    next();
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

export const updateCourseById = updateOneDocument<CourseInterface>(CourseModel);

// FUNCTION-GROUP
export const syncOtherCollections = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courseId = req.params?.id;

    // DIVIDER 1 : sync reviews associated with that course

    const allReviews = await ReviewModel.find({ associatedCourse: courseId });

    if (!allReviews) {
      return next(
        new AppError("Error in fetching reviews for provided course", 500)
      );
    }

    const deletedReviews = await ReviewModel.deleteMany({
      associatedCourse: courseId,
    });

    if (!deletedReviews) {
      return next(new AppError("Error in deleting associated reviews", 500));
    }

    // DIVIDER 2 : sync associatedCourses arr on teacher who created the course
    // --> take the user id out
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return next(new AppError("Provide user id ", 401));
    }

    // --> take the curr logged user out of db and also the owner of the course who is deleting
    const user = await UserModel.findById(userId);

    if (!user) {
      return next(new AppError("No user found for provided id", 401));
    }

    if (!user?.associatedCourses) {
      return next(
        new AppError("Current user is not the owner of this course", 400)
      );
    }

    user.associatedCourses = user?.associatedCourses.filter((val) => {
      return String(val._id) !== String(courseId);
    });

    await user.save();

    // DIVIDER 3 : sync the associatedCourses arr on student who bought this course
    const userData = await CourseModel.findById(courseId).select("students");

    if (!userData) {
      return next(
        new AppError("Error in fetching students of the course", 500)
      );
    }

    const { students } = userData;

    if (students?.length === 0) {
      next();
    }

    students?.forEach(async (val): Promise<void> => {
      const studentData = await UserModel.findById(val).select(
        "associatedCourses associatedReviews"
      );

      if (!studentData) {
        return next(new AppError("User does not exists for provided id", 400));
      }

      if (!studentData?.associatedCourses || !studentData?.associatedReviews) {
        return next(
          new AppError(
            "Error in fetching associated courses and associated reviews",
            500
          )
        );
      }

      if (studentData?.associatedCourses?.length === 0) {
        return next(new AppError("Db is not sync correctly", 500));
      }

      studentData.associatedCourses = studentData?.associatedCourses?.filter(
        ({ _id: id }) => {
          return String(id) !== String(courseId);
        }
      );

      studentData.associatedReviews = studentData?.associatedReviews?.filter(
        (val) => {
          return !allReviews.some(
            (review) => String(review._id) === String(val)
          );
        }
      );

      await studentData.save();

      next();
    });

    // DIVIDER 4 : sync Associated Reviews
  } catch (err) {
    globalAsyncCatch(err, next);
  }
};

export const deleteCourseById = deleteOneDocument<CourseInterface>(CourseModel);

// FUNCTION
export const findCoursesWithinDistance = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(req.query);

    // 1 : take the distance out of query
    const distance: string | undefined = req.query?.distance as
      | string
      | undefined;

    if (!distance) {
      return next(new AppError("No distance provided", 400));
    }

    // 2 : take the center data out of the query
    const center: string | undefined = req.query?.center as string | undefined;

    if (!center) {
      return next(new AppError("No center provided", 400));
    }

    // 3 : take lng lat out of thr center
    const [lat, lng] = center.split(",").map((val) => val.trim());
    if (!lat || !lng) {
      return next(
        new AppError("Coordinates are not provided in correct format", 400)
      );
    }

    // 4 : enforcing index
    await CourseModel.collection.createIndex({ instituteLocation: "2dsphere" });

    // 5 : find courses with in the radius provided as distance
    const docsInRadius = await CourseModel.find({
      instituteLocation: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)], // your location
          },
          $maxDistance: Number(distance) * 1000, // 5km in meters
        },
      },
    });

    res.status(200).json({
      status: "success",
      results: docsInRadius?.length,
      docsInRadius,
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION
export const getInstitutesLocation = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1 : take the center data out of the query
    const center: string | undefined = req.query?.center as string | undefined;

    if (!center) {
      return next(new AppError("No center provided", 400));
    }

    // 2 : take lng lat out of thr center
    const [lat, lng] = center.split(",").map((val) => val.trim());

    if (!lat || !lng) {
      return next(
        new AppError("Coordinates are not provided in correct format", 400)
      );
    }

    // 3 : execute query find distance off all the institutes from user location
    const allDistance = await CourseModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          distanceField: "distance",
          distanceMultiplier: 0.001,
        },
      },
      {
        $addFields: {
          distance: { $round: ["$distance", 0] },
        },
      },
      {
        $project: { distance: 1, name: 1 },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: allDistance?.length,
      allDistance,
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};

// FUNCTION-GROUP
export const getCoursesStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const courses = await CourseModel.aggregate([
      {
        $group: {
          _id: "$difficulty",
          totalDocsScanned: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          averageRating: { $avg: "$averageRating" },
          averageDuration: { $avg: "$duration" },
          ratingsQuantity: { $avg: "$ratingsQuantity" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        courses,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

export const getBestCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bestCourse = await CourseModel.aggregate([
      {
        $group: {
          _id: "$averageRating",
          name: { $first: "$name" },
          instructor: { $first: "$instructor" },
          averageRating: { $first: "$averageRating" },
        },
      },
      {
        $sort: { averageRating: -1 },
      },
      {
        $project: { name: 1, instructor: 1, averageRating: 1, _id: 0 },
      },
      {
        $limit: 1,
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        bestCourse,
      },
    });
  } catch (error: unknown) {
    globalAsyncCatch(error, next);
  }
};

export const aliasTop5Courses = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  //?limit=5&sort=-ratingsAverage

  req.query.limit = "5";
  req.query.sort = "-ratingsAverage";

  next();
};

export const aliasTop5Cheapest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.query.limit = "5";
  req.query.sort = "price";

  next();
};

export const aliasTop5Longest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.query.limit = "5";
  req.query.sort = "-duration";

  next();
};

// FUNCTION-GROUP
export const createStripeSession = async (
  courseId: string,
  userId: string,
  next: NextFunction
): Promise<Stripe.Response<Stripe.Checkout.Session> | void> => {
  // 1 : get the course
  const course = await CourseModel.findOne({ _id: courseId });

  if (!course) {
    return next(new AppError("No course with provided id", 400));
  }

  const user = await UserModel.findOne({ _id: userId });

  if (!user) {
    return next(new AppError("No user for provided id", 400));
  }

  // 2 : create a stripe object
  const stripe = new Stripe(process.env.STRIPE_SEC_KEY as string, {
    apiVersion: "2025-01-27.acacia",
  });

  if (!stripe) {
    return next(new AppError("Unable to create a stripe object", 500));
  }

  // 3 : create a session with that
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    client_reference_id: String(user?.id),
    customer_email: user?.email,
    success_url: "https://www.wwe.com/",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.name,
          },
          unit_amount: course.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
  });

  if (!stripeSession) {
    return next(new AppError("Unable to create a stripe session", 500));
  }

  return stripeSession;
};

export const buyCourse = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log(req.query);
    // 1 : take course id out
    if (!req.query.courseId) {
      return next(new AppError("Course id not provided", 400));
    }
    const { courseId } = req.query;

    // 2 : take user if out
    const { userId } = req.query;
    if (!userId) {
      return next(new AppError("User id not found in request object", 500));
    }

    // 3 : create a session
    const stripeSession: Stripe.Response<Stripe.Checkout.Session> | void =
      await createStripeSession(String(courseId), String(userId), next);

    const updatedCourse = await CourseModel.findByIdAndUpdate(
      courseId,
      { $addToSet: { students: userId } },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedCourse) {
      return next(new AppError("Error in updating course", 500));
    }

    // 4 : update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { associatedCourses: updatedCourse._id } },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedUser) {
      return next(new AppError("Error in updating user", 500));
    }

    res.status(200).json({
      status: "success",
      data: {
        updatedCourse,
        updatedUser,
        stripeSession,
      },
    });
  } catch (err: unknown) {
    globalAsyncCatch(err, next);
  }
};
