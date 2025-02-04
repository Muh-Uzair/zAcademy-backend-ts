import express, { Router } from "express";
import {
  getAllUsers,
  getUserDataOnId,
  opBeforeGettingUser,
  opBeforeUpdatingUserData,
  updateUserData,
} from "../controllers/users-controller";
import {
  login,
  signup,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} from "../controllers/auth-controller";

const router: Router = express.Router();

router
  .route("/")
  .get(protect, restrictTo(["admin"]), getAllUsers)
  .patch(protect, opBeforeUpdatingUserData, updateUserData);
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:resetToken").post(protect, resetPassword);
router.route("/update-password").patch(protect, updatePassword);

router
  .route("/:id")
  .get(
    protect,
    restrictTo(["admin", "teacher", "student"]),
    opBeforeGettingUser,
    getUserDataOnId
  );

export default router;
