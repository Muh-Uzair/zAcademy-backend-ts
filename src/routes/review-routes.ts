import express, { Router } from "express";
import {
  createNewReview,
  getAllReviews,
} from "../controllers/review-controller";
import { protect, restrictTo } from "../controllers/auth-controller";

const router: Router = express.Router();

router
  .route("/")
  .get(getAllReviews)
  .post(protect, restrictTo(["admin", "teacher"]), createNewReview);

export default router;
