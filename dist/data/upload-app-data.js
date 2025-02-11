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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "./config.env" });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const users_model_1 = require("../models/users-model");
// 1 : read all the data from the file
// const allCourses: CourseInterface[] = JSON.parse(
//   fs.readFileSync("src/app-data/courses.json", {
//     encoding: "utf-8",
//     flag: "r",
//   }),
// );
const allUsers = JSON.parse(fs_1.default.readFileSync("src/data/users-data.json", {
    encoding: "utf-8",
    flag: "r",
}));
// 2 : delete all the items from db
const deleteAllData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // await CourseModel.deleteMany({});
        yield users_model_1.UserModel.deleteMany({});
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`There was an error occurred ${error.message}`);
        }
        else {
            throw new Error("There was an error occurred");
        }
    }
});
// 3 : upload all the items to db
const uploadAllData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield deleteAllData();
        console.log("All data deleted from db");
        // await CourseModel.insertMany([...allCourses], { ordered: true });
        yield users_model_1.UserModel.insertMany([...allUsers], { ordered: true });
        console.log("All data uploaded to db");
    }
    catch (error) {
        if (error instanceof Error) {
            console.log(error);
            throw new Error(`There was an error occurred ${error.message}`);
        }
        else {
            throw new Error("There was an error occurred");
        }
    }
});
uploadAllData();
// 1 : connect to db
// _________________________________ connecting to local db
if (!process.env.DB_CONNECTION_STRING_LOCAL) {
    throw new Error("Missing required environment variables.");
}
const dbConnectionString = process.env.DB_CONNECTION_STRING_LOCAL;
mongoose_1.default.connect(dbConnectionString).then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("connection to local db success");
    yield uploadAllData();
    process.exit();
}));
//___________________________________________________________
