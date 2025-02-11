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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseModel = void 0;
const mongoose_1 = require("mongoose");
const validation_functions_1 = require("../utils/validation-functions");
// Define the schema for the Course model
const courseSchema = new mongoose_1.Schema({
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false,
    },
    coverImage: {
        type: String,
    },
    images: {
        type: [String],
    },
    name: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, "A course must have a name"],
        unique: [true, "Every course must have a unique name"],
        minlength: [10, "A course name should be at least 10 characters"],
        maxLength: [50, "A course name should not exceed 50 characters"],
        validate: {
            validator: (value) => (0, validation_functions_1.isAlpha)(value),
            message: "Course name must contain only alphabetic characters",
        },
    },
    instructor: {
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
            validate: {
                validator: (val) => (0, validation_functions_1.isEmail)(val),
                message: (props) => `${props.value} is not a valid email address!`,
            },
        },
        qualification: {
            type: String,
            trim: true,
            minlength: [10, "Qualification must be at least 10 characters long"],
            maxlength: [100, "Qualification must be less than 100 characters long"],
            validate: {
                validator: (val) => (0, validation_functions_1.isAlpha)(val),
                message: "Qualification must contain only alphabetic characters and spaces",
            },
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
    },
    summary: {
        type: String,
        trim: true,
        lowercase: true,
        required: [true, "A course must have a short summary"],
        minlength: [20, "A course summary should not be less than 20 characters"],
        maxLength: [
            200,
            "A course summary should not exceed than 200 characters",
        ],
        validate: {
            validator: (value) => (0, validation_functions_1.isAlpha)(value),
            message: "Summary must contain only alphabetic characters",
        },
    },
    difficulty: {
        type: String,
        required: [true, "A course must have difficulty level"],
        lowercase: true,
        enum: {
            values: ["beginner", "intermediate", "advance"],
            message: '{VALUE} does not belong from ("beginner", "intermediate", "advance")',
        },
    },
    duration: {
        type: Number,
        required: [true, "A course must have a duration"],
        min: [1, "Course duration not be less than 1 hour"],
        max: [200, "Course above 200 hours are not supported"],
        validate: {
            validator: (value) => (0, validation_functions_1.isNumber)(value),
            message: "Duration can only contain numbers",
        },
    },
    averageRating: {
        type: Number,
        default: 0,
        min: [0, "Average rating of course should not be less than 0"],
        max: [5, "Average rating should not exceed 5"],
        validate: {
            validator: (value) => (0, validation_functions_1.isNumber)(value),
            message: "Average rating can only contain numbers",
        },
    },
    ratingsQuantity: {
        type: Number,
        default: 0,
        validate: {
            validator: (value) => (0, validation_functions_1.isNumber)(value),
            message: "Ratings quantity can only contain numbers",
        },
    },
    price: {
        type: Number,
        required: [true, "A course must have price"],
        validate: {
            validator: (value) => (0, validation_functions_1.isNumber)(value),
            message: "Price can only contain numbers",
        },
    },
    discount: {
        type: Number,
        default: 0,
        validate: [
            {
                validator: (value) => (0, validation_functions_1.isNumber)(value),
                message: "Discount must be a number",
            },
        ],
    },
    students: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Users" }],
    instituteLocation: {
        type: {
            type: String,
            default: "Point",
            enum: ["Point"],
            required: [true, "For geo spatial data type is required"],
        },
        coordinates: {
            type: [Number],
            required: [true, "Institute location must be provided"],
            validate: {
                validator: function (value) {
                    return value && value.length === 2;
                },
                message: "Coordinates must be an array of two numbers [longitude, latitude]",
            },
        },
    },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
    versionKey: false,
    strict: true,
});
// setting indexes for performance
courseSchema.index({ price: 1, duration: 1 });
courseSchema.index({ instituteLocation: "2dsphere" });
// virtual properties
courseSchema.virtual("durationMins").get(function () {
    return Number(this.duration) * 60; // return the duration in minutes
});
// document middleware
courseSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const totalDocuments = yield this.model("Course").countDocuments();
        this.id = totalDocuments + 1;
        if (this.discount && this.discount > this.price) {
            throw new Error("Discount price should not be greater than actual price");
        }
        next();
    });
});
// Create the model using the schema and interface
const CourseModel = (0, mongoose_1.model)("Course", courseSchema);
exports.CourseModel = CourseModel;
// course schema
