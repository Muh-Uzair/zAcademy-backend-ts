"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReviewById = exports.opBeforeGettingOneReview = exports.updateReviewById = exports.checkUserSubmittedReview = exports.deleteReviewById = exports.checkCorrectUserOperation = exports.getAllReviewsForCourse = exports.createNewReview = exports.opBeforeGetReviews = exports.getAllReviews = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const review_model_1 = require("../models/review-model");
const app_error_1 = require("../utils/app-error");
const users_model_1 = require("../models/users-model");
const handlerFactory_1 = require("./handlerFactory");
const global_async_catch_1 = require("../utils/global-async-catch");
// FUNCTION-GROUP
exports.getAllReviews = (0, handlerFactory_1.getAllDocs)(review_model_1.ReviewModel, [
    { path: "associatedCourse", select: "name" },
    {
        path: "associatedUser",
        select: "name role",
    },
]);
const opBeforeGetReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.params.courseId) {
            next();
        }
        else {
            yield (0, exports.getAllReviews)(req, res, next);
        }
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.opBeforeGetReviews = opBeforeGetReviews;
// FUNCTION
const createNewReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1 : take the the course id out of params
        const courseId = new mongoose_1.default.Types.ObjectId(req.params.courseId);
        if (!courseId) {
            return next(new app_error_1.AppError("Invalid course id", 400));
        }
        // 2 : take user id out of req.user
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        if (!userId) {
            return next(new app_error_1.AppError("Invalid user id", 400));
        }
        // 3 : check wether the user have already submit a review on this course
        const alreadyReviewed = yield review_model_1.ReviewModel.find({
            associatedCourse: courseId,
            associatedUser: userId,
        });
        if (alreadyReviewed.length > 0) {
            return next(new app_error_1.AppError("You have already reviewed this course", 400));
        }
        // 3 : check wether the user have bought this course or not
        const associatedCoursesResult = yield users_model_1.UserModel.find({
            _id: userId,
        }).select("associatedCourses");
        // --> extract the actual array from result
        const associatedCourses = associatedCoursesResult[0].associatedCourses;
        // --> check if the result is not in the form of array
        if (!Array.isArray(associatedCourses))
            return next(new app_error_1.AppError("Invalid type! associatedCourses must be of type array", 5000));
        // --> check is the resulted array is empty
        if (associatedCourses.length === 0) {
            return next(new app_error_1.AppError("The user have not yet bought this course", 400));
        }
        // --> if the resulted array is not empty then check if the course id exists on resulted array
        let bought = false;
        associatedCourses.forEach((val) => {
            if (String(val._id) === String(courseId)) {
                bought = true;
            }
        });
        if (!bought) {
            return next(new app_error_1.AppError("The User hve not yet bought this course", 400));
        }
        // 4 :  the user have bought this course
        const { review, rating } = req.body;
        if (!review || !rating) {
            return next(new app_error_1.AppError("Provide rating and review both", 400));
        }
        const newReview = yield review_model_1.ReviewModel.create({
            review,
            rating,
            createdAt: new Date(Date.now()),
            associatedCourse: courseId,
            associatedUser: userId,
        });
        const updatedUser = yield users_model_1.UserModel.findByIdAndUpdate(userId, { $push: { associatedReviews: newReview._id } }, { new: true, runValidators: true });
        res.status(200).json({
            status: "success",
            data: {
                newReview,
                updatedUser,
            },
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.createNewReview = createNewReview;
// FUNCTION
const getAllReviewsForCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 : get the course id from params
        const courseId = new mongoose_1.default.Types.ObjectId(req.params.courseId);
        if (!courseId) {
            return next(new app_error_1.AppError("Course id not provided", 400));
        }
        const allReviews = yield review_model_1.ReviewModel.find({ associatedCourse: courseId });
        res.status(200).json({
            status: "success",
            data: {
                allReviews,
            },
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.getAllReviewsForCourse = getAllReviewsForCourse;
// FUNCTION
const checkCorrectUserOperation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1 : take the course Id out
        const courseId = new mongoose_1.default.Types.ObjectId(req.params.courseId);
        if (!courseId) {
            return next(new app_error_1.AppError("Course id not provided", 400));
        }
        // 2 : take the user id out of req.user
        const userId = new mongoose_1.default.Types.ObjectId((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!userId) {
            return next(new app_error_1.AppError("User id not provided", 400));
        }
        const existingReview = yield review_model_1.ReviewModel.findOne({
            associatedUser: userId,
            associatedCourse: courseId,
        });
        if (existingReview) {
            req.params.id = String(existingReview === null || existingReview === void 0 ? void 0 : existingReview._id);
            next();
        }
        else {
            return next(new app_error_1.AppError("You are not authorized to perform this action", 403));
        }
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.checkCorrectUserOperation = checkCorrectUserOperation;
// FUNCTION
exports.deleteReviewById = (0, handlerFactory_1.deleteOneDocument)(review_model_1.ReviewModel);
// FUNCTION-GROUP
const checkUserSubmittedReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 1 : take course id out of params
        const courseId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.courseId;
        if (!courseId) {
            return next(new app_error_1.AppError("Provide course id", 400));
        }
        // 2 : take user if out of user on req obj
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!userId) {
            return next(new app_error_1.AppError("You are not logged in", 401));
        }
        // 3 : no check that the user have already submitted a review on this course or not
        const existingReview = yield review_model_1.ReviewModel.findOne({
            associatedCourse: String(courseId),
            associatedUser: String(userId),
        });
        if (!existingReview) {
            return next(new app_error_1.AppError("You do not have any review on this course", 400));
        }
        next();
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.checkUserSubmittedReview = checkUserSubmittedReview;
exports.updateReviewById = (0, handlerFactory_1.updateOneDocument)(review_model_1.ReviewModel);
// FUNCTION-GROUP
const opBeforeGettingOneReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reviewId } = req.params;
        if (!reviewId) {
            return next(new app_error_1.AppError("Provide review id", 400));
        }
        const review = yield review_model_1.ReviewModel.findById(reviewId);
        if (!review) {
            return next(new app_error_1.AppError("No review for provided id", 400));
        }
        if (String(review.associatedUser) === String((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            req.params.id = reviewId;
            next();
        }
        else {
            return next(new app_error_1.AppError("You are not authorized to perform this action", 401));
        }
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.opBeforeGettingOneReview = opBeforeGettingOneReview;
exports.getReviewById = (0, handlerFactory_1.getOneDoc)(review_model_1.ReviewModel);
