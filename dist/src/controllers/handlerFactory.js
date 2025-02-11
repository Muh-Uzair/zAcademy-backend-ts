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
exports.getAllDocs = exports.getOneDoc = exports.updateOneDocument = exports.deleteOneDocument = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const global_async_catch_1 = require("../utils/global-async-catch");
const app_error_1 = require("../utils/app-error");
const api_features_1 = require("../utils/api-features");
// FUNCTION
const deleteOneDocument = (Model) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const docId = new mongoose_1.default.Types.ObjectId(req.params.id);
        if (!docId) {
            return next(new app_error_1.AppError("Document id not provided", 400));
        }
        const doc = yield Model.findOneAndDelete({ _id: String(docId) });
        res.status(204).json({
            status: "success",
            message: `Document with id ${docId} has been deleted`,
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.deleteOneDocument = deleteOneDocument;
// FUNCTION
const updateOneDocument = (Model) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1 : take id out of the params
        const { id } = req.params;
        if (!id) {
            return next(new app_error_1.AppError("Document id is not provided", 400));
        }
        // 2 : update the document of provided id
        const updatedDoc = yield Model.findOneAndUpdate({ _id: id }, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedDoc) {
            return next(new app_error_1.AppError("No document for the provided id", 400));
        }
        // 3 : return a response
        res.status(200).json({
            status: "success",
            updatedDoc,
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.updateOneDocument = updateOneDocument;
// FUNCTION
const getOneDoc = (Model) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return next(new app_error_1.AppError("Document id is not provided", 400));
        }
        const doc = yield Model.findById(id);
        if (!doc) {
            return next(new app_error_1.AppError("No document found with provided id", 400));
        }
        res.status(200).json({
            status: "success",
            data: {
                doc,
            },
        });
    }
    catch (err) {
        (0, global_async_catch_1.globalAsyncCatch)(err, next);
    }
});
exports.getOneDoc = getOneDoc;
const getAllDocs = (Model, populateObjsArr = []) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //
        const apiFeaturesObj = new api_features_1.apiFeatures(Model.find(), req.query)
            .sorting()
            .projection()
            .limiting();
        yield apiFeaturesObj.pagination(Model);
        let query = apiFeaturesObj.query;
        populateObjsArr.forEach((val) => {
            query = query.populate(val);
        });
        const allDocs = yield query;
        if (!allDocs) {
            next(new app_error_1.AppError("No documents found", 404));
        }
        res.status(200).json({
            status: "success",
            results: allDocs.length,
            data: {
                allDocs,
            },
        });
    }
    catch (error) {
        (0, global_async_catch_1.globalAsyncCatch)(error, next);
    }
});
exports.getAllDocs = getAllDocs;
