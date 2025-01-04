import express, { Router } from "express";
import {
  getAllCourses,
  createCourse,
  checkIdExist,
  checkIdValid,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  aliasTop5Courses,
  aliasTop5Cheapest,
  aliasTop5Longest,
  getCoursesStats,
  getBestCourse,
  checkDiscountValid,
} from "../controllers/courses-controller";

const router: Router = express.Router();

router.param("id", checkIdValid);

router.route("/").get(getAllCourses).post(checkIdExist, createCourse);
router.route("/courses-stats").get(getCoursesStats);
router.route("/top-5-courses").get(aliasTop5Courses, getAllCourses);
router.route("/top-5-cheapest").get(aliasTop5Cheapest, getAllCourses);
router.route("/top-5-longest").get(aliasTop5Longest, getAllCourses);
router.route("/best-course").get(getBestCourse);

router
  .route("/:id")
  .get(getCourseById)
  .patch(checkDiscountValid, updateCourseById)
  .delete(deleteCourseById);

export default router;
