import app from "./app";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./config.env" });

// eslint-disable-next-line no-undef
const processEnv = process.env;

// connecting to remote DB _____________________________________
if (!processEnv.DB_CONNECTION_STRING_REMOTE || !processEnv.DB_PASSWORD) {
  throw new Error("Missing required environment variables.");
}

const dbConnectionString = processEnv.DB_CONNECTION_STRING_REMOTE.replace(
  "<DB_PASSWORD>",
  processEnv.DB_PASSWORD,
);

mongoose
  .connect(dbConnectionString)
  .then(() => console.log("connection to db success"));

//___________________________

app.listen(processEnv.PORT || 3000, () => {
  console.log(`Server is listening on port ${processEnv.PORT || 3000}`);
});
