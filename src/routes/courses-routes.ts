import express, { Router } from "express";
import {
  getAllCourses,
  createCourse,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  aliasTop5Courses,
  aliasTop5Cheapest,
  aliasTop5Longest,
  getCoursesStats,
  getBestCourse,
  checkDiscountValid,
  buyCourse,
  checkCorrectUserOperation,
  syncOtherCollections,
  findCoursesWithinDistance,
  getInstitutesLocation,
  uploadCourseImages,
  resizeCourseImages,
} from "../controllers/courses-controller";
import { protect, restrictTo } from "../controllers/auth-controller";
import reviewRouter from "./review-routes";

const router: Router = express.Router();

router.use("/:courseId/reviews", reviewRouter);

router
  .route("/")
  .get(getAllCourses)
  .post(protect, restrictTo(["admin", "teacher"]), createCourse);
router.route("/courses-stats").get(getCoursesStats);
router.route("/top-5-courses").get(aliasTop5Courses, getAllCourses);
router.route("/top-5-cheapest").get(aliasTop5Cheapest, getAllCourses);
router.route("/top-5-longest").get(aliasTop5Longest, getAllCourses);
router.route("/best-course").get(getBestCourse);
router
  .route("/buy-course")
  .patch(protect, restrictTo(["admin", "student"]), buyCourse);
router.route("/within").get(findCoursesWithinDistance);
router.route("/get-institutes-location").get(getInstitutesLocation);

router
  .route("/:id")
  .get(getCourseById)
  .patch(
    protect,
    restrictTo(["admin", "teacher"]),
    checkCorrectUserOperation,
    checkDiscountValid,
    uploadCourseImages,
    resizeCourseImages,
    updateCourseById
  )
  .delete(
    protect,
    restrictTo(["admin", "teacher"]),
    checkCorrectUserOperation,
    syncOtherCollections,
    deleteCourseById
  );

export default router;
