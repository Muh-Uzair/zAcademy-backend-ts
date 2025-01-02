import express from "express";
import coursesRouter from "./routes/courses-routes";
import morgan from "morgan";
import dotenv from "dotenv";
const app = express();
dotenv.config({ path: "./config.env" });
app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api/courses", coursesRouter);

export default app;
