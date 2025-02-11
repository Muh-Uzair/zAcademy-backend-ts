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
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const validation_functions_1 = require("../utils/validation-functions");
// FUNCTION
// Define the User schema
const userSchema = new mongoose_1.Schema({
    photo: {
        type: String,
        trim: true,
        default: "default-user.jpg",
    },
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [50, "Name must be less than 50 characters long"],
        validate: {
            validator: (val) => (0, validation_functions_1.isAlpha)(val),
            message: "Name must contain only alphabetic characters and spaces",
        },
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique: true,
        validate: {
            validator: (val) => (0, validation_functions_1.isEmail)(val),
            message: (props) => `${props.value} is not a valid email address!`,
        },
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
        unique: [true, "Phone number must be unique"],
        validate: {
            validator: (val) => (0, validation_functions_1.isPhoneNumber)(val),
            message: (props) => `${props.value} is not a valid phone number!`,
        },
    },
    password: {
        type: String,
        trim: true,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        select: false,
    },
    confirmPassword: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                // `this` refers to the current document being validated
                return v === this.password;
            },
            message: "Passwords do not match",
        },
    },
    passwordChangedDate: {
        type: Date,
    },
    role: {
        type: String,
        required: [true, "role must be specified"],
        enum: {
            values: ["admin", "teacher", "student"],
            message: "invalid role {VALUE}, valid roles are admin, teacher, student",
        },
        default: "student",
        validate: {
            validator: (value) => (0, validation_functions_1.isAlpha)(value),
            message: (props) => `${props.value} is not a valid role!`,
        },
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: Date,
    },
    associatedCourses: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Course" }],
        default: [],
    },
    associatedReviews: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Review" }],
        default: [],
    },
    location: {
        type: {
            type: String,
            default: "Point",
            enum: ["Point"],
            required: [true, "Location type is required"],
        },
        coordinates: {
            type: [Number],
            required: [true, "User must provide location coordinates"],
            validate: {
                validator: function (value) {
                    return value && value.length === 2;
                },
                message: "Coordinates must be an array of two numbers [longitude, latitude]",
            },
        },
    },
    qualification: {
        type: String,
        trim: true,
        minlength: [3, "Qualification must be at least 10 characters long"],
        maxlength: [100, "Qualification must be less than 100 characters long"],
        validate: {
            validator: (val) => (0, validation_functions_1.isAlpha)(val),
            message: "Qualification must contain only alphabetic characters and spaces",
        },
    },
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.confirmPassword;
            return ret;
        },
    },
});
// FUNCTION pre-save doc MW
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // if user have modified the password than encrypt it again
        if (!this.isModified("password")) {
            return next();
        }
        else {
            // encrypt the password field
            this.password = yield bcryptjs_1.default.hash(this.password, 12);
            this.confirmPassword = undefined;
            next();
        }
        next();
    });
});
// FUNCTION
// this is an instance method
userSchema.method("checkPasswordChangedAfter", function (tokenIssueDate) {
    // this in instance method points to current document
    if (this.passwordChangedDate) {
        const date = new Date(this.passwordChangedDate);
        const unixTimestamp = Math.floor(date.getTime() / 1000);
        return tokenIssueDate > unixTimestamp;
    }
    return false;
});
// FUNCTION generate random token for forgot passwords
userSchema.method("createPasswordResetToken", function () {
    // 1 : create a token using crypt
    const resetToken = crypto_1.default.randomBytes(32).toString("hex"); // 32 bit string in hex format
    // 2 : encrypt that original token and store it on the user object, then store that user in DB
    this.passwordResetToken = crypto_1.default
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    // 3 :  reset token expires in 10 mins
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    // 4 : return that original token
    return resetToken;
});
// FUNCTION compare the stored password with incoming password
userSchema.method("comparePassword", function (incomingPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(incomingPassword, this.password);
    });
});
// Create the User model
const UserModel = (0, mongoose_1.model)("User", userSchema);
exports.UserModel = UserModel;
