import express, { Router } from "express";
import { getAllUsers } from "../controllers/users-controller";
import { login, signup } from "../controllers/auth-controller";

const router: Router = express.Router();

router.route("/").get(getAllUsers);
router.route("/signup").post(signup);
router.route("/login").post(login);

export default router;
