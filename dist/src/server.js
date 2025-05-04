"use strict";
// process.on("uncaughtException", (err: unknown) => {
//   console.log("Uncaught exception");
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//   console.log();
//   if (err instanceof Error) {
//     console.log(err);
//     console.log(err.name, err.message);
//   } else {
//     console.log(err);
//   }
//   process.exit(1);
// });
// import app from "./app";
// import dotenv from "dotenv";
// import mongoose from "mongoose";
// dotenv.config({ path: "./config.env" });
// // connecting to remote DB _____________________________________
// if (!process.env.DB_CONNECTION_STRING_REMOTE || !process.env.DB_PASSWORD) {
//   throw new Error("Missing required environment variables.");
// }
// const dbConnectionString = process.env.DB_CONNECTION_STRING_REMOTE.replace(
//   "<DB_PASSWORD>",
//   process.env.DB_PASSWORD
// );
// mongoose
//   .connect(dbConnectionString)
//   .then(() => console.log("connection to remote db success"));
// // //___________________________
// // if (!process.env.DB_CONNECTION_STRING_LOCAL) {
// //   throw new Error("Missing required environment variables.");
// // }
// // const dbConnectionString = process.env.DB_CONNECTION_STRING_LOCAL;
// // mongoose
// //   .connect(dbConnectionString)
// //   .then(() => console.log("connection to local db success"));
// // //___________________________
// const port = process.env.PORT || 3000;
// const server = app.listen(port, () => {
//   console.log(
//     `Server is listening on port ${port} | request to 127.0.0.1/${port}`
//   );
// });
// // if any async returns an error and that is not handled this will catch it
// process.on("unhandledRejection", (err: unknown) => {
//   console.log("Unhandled error rejections");
//   if (err instanceof Error) {
//     console.log(err);
//     console.log(err.name, err.message);
//   } else {
//     console.log(err);
//   }
//   server.close(() => {
//     process.exit(1);
//   });
// });
// Top: Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.log("Uncaught exception");
    if (err instanceof Error) {
        console.log(err);
        console.log(err.name, err.message);
    }
    else {
        console.log(err);
    }
    process.exit(1);
});
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
// Load env vars
dotenv_1.default.config({ path: "./config.env" });
// DB connection
if (!process.env.DB_CONNECTION_STRING_REMOTE || !process.env.DB_PASSWORD) {
    throw new Error("Missing required environment variables.");
}
const dbConnectionString = process.env.DB_CONNECTION_STRING_REMOTE.replace("<DB_PASSWORD>", process.env.DB_PASSWORD);
mongoose_1.default.connect(dbConnectionString).then(() => {
    console.log("connection to remote db success");
});
// ✅ Only listen if the file is run directly (NOT when imported by Vercel)
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const server = app_1.default.listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
    // Handle unhandled rejections
    process.on("unhandledRejection", (err) => {
        console.log("Unhandled error rejections");
        if (err instanceof Error) {
            console.log(err);
            console.log(err.name, err.message);
        }
        else {
            console.log(err);
        }
        server.close(() => {
            process.exit(1);
        });
    });
}
// Export app for Vercel or testing
exports.default = app_1.default;
