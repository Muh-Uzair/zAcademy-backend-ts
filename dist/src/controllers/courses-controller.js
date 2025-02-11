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
exports.buyCourse = exports.createStripeSession = exports.aliasTop5Longest = exports.aliasTop5Cheapest = exports.aliasTop5Courses = exports.getBestCourse = exports.getCoursesStats = exports.getInstitutesLocation = exports.findCoursesWithinDistance = exports.deleteCourseById = exports.syncOtherCollections = exports.updateCourseById = exports.resizeCourseImages = exports.uploadCourseImages = exports.checkDiscountValid = exports.checkCorrectUserOperation = exports.getCourseById = exports.createCourse = exports.getAllCourses = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const stripe_1 = __importDefault(require("stripe"));
const courses_model_1 = require("../models/courses-model");
const app_error_1 = require("../utils/app-error");
const global_async_catch_1 = require("../utils/global-async-catch");
const users_model_1 = require("../models/users-model");
const handlerFactory_1 = require("./handlerFactory");
const review_model_1 = require("../models/review-model");
// FUNCTION
exports.getAllCourses = (0, handlerFactory_1.getAllDocs)(courses_model_1.CourseModel);
// FUNCTION
const createCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        // 1 : check wether user exists or not
        if (!req.user) {
            return next(new app_error_1.AppError("Provide user", 401));
        }
        // 3 : take the user object from the DB
        const instructor = {
            name: (_a = req.user) === null || _a === void 0 ? void 0 : _a.name,
            email: (_b = req.user) === null || _b === void 0 ? void 0 : _b.email,
            qualification: ((_c = req.user) === null || _c === void 0 ? void 0 : _c.qualification) || null,
            location: (_d = req.user) === null || _d === void 0 ? void 0 : _d.location,
        };
        // 4 : create the course
        const newCreatedCourse = yield courses_model_1.CourseModel.create(Object.assign(Object.assign({}, req.body), { instructor }));
        if (!newCreatedCourse) {
            return next(new app_error_1.AppError("Error in creating course", 500));
        }
        // 5 : associate the course
        const updatedInstructor = yield users_model_1.UserModel.findByIdAndUpdate((_e = req.user) === null || _e === void 0 ? void 0 : _e.id, { $push: { associatedCourses: newCreatedCourse._id } }, { new: true, runValidators: true });
        res.status(201).json({
            status: "success",
            data: {
                newCreatedCourse,
                updatedInstructor,
            },
        });
    }
    catch (error) {
        (0, global_async_catch_1.globalAsyncCatch)(error, next);
    }
});
exports.createCourse = createCourse;
// FUNCTION
exports.getCourseById = (0, handlerFactory_1.getOneDoc)(courses_model_1.CourseModel);
// FUNCTION this check that the curr is the owner of course which is going to be deleted
const checkCorrectUserOperation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // 1 :  take user id
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
        // 2 : get the user out of db
        const result = yield users_model_1.UserModel.findById(userId).select("+associatedCourses");
        if (!result) {
            return next(new app_error_1.AppError("Curr user does not awn any courses", 401));
        }
        // 4 : check that the course on which the operation is performing exists in the current user associated courses arr
        let correctUser = false;
        const courseId = (_c = req.params) === null || _c === void 0 ? void 0 : _c.id;
        if (!courseId) {
            return next(new app_error_1.AppError("Provide course id", 400));
        }
        (_d = result.associatedCourses) === null || _d === void 0 ? void 0 : _d.forEach((val, i) => {
            if (String(val._id) === String(courseId)) {
                correctUser = true;
            }
        });
        // 5 : send response accordingly
        if (!correctUser) {
            return next(new app_error_1.AppError("You are not allowed to perform this operation", 401));
        }
        else {
            next();
        }
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.checkCorrectUserOperation = checkCorrectUserOperation;
// FUNCTION-GROUP
const checkDiscountValid = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // if there is discount thn check is that valid
    if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.discount) {
        // fetch the course price
        const course = yield courses_model_1.CourseModel.findById(req.params.id).select("price");
        const coursePrice = (course === null || course === void 0 ? void 0 : course.price) || 0;
        if (req.body.discount > coursePrice) {
            res.status(400).json({
                status: "fail",
                message: "Discount price should not be greater than actual price",
            });
        }
        else {
            next();
        }
    }
    else {
        next();
    }
    // if there is no discount then move to next middleware
});
exports.checkDiscountValid = checkDiscountValid;
const multerStorage = multer_1.default.memoryStorage();
const multerFilter = (req, file, cb) => {
    if (file === null || file === void 0 ? void 0 : file.mimetype.startsWith("image")) {
        cb(null, true);
    }
    else {
        cb(new app_error_1.AppError("Provided file is not image", 400));
    }
};
const upload = (0, multer_1.default)({
    storage: multerStorage,
    fileFilter: multerFilter,
});
exports.uploadCourseImages = upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 3 },
]);
const resizeCourseImages = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const files = req.files;
        // 1 : user does not want to update any of the images so go to the next middleware
        if (!files.coverImage && !files.images) {
            return next();
        }
        // 2 : check the user is authenticated
        if (!req.user) {
            return next(new app_error_1.AppError("You are not allowed to perform this action", 401));
        }
        // 2 : resize the cover Image
        const coverImageBuffer = (files === null || files === void 0 ? void 0 : files.coverImage) && ((_a = files.coverImage[0]) === null || _a === void 0 ? void 0 : _a.buffer)
            ? files.coverImage[0].buffer
            : null;
        if (coverImageBuffer) {
            const coverImageFileName = `course-${req.user.id}-${Date.now()}-cover.jpg`;
            yield (0, sharp_1.default)(coverImageBuffer)
                .resize(2000, 1333)
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(`public/images/courses/${coverImageFileName}`);
            req.body.coverImage = coverImageFileName;
        }
        // 3 : resize the rest of the images
        const images = (files === null || files === void 0 ? void 0 : files.images) && Object.entries(files === null || files === void 0 ? void 0 : files.images).length > 0
            ? files === null || files === void 0 ? void 0 : files.images
            : null;
        if (images) {
            req.body.images = [];
            yield Promise.all(images.map((val, i) => __awaiter(void 0, void 0, void 0, function* () {
                const imageFileName = `course-${req.user && req.user.id ? req.user.id : null}-${Date.now()}-${i + 1}.jpg`;
                yield (0, sharp_1.default)(images[i].buffer)
                    .resize(2000, 1333)
                    .toFormat("jpeg")
                    .jpeg({ quality: 90 })
                    .toFile(`public/images/courses/${imageFileName}`);
                req.body.images.push(imageFileName);
            })));
        }
        next();
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.resizeCourseImages = resizeCourseImages;
exports.updateCourseById = (0, handlerFactory_1.updateOneDocument)(courses_model_1.CourseModel);
// FUNCTION-GROUP
const syncOtherCollections = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const courseId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // DIVIDER 1 : sync reviews associated with that course
        const allReviews = yield review_model_1.ReviewModel.find({ associatedCourse: courseId });
        if (!allReviews) {
            return next(new app_error_1.AppError("Error in fetching reviews for provided course", 500));
        }
        const deletedReviews = yield review_model_1.ReviewModel.deleteMany({
            associatedCourse: courseId,
        });
        if (!deletedReviews) {
            return next(new app_error_1.AppError("Error in deleting associated reviews", 500));
        }
        // DIVIDER 2 : sync associatedCourses arr on teacher who created the course
        // --> take the user id out
        const userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c._id);
        if (!userId) {
            return next(new app_error_1.AppError("Provide user id ", 401));
        }
        // --> take the curr logged user out of db and also the owner of the course who is deleting
        const user = yield users_model_1.UserModel.findById(userId);
        if (!user) {
            return next(new app_error_1.AppError("No user found for provided id", 401));
        }
        if (!(user === null || user === void 0 ? void 0 : user.associatedCourses)) {
            return next(new app_error_1.AppError("Current user is not the owner of this course", 400));
        }
        user.associatedCourses = user === null || user === void 0 ? void 0 : user.associatedCourses.filter((val) => {
            return String(val._id) !== String(courseId);
        });
        yield user.save();
        // DIVIDER 3 : sync the associatedCourses arr on student who bought this course
        const userData = yield courses_model_1.CourseModel.findById(courseId).select("students");
        if (!userData) {
            return next(new app_error_1.AppError("Error in fetching students of the course", 500));
        }
        const { students } = userData;
        if ((students === null || students === void 0 ? void 0 : students.length) === 0) {
            next();
        }
        students === null || students === void 0 ? void 0 : students.forEach((val) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const studentData = yield users_model_1.UserModel.findById(val).select("associatedCourses associatedReviews");
            if (!studentData) {
                return next(new app_error_1.AppError("User does not exists for provided id", 400));
            }
            if (!(studentData === null || studentData === void 0 ? void 0 : studentData.associatedCourses) || !(studentData === null || studentData === void 0 ? void 0 : studentData.associatedReviews)) {
                return next(new app_error_1.AppError("Error in fetching associated courses and associated reviews", 500));
            }
            if (((_a = studentData === null || studentData === void 0 ? void 0 : studentData.associatedCourses) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                return next(new app_error_1.AppError("Db is not sync correctly", 500));
            }
            studentData.associatedCourses = (_b = studentData === null || studentData === void 0 ? void 0 : studentData.associatedCourses) === null || _b === void 0 ? void 0 : _b.filter(({ _id: id }) => {
                return String(id) !== String(courseId);
            });
            studentData.associatedReviews = (_c = studentData === null || studentData === void 0 ? void 0 : studentData.associatedReviews) === null || _c === void 0 ? void 0 : _c.filter((val) => {
                return !allReviews.some((review) => String(review._id) === String(val));
            });
            yield studentData.save();
            next();
        }));
        // DIVIDER 4 : sync Associated Reviews
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.syncOtherCollections = syncOtherCollections;
exports.deleteCourseById = (0, handlerFactory_1.deleteOneDocument)(courses_model_1.CourseModel);
// FUNCTION
const findCoursesWithinDistance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // 1 : take the distance out of query
        const distance = (_a = req.query) === null || _a === void 0 ? void 0 : _a.distance;
        if (!distance) {
            return next(new app_error_1.AppError("No distance provided", 400));
        }
        // 2 : take the center data out of the query
        const center = (_b = req.query) === null || _b === void 0 ? void 0 : _b.center;
        if (!center) {
            return next(new app_error_1.AppError("No center provided", 400));
        }
        // 3 : take lng lat out of thr center
        const [lat, lng] = center.split(",").map((val) => val.trim());
        if (!lat || !lng) {
            return next(new app_error_1.AppError("Coordinates are not provided in correct format", 400));
        }
        // 4 : enforcing index
        yield courses_model_1.CourseModel.collection.createIndex({ instituteLocation: "2dsphere" });
        // 5 : find courses with in the radius provided as distance
        const docsInRadius = yield courses_model_1.CourseModel.find({
            instituteLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [Number(lng), Number(lat)], // your location
                    },
                    $maxDistance: Number(distance) * 1000, // 5km in meters
                },
            },
        });
        res.status(200).json({
            status: "success",
            results: docsInRadius === null || docsInRadius === void 0 ? void 0 : docsInRadius.length,
            docsInRadius,
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.findCoursesWithinDistance = findCoursesWithinDistance;
// FUNCTION
const getInstitutesLocation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1 : take the center data out of the query
        const center = (_a = req.query) === null || _a === void 0 ? void 0 : _a.center;
        if (!center) {
            return next(new app_error_1.AppError("No center provided", 400));
        }
        // 2 : take lng lat out of thr center
        const [lat, lng] = center.split(",").map((val) => val.trim());
        if (!lat || !lng) {
            return next(new app_error_1.AppError("Coordinates are not provided in correct format", 400));
        }
        // 3 : execute query find distance off all the institutes from user location
        const allDistance = yield courses_model_1.CourseModel.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [Number(lng), Number(lat)],
                    },
                    distanceField: "distance",
                    distanceMultiplier: 0.001,
                },
            },
            {
                $addFields: {
                    distance: { $round: ["$distance", 0] },
                },
            },
            {
                $project: { distance: 1, name: 1 },
            },
        ]);
        res.status(200).json({
            status: "success",
            results: allDistance === null || allDistance === void 0 ? void 0 : allDistance.length,
            allDistance,
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.getInstitutesLocation = getInstitutesLocation;
// FUNCTION-GROUP
const getCoursesStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courses = yield courses_model_1.CourseModel.aggregate([
            {
                $group: {
                    _id: "$difficulty",
                    totalDocsScanned: { $sum: 1 },
                    avgPrice: { $avg: "$price" },
                    averageRating: { $avg: "$averageRating" },
                    averageDuration: { $avg: "$duration" },
                    ratingsQuantity: { $avg: "$ratingsQuantity" },
                },
            },
            {
                $sort: { avgPrice: 1 },
            },
        ]);
        res.status(200).json({
            status: "success",
            data: {
                courses,
            },
        });
    }
    catch (error) {
        (0, global_async_catch_1.globalAsyncCatch)(error, next);
    }
});
exports.getCoursesStats = getCoursesStats;
const getBestCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bestCourse = yield courses_model_1.CourseModel.aggregate([
            {
                $group: {
                    _id: "$averageRating",
                    name: { $first: "$name" },
                    instructor: { $first: "$instructor" },
                    averageRating: { $first: "$averageRating" },
                },
            },
            {
                $sort: { averageRating: -1 },
            },
            {
                $project: { name: 1, instructor: 1, averageRating: 1, _id: 0 },
            },
            {
                $limit: 1,
            },
        ]);
        res.status(200).json({
            status: "success",
            data: {
                bestCourse,
            },
        });
    }
    catch (error) {
        (0, global_async_catch_1.globalAsyncCatch)(error, next);
    }
});
exports.getBestCourse = getBestCourse;
const aliasTop5Courses = (req, res, next) => {
    //?limit=5&sort=-ratingsAverage
    req.query.limit = "5";
    req.query.sort = "-ratingsAverage";
    next();
};
exports.aliasTop5Courses = aliasTop5Courses;
const aliasTop5Cheapest = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "price";
    next();
};
exports.aliasTop5Cheapest = aliasTop5Cheapest;
const aliasTop5Longest = (req, res, next) => {
    req.query.limit = "5";
    req.query.sort = "-duration";
    next();
};
exports.aliasTop5Longest = aliasTop5Longest;
// FUNCTION-GROUP
const createStripeSession = (courseId, userId, next) => __awaiter(void 0, void 0, void 0, function* () {
    // 1 : get the course
    const course = yield courses_model_1.CourseModel.findOne({ _id: courseId });
    if (!course) {
        return next(new app_error_1.AppError("No course with provided id", 400));
    }
    const user = yield users_model_1.UserModel.findOne({ _id: userId });
    if (!user) {
        return next(new app_error_1.AppError("No user for provided id", 400));
    }
    // 2 : create a stripe object
    const stripe = new stripe_1.default(process.env.STRIPE_SEC_KEY, {
        apiVersion: "2025-01-27.acacia",
    });
    if (!stripe) {
        return next(new app_error_1.AppError("Unable to create a stripe object", 500));
    }
    // 3 : create a session with that
    const stripeSession = yield stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        client_reference_id: String(user === null || user === void 0 ? void 0 : user.id),
        customer_email: user === null || user === void 0 ? void 0 : user.email,
        success_url: "https://www.wwe.com/",
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: course.name,
                    },
                    unit_amount: course.price * 100,
                },
                quantity: 1,
            },
        ],
        mode: "payment",
    });
    if (!stripeSession) {
        return next(new app_error_1.AppError("Unable to create a stripe session", 500));
    }
    return stripeSession;
});
exports.createStripeSession = createStripeSession;
const buyCourse = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 : take course id out
        if (!req.query.courseId) {
            return next(new app_error_1.AppError("Course id not provided", 400));
        }
        const { courseId } = req.query;
        // 2 : take user if out
        const { userId } = req.query;
        if (!userId) {
            return next(new app_error_1.AppError("User id not found in request object", 500));
        }
        // 3 : create a session
        const stripeSession = yield (0, exports.createStripeSession)(String(courseId), String(userId), next);
        const updatedCourse = yield courses_model_1.CourseModel.findByIdAndUpdate(courseId, { $addToSet: { students: userId } }, { returnDocument: "after", runValidators: true });
        if (!updatedCourse) {
            return next(new app_error_1.AppError("Error in updating course", 500));
        }
        // 4 : update the user
        const updatedUser = yield users_model_1.UserModel.findByIdAndUpdate(userId, { $addToSet: { associatedCourses: updatedCourse._id } }, { returnDocument: "after", runValidators: true });
        if (!updatedUser) {
            return next(new app_error_1.AppError("Error in updating user", 500));
        }
        res.status(200).json({
            status: "success",
            data: {
                updatedCourse,
                updatedUser,
                stripeSession,
            },
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.buyCourse = buyCourse;
