import express, { Router } from "express";
import {
  getAllCourses,
  createCourse,
  checkIdExist,
  checkIdValid,
  getCourseById,
  updateCourseById,
  deleteCourseById,
} from "../controllers/courses-controller";

const router: Router = express.Router();

router.param("id", checkIdValid);

router.route("/").get(getAllCourses).post(checkIdExist, createCourse);
router
  .route("/:id")
  .get(getCourseById)
  .patch(updateCourseById)
  .delete(deleteCourseById);

export default router;
