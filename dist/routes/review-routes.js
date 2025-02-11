"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("../controllers/review-controller");
const auth_controller_1 = require("../controllers/auth-controller");
// router.use("/:courseId/reviews", reviewRouter);
const router = express_1.default.Router({ mergeParams: true });
router
    .route("/")
    .get(auth_controller_1.protect, review_controller_1.opBeforeGetReviews, review_controller_1.getAllReviewsForCourse)
    .post(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "student"]), review_controller_1.createNewReview)
    .patch(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "student"]), review_controller_1.checkCorrectUserOperation, review_controller_1.checkUserSubmittedReview, review_controller_1.updateReviewById);
router
    .route("/:reviewId")
    .get(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "student"]), review_controller_1.opBeforeGettingOneReview, review_controller_1.getReviewById)
    .delete(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "student"]), review_controller_1.checkCorrectUserOperation, review_controller_1.deleteReviewById);
exports.default = router;
