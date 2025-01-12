import express, { Router } from "express";
import { getAllUsers } from "../controllers/users-controller";
import { signup } from "../controllers/auth-controller";

const router: Router = express.Router();

router.route("/signup").post(signup);
router.route("/").get(getAllUsers);

export default router;
