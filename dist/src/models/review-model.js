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
exports.ReviewModel = void 0;
const mongoose_1 = require("mongoose");
const validation_functions_1 = require("../utils/validation-functions");
const mongoose_2 = require("mongoose");
const courses_model_1 = require("./courses-model");
const app_error_1 = require("../utils/app-error");
const reviewSchema = new mongoose_1.Schema({
    review: {
        type: String,
        trim: true,
        required: [true, "Review is required"],
        minlength: [3, "Review should not be less than 3 characters"],
        maxlength: [100, "Review should not exceed 100 characters"],
        validate: {
            validator: (val) => (0, validation_functions_1.isAlpha)(val),
            message: "Review must contain only alphabetic characters and spaces",
        },
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: [1, "Rating should not be less than 1"],
        max: [5, "Rating should not increase 10"],
        validate: {
            validator: (val) => (0, validation_functions_1.isNumber)(val),
            message: "Rating should of type number",
        },
    },
    createdAt: {
        type: Date,
        default: new Date(Date.now()),
        select: false,
    },
    associatedCourse: { type: mongoose_1.Schema.Types.ObjectId, ref: "Course" },
    associatedUser: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    timestamps: true,
    versionKey: false,
    strict: true,
});
// FUNCTION-GROUP
function calculateStats() {
    return __awaiter(this, void 0, void 0, function* () {
        const ReviewModel = this.constructor;
        const stats = yield ReviewModel.aggregate([
            {
                $match: { associatedCourse: this.associatedCourse },
            },
            {
                $group: {
                    _id: "$associatedCourse",
                    ratingsQuantity: { $sum: 1 },
                    averageRating: { $avg: "$rating" },
                },
            },
        ]);
        if (stats.length > 0) {
            yield courses_model_1.CourseModel.findByIdAndUpdate(this.associatedCourse, {
                averageRating: stats[0].averageRating,
                ratingsQuantity: stats[0].ratingsQuantity,
            });
        }
        else {
            yield courses_model_1.CourseModel.findByIdAndUpdate(this.associatedCourse, {
                averageRating: 0,
                ratingsQuantity: 0,
            });
        }
    });
}
reviewSchema.post("save", function () {
    return __awaiter(this, void 0, void 0, function* () {
        yield calculateStats.call(this);
    });
});
reviewSchema.post("findOneAndUpdate", function () {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const updatedDocument = yield this.model.findById((_a = this.docGettingUpdated) === null || _a === void 0 ? void 0 : _a._id);
        yield calculateStats.call(updatedDocument);
    });
});
reviewSchema.pre("findOneAndUpdate", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get the filter criteria used in the update operation
        const queryFilter = this.getQuery();
        // Find the document before the update
        const docGettingUpdated = yield this.model.findOne(queryFilter);
        if (!docGettingUpdated) {
            return next(new app_error_1.AppError("Error in getting document that is getting updated", 500));
        }
        // Store the document on the query object using type assertion
        this.docGettingUpdated = docGettingUpdated;
        next();
    });
});
reviewSchema.post("findOneAndDelete", function (deletedDoc) {
    return __awaiter(this, void 0, void 0, function* () {
        yield calculateStats.call(deletedDoc);
    });
});
const ReviewModel = (0, mongoose_2.model)("Review", reviewSchema);
exports.ReviewModel = ReviewModel;
