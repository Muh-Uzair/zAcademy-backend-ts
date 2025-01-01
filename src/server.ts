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

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is listening on port ${process.env.PORT || 3000} | request to 127.0.0.1:3000`,
  );
});
