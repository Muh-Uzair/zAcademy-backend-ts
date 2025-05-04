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
exports.logout = exports.updatePassword = exports.resetPassword = exports.forgotPassword = exports.restrictTo = exports.protect = exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const email_1 = __importDefault(require("../utils/email"));
const global_async_catch_1 = require("../utils/global-async-catch");
const app_error_1 = require("../utils/app-error");
const users_model_1 = require("../models/users-model");
// FUNCTION
const signToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    const token = jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "6d",
    });
    const encodedToken = jsonwebtoken_1.default.decode(token);
    return token;
};
// FUNCTION
const cookieAndResponse = (req, res, next, actualResponse, id) => {
    // 1 : sign a token
    const jwt = signToken(id);
    if (!jwt) {
        return next(new app_error_1.AppError("Unable to generate jwt token", 500));
    }
    res.cookie("jwt", jwt, {
        expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRES_TIME) * 24 * 60 * 60 * 1000),
        httpOnly: true,
    });
    // 3 : send a response
    res.status(200).json(Object.assign(Object.assign({}, actualResponse), { jwt }));
};
// FUNCTION
const signup = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // 1 : take the role from the request body
        const role = (_a = req.body) === null || _a === void 0 ? void 0 : _a.role;
        // 2 : check if role is provided
        if (!role) {
            return next(new app_error_1.AppError("Provide role to signup", 400));
        }
        // 3 : check if role is teacher or student
        if (role !== "teacher" && role !== "student") {
            return next(new app_error_1.AppError("Role can only be teacher or student", 400));
        }
        const newUser = yield users_model_1.UserModel.create(req.body);
        // 2 : sign a JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        // 3 : send a response with JWT  in cookie
        cookieAndResponse(req, res, next, {
            status: "success",
            data: {
                newUser,
            },
        }, newUser.id);
    }
    catch (error) {
        (0, global_async_catch_1.globalAsyncCatch)(error, next);
    }
});
exports.signup = signup;
// FUNCTION
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 : check is req.body contain user name or passwords
        if (!req.body.email || !req.body.password) {
            next(new app_error_1.AppError("Please provide email and passwords", 400));
        }
        else {
            // 2 : check is user exists
            const user = yield users_model_1.UserModel.findOne({
                email: req.body.email,
            }).select("+password");
            // 3 : compare the received password with password in db
            const passwordCorrect = (user === null || user === void 0 ? void 0 : user.password)
                ? yield bcryptjs_1.default.compare(req.body.password, user.password)
                : false;
            // 4 : send response accordingly
            if (!user || !passwordCorrect) {
                next(new app_error_1.AppError("Incorrect email or password", 400));
            }
            else {
                if (user === null || user === void 0 ? void 0 : user.passwordChangedDate) {
                    yield users_model_1.UserModel.updateOne({ _id: String(user === null || user === void 0 ? void 0 : user._id) }, { $unset: { passwordChangedDate: 1 } });
                }
                cookieAndResponse(req, res, next, { status: "success", data: { user } }, String(user === null || user === void 0 ? void 0 : user._id));
            }
        }
    }
    catch (error) {
        (0, global_async_catch_1.globalAsyncCatch)(error, next);
    }
});
exports.login = login;
// FUNCTION
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // 1 : check if there is authorization in headers
    if ((!req.headers.authorization ||
        !req.headers.authorization.startsWith("Bearer")) &&
        !req.cookies.jwt) {
        return next(new app_error_1.AppError("Jwt is invalid or missing", 400));
    }
    // --> take the token out the headers
    const receivedToken = (((_a = req.headers) === null || _a === void 0 ? void 0 : _a.authorization)
        ? req.headers.authorization.split(" ")[1]
        : null) || ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.jwt);
    try {
        if (!receivedToken || !process.env.JWT_SECRET) {
            throw new app_error_1.AppError("Either token or secret is invalid", 400);
        }
        // 2 : verify token
        const decodedToken = jsonwebtoken_1.default.verify(receivedToken, process.env.JWT_SECRET);
        if (typeof decodedToken !== "object" || !decodedToken.id) {
            throw new app_error_1.AppError("Invalid decoded token or id does not exist on decoded token", 500);
        }
        const { id } = decodedToken;
        // 3 : check the user against the id in the token
        const user = yield users_model_1.UserModel.findById(id);
        if (!user) {
            throw new app_error_1.AppError(`No user for id ${id}`, 400);
        }
        // 4 : check if the user has change the password after the token was issued
        if (user.checkPasswordChangedAfter(decodedToken.iat)) {
            if (!user.passwordChangedDate ||
                !(user.passwordChangedDate instanceof Date)) {
                return next(new app_error_1.AppError("passwordChangeDate does not exist on user", 500));
            }
            const dateString = user.passwordChangedDate;
            const date = new Date(dateString);
            const unixTimestamp = Math.floor(date.getTime() / 1000);
            throw new app_error_1.AppError(`User have recently changes the password. Token issue time (iat) : ${decodedToken.iat} | Password change date : ${unixTimestamp}  `, 401);
        }
        req.user = user;
        next();
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.protect = protect;
// FUNCTION
const restrictTo = (rolesArr) => {
    return (req, res, next) => {
        var _a, _b;
        let flag = false;
        for (let i = 0; i < rolesArr.length; i++) {
            if (((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.role) === rolesArr[i]) {
                flag = true;
            }
        }
        if (!flag) {
            return next(new app_error_1.AppError(`${(_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.role} is not authorized to perform this action`, 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
// FUNCTION
const forgotPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 : get user based on e-mail
        if (!req.body.email) {
            return next(new app_error_1.AppError("Email must be provided in body", 400));
        }
        const user = yield users_model_1.UserModel.findOne({
            email: req.body.email,
        });
        if (!user) {
            return next(new app_error_1.AppError(`No user for email ${req.body.email}`, 400));
        }
        // 2 : generate the random reset token
        const originalResetToken = user.createPasswordResetToken();
        if (!originalResetToken) {
            return next(new app_error_1.AppError("Error in generating reset token", 500));
        }
        // 3 : save the user bcz we added some properties on user in above instance method
        user.save();
        // 3 : send that token to user via email
        // await sendEmail({
        //   email: user.email,
        //   subject: "Reset token is valid 10 mins only",
        //   message: `make request to ${req.protocol}://${req.get(
        //     "host"
        //   )}/api/users/reset-password/${originalResetToken}`,
        // });
        yield new email_1.default('"Muhammad Uzair" <admin@zAcademy.io>', user.email).sendResetEmail("Reset token is valid 10 mins only", "email-template", {
            resetToken: originalResetToken,
        });
        res.status(200).json({
            status: "success",
            data: {
                message: `Token has been successfully sent to your email ${user === null || user === void 0 ? void 0 : user.email}`,
            },
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.forgotPassword = forgotPassword;
// FUNCTION this will be performed y user whi us not logged in
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 : take the random token out of params
        const originalRandomToken = req.params.resetToken;
        // 2 : encode that token
        const encodedToken = crypto_1.default
            .createHash("sha256")
            .update(originalRandomToken)
            .digest("hex");
        // 3 : check a user against that token
        const user = yield users_model_1.UserModel.findOne({
            passwordResetToken: encodedToken,
            passwordResetExpires: { $gte: Date.now() },
        });
        if (!user) {
            return next(new app_error_1.AppError("Either invalid token or the token has been expired", 400));
        }
        if (!req.body.password || !req.body.confirmPassword) {
            return next(new app_error_1.AppError("Either password or confirm password is missing in body", 400));
        }
        // 4 : update the properties of the user
        user.password = req.body.password;
        user.confirmPassword = req.body.confirmPassword;
        user.passwordChangedDate = new Date(Date.now() + 20000);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        yield user.save();
        if (!user._id) {
            return next(new app_error_1.AppError("_id does not exist on user", 500));
        }
        // 5 : generate a jwt for login
        const jwtToken = signToken(user === null || user === void 0 ? void 0 : user._id);
        res.status(200).json({
            status: "success",
            jwtToken,
            user,
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.resetPassword = resetPassword;
// FUNCTION update logged in user password jonas
const updatePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 :  take the use from the request object
        if (!req.user || !req.user.id) {
            return next(new app_error_1.AppError("Provide user on req object", 400));
        }
        const user = yield users_model_1.UserModel.findById(req.user.id).select("+password");
        if (!user) {
            return next(new app_error_1.AppError("No user found", 401));
        }
        // 2 :  check that the current password in req body matched the one stored in db
        if (!req.body.currentPassword) {
            return next(new app_error_1.AppError("Provide current password on user object", 400));
        }
        const passwordMatch = yield user.comparePassword(req.body.currentPassword);
        if (!passwordMatch) {
            return next(new app_error_1.AppError("Provided current password is incorrect", 401));
        }
        // 3 :  update properties on user object
        user.password = req.body.password;
        user.confirmPassword = req.body.confirmPassword;
        user.passwordChangedDate = new Date(Date.now() + 20000);
        yield user.save();
        // 4 :  generate token
        if (!user.id) {
            return next(new app_error_1.AppError("No id on user object", 500));
        }
        cookieAndResponse(req, res, next, { status: "success", data: { user } }, user === null || user === void 0 ? void 0 : user._id);
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.updatePassword = updatePassword;
// FUNCTION
const logout = (req, res, next) => {
    res.cookie("jwt", "user-logged-out", {
        expires: new Date(Date.now() + 10000),
        httpOnly: true,
    });
    res.status(200).json({
        status: "success",
    });
};
exports.logout = logout;
