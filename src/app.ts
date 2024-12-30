import express from "express";
import coursesRouter from "./routes/courses-routes";

const app = express();

app.use(express.json());

app.use("/api/courses", coursesRouter);

export default app;
