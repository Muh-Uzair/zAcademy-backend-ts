import express, { Router } from "express";
import { getAllUsers } from "../controllers/users-controller";
import {
  login,
  signup,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} from "../controllers/auth-controller";

const router: Router = express.Router();

router.route("/").get(getAllUsers);
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:resetToken").post(resetPassword);
router.route("/update-password").patch(protect, updatePassword);

export default router;
