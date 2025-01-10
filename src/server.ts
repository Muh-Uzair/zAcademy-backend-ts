process.on("uncaughtException", (err: unknown) => {
  console.log("Uncaught exception");

  // afaq ref

  if (err instanceof Error) {
    console.log(err.name, err.message);
  } else {
    console.log(err);
  }

  process.exit(1);
});

import app from "./app";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./config.env" });

// connecting to remote DB _____________________________________
// if (!process.env.DB_CONNECTION_STRING_REMOTE || !process.env.DB_PASSWORD) {
//   throw new Error("Missing required environment variables.");
// }

// const dbConnectionString = process.env.DB_CONNECTION_STRING_REMOTE.replace(
//   "<DB_PASSWORD>",
//   process.env.DB_PASSWORD,
// );

// mongoose
//   .connect(dbConnectionString)
//   .then(() => console.log("connection to db success"));

// //___________________________
if (!process.env.DB_CONNECTION_STRING_LOCAL) {
  throw new Error("Missing required environment variables.");
}

const dbConnectionString = process.env.DB_CONNECTION_STRING_LOCAL;

mongoose
  .connect(dbConnectionString)
  .then(() => console.log("connection to local db success"));
//___________________________

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server is listening on port ${process.env.PORT} | request to 127.0.0.1:3000`
  );
});

// if any async returns an error and that is not handled this will catch it
process.on("unhandledRejection", (err: unknown) => {
  console.log("Unhandled error rejections");

  if (err instanceof Error) {
    console.log(err.name, err.message);
  } else {
    console.log(err);
  }

  server.close(() => {
    process.exit(1);
  });
});
