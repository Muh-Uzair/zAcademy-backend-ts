import express, { NextFunction, Request, Response, Router } from "express";
import {
  checkCorrectUserOperation,
  createNewReview,
  deleteReviewById,
  getAllReviews,
  getAllReviewsForCourse,
  updateReviewById,
} from "../controllers/review-controller";
import { protect, restrictTo } from "../controllers/auth-controller";
import { globalAsyncCatch } from "../utils/global-async-catch";

const router: Router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(getAllReviews, getAllReviewsForCourse)
  .post(protect, restrictTo(["admin", "student"]), createNewReview)
  .patch(
    protect,
    restrictTo(["admin", "student"]),
    checkCorrectUserOperation,
    updateReviewById
  );

router
  .route("/:reviewId")
  .delete(
    protect,
    restrictTo(["admin", "student"]),
    checkCorrectUserOperation,
    deleteReviewById
  );

export default router;
