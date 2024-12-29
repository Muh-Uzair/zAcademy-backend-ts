import express, { Router } from "express";
import { getCourses, createCourses } from "../controllers/courses-controller";

const router: Router = express.Router();

router.route("/").get(getCourses).post(createCourses);

export default router;
