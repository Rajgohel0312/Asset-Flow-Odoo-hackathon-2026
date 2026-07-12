import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { NotFoundError } from "./utils/errors.js";
import crypto from "crypto";

import mainRouter from './routes.js';
const app = express();

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  next();
});

app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1", mainRouter);

app.use((req, res, next) => {
  next(new NotFoundError(`Cannot find ${req.originalUrl} on this server`));
});

app.use(errorMiddleware);

export default app;
