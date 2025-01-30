import express, { NextFunction, Request, Response, Router } from "express";
import {
  createNewReview,
  getAllReviews,
} from "../controllers/review-controller";
import { protect, restrictTo } from "../controllers/auth-controller";
import { globalAsyncCatch } from "../utils/global-async-catch";

const router: Router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getAllReviews)
  .post(protect, restrictTo(["admin", "student"]), createNewReview);

export default router;
