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
exports.apiFeatures = void 0;
class apiFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    // sorting
    sorting() {
        if (this.queryString.sort) {
            const sortingOptionsArr = typeof this.queryString.sort === "string"
                ? this.queryString.sort.split(",")
                : [];
            this.query = this.query.sort(sortingOptionsArr.join(" "));
        }
        else {
            this.query = this.query.sort("createdAt");
        }
        return this;
    }
    // field projection, sending some field and some not
    projection() {
        if (this.queryString.fields) {
            this.query = this.query.select(this.queryString.fields.toString().split(",").join(" "));
        }
        else {
            this.query = this.query.select("-__v -updatedAt");
        }
        return this;
    }
    // limiting
    limiting() {
        if (this.queryString.limit) {
            const limit = Number(this.queryString.limit);
            this.query = this.query.limit(limit);
        }
        else {
            this.query = this.query.limit(10);
        }
        return this;
    }
    // check total documents
    countDocuments(Model) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Model.countDocuments();
        });
    }
    // pagination
    pagination(Model) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.queryString.page) {
                const page = Number(this.queryString.page);
                const limit = 10;
                const skip = (page - 1) * limit;
                const totalCourses = yield this.countDocuments(Model);
                if (skip >= totalCourses) {
                    throw new Error(`No data for page ${this.queryString.page}`);
                }
                this.query = this.query.skip(skip).limit(limit);
            }
            return this;
        });
    }
}
exports.apiFeatures = apiFeatures;
