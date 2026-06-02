import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import passport from "passport";
import "./config/passport";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notfound";

export const app: Express = express();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many requests from this IP, please try again after 15 minutes",
      code: "TOO_MANY_REQUESTS",
      status: 429,
    },
  },
});

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(globalLimiter);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Routes
app.use("/api", routes);

// 404
app.use(notFound);

// Error handler
app.use(errorHandler);
