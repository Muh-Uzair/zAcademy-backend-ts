"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const courses_controller_1 = require("../controllers/courses-controller");
const auth_controller_1 = require("../controllers/auth-controller");
const review_routes_1 = __importDefault(require("./review-routes"));
const router = express_1.default.Router();
router.use("/:courseId/reviews", review_routes_1.default);
router
    .route("/")
    .get(courses_controller_1.getAllCourses)
    .post(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "teacher"]), courses_controller_1.createCourse);
router.route("/courses-stats").get(courses_controller_1.getCoursesStats);
router.route("/top-5-courses").get(courses_controller_1.aliasTop5Courses, courses_controller_1.getAllCourses);
router.route("/top-5-cheapest").get(courses_controller_1.aliasTop5Cheapest, courses_controller_1.getAllCourses);
router.route("/top-5-longest").get(courses_controller_1.aliasTop5Longest, courses_controller_1.getAllCourses);
router.route("/best-course").get(courses_controller_1.getBestCourse);
router.route("/buy-course").patch(courses_controller_1.buyCourse);
router.route("/within").get(courses_controller_1.findCoursesWithinDistance);
router.route("/get-institutes-location").get(courses_controller_1.getInstitutesLocation);
router
    .route("/:id")
    .get(courses_controller_1.getCourseById)
    .patch(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "teacher"]), courses_controller_1.checkCorrectUserOperation, courses_controller_1.checkDiscountValid, courses_controller_1.uploadCourseImages, courses_controller_1.resizeCourseImages, courses_controller_1.updateCourseById)
    .delete(auth_controller_1.protect, (0, auth_controller_1.restrictTo)(["admin", "teacher"]), courses_controller_1.checkCorrectUserOperation, courses_controller_1.syncOtherCollections, courses_controller_1.deleteCourseById);
exports.default = router;
