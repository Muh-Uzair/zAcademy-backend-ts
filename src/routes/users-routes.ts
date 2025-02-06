import express, { Router } from "express";
import {
  getAllUsers,
  getUserDataOnId,
  opBeforeGettingUser,
  opBeforeUpdatingUserData,
  resizeUserImage,
  updateUserData,
  uploadUserPhoto,
} from "../controllers/users-controller";
import {
  login,
  signup,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
  logout,
} from "../controllers/auth-controller";
import multer from "multer";

const router: Router = express.Router();

router
  .route("/")
  .get(protect, restrictTo(["admin"]), getAllUsers)
  .patch(
    protect,
    uploadUserPhoto,
    resizeUserImage,
    opBeforeUpdatingUserData,
    updateUserData
  );
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:resetToken").post(protect, resetPassword);
router.route("/update-password").patch(protect, updatePassword);
router.route("/logout").get(logout);

router
  .route("/:id")
  .get(
    protect,
    restrictTo(["admin", "teacher", "student"]),
    opBeforeGettingUser,
    getUserDataOnId
  );

export default router;
