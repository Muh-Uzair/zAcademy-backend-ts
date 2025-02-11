"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("../controllers/users-controller");
const auth_controller_1 = require("../controllers/auth-controller");
const router = express_1.default.Router();
router
    .route("/")
    .get(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin"]), users_controller_1.getAllUsers)
    .patch(auth_controller_1.protect, users_controller_1.uploadUserPhoto, users_controller_1.resizeUserImage, users_controller_1.opBeforeUpdatingUserData, users_controller_1.updateUserData);
router.route("/signup").post(auth_controller_1.signup);
router.route("/login").post(auth_controller_1.login);
router.route("/forgot-password").post(auth_controller_1.forgotPassword);
router.route("/reset-password/:resetToken").post(auth_controller_1.protect, auth_controller_1.resetPassword);
router.route("/update-password").patch(auth_controller_1.protect, auth_controller_1.updatePassword);
router.route("/logout").get(auth_controller_1.logout);
router
    .route("/:id")
    .get(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "teacher", "student"]), users_controller_1.opBeforeGettingUser, users_controller_1.getUserDataOnId);
exports.default = router;
