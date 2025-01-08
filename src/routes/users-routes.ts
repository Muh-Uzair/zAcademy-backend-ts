import express, { Router } from "express";
import { getAllUsers, signup } from "../controllers/users-controller";

const router: Router = express.Router();

router.route("/signup").post(signup);
router.route("/").get(getAllUsers);

export default router;
