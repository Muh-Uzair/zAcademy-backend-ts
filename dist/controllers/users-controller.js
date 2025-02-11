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
exports.getUserDataOnId = exports.opBeforeGettingUser = exports.updateUserData = exports.opBeforeUpdatingUserData = exports.resizeUserImage = exports.uploadUserPhoto = exports.getAllUsers = void 0;
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const users_model_1 = require("../models/users-model");
const global_async_catch_1 = require("../utils/global-async-catch");
const app_error_1 = require("../utils/app-error");
const handlerFactory_1 = require("./handlerFactory");
// FUNCTION
exports.getAllUsers = (0, handlerFactory_1.getAllDocs)(users_model_1.UserModel);
// FUNCTION
const correctBodyForUpdate = (reqBody, keepFieldsArr) => {
    let newObj = {};
    Object.keys(reqBody).forEach((val) => {
        if (keepFieldsArr.includes(val)) {
            newObj[val] = reqBody[val];
        }
    });
    return newObj;
};
// FUNCTION-GROUP update the currently logged in user
const multerStorage = multer_1.default.memoryStorage();
// check wether the provided file is an image or not
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    }
    else {
        cb(new app_error_1.AppError("The provide file is not an image", 400));
    }
};
const upload = (0, multer_1.default)({ storage: multerStorage, fileFilter: multerFilter });
exports.uploadUserPhoto = upload.single("photo");
const resizeUserImage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 : if the do not want to change the images just exe the next MW
        if (!req.file)
            return next();
        // 2 : change the file name
        if (!req.user) {
            return next(new app_error_1.AppError("You are not logged in! Please login", 401));
        }
        req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;
        // 3 :
        yield (0, sharp_1.default)(req.file.buffer)
            .resize(500, 500)
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`public/images/users/${req.file.filename}`);
        next();
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.resizeUserImage = resizeUserImage;
const opBeforeUpdatingUserData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        // 1 : check if user have send passwords
        if (req.body.password || req.body.confirmPassword) {
            return next(new app_error_1.AppError("This route is not for changing password", 400));
        }
        // 2 :  correct the format of received of req body
        const correctedObj = correctBodyForUpdate(req.body, [
            "name",
            "email",
            "phoneNumber",
            "qualification",
        ]);
        // 3 : fetch the user based on id
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            return next(new app_error_1.AppError("User id does not exist in user object", 500));
        }
        req.params.id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if ((_c = req.file) === null || _c === void 0 ? void 0 : _c.filename) {
            req.body = Object.assign(Object.assign({}, correctedObj), { photo: (_d = req.file) === null || _d === void 0 ? void 0 : _d.filename });
        }
        else {
            req.body = Object.assign({}, correctedObj);
        }
        next();
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.opBeforeUpdatingUserData = opBeforeUpdatingUserData;
exports.updateUserData = (0, handlerFactory_1.updateOneDocument)(users_model_1.UserModel);
// FUNCTION-GROUP
const opBeforeGettingUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1 : take user id from params
        const userIdParams = req.params.id;
        if (!userIdParams) {
            return next(new app_error_1.AppError("Provide user id", 400));
        }
        // 2 : take user id out of req.user
        const userIqReq = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userIqReq) {
            return next(new app_error_1.AppError("Provide user id", 401));
        }
        if (userIdParams === userIqReq) {
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
exports.opBeforeGettingUser = opBeforeGettingUser;
exports.getUserDataOnId = (0, handlerFactory_1.getOneDoc)(users_model_1.UserModel);
