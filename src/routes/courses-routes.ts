import express, { Router } from "express";
import {
  getAllCourses,
  createCourse,
  checkIdExist,
  checkIdValid,
  getCourseById,
  updateCourseById,
} from "../controllers/courses-controller";

const router: Router = express.Router();

router.param("id", checkIdValid);

router.route("/").get(getAllCourses).post(checkIdExist, createCourse);
router.route("/:id").get(getCourseById).patch(updateCourseById);

export default router;
