import { Request, Response, NextFunction } from "express";
import { redis } from "../lib/redis";

export const loginRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "unknown_ip";
    const key = `rate_limit:login:${ip}`;

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      // Set expiry to 15 minutes (900 seconds) for the first attempt
      await redis.expire(key, 900);
    }

    if (attempts > 5) {
      res.status(429).json({
        error: {
          message: "Too many login attempts, please try again after 15 minutes",
          code: "TOO_MANY_REQUESTS",
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    next();
  }
};

export const resendVerificationLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : "unknown_email";
    const key = `rate_limit:resend_verification:${email}:${ip}`;

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      // Set expiry to 1 hour (3600 seconds)
      await redis.expire(key, 3600);
    }

    if (attempts > 3) {
      res.status(429).json({
        error: {
          message: "Too many verification requests. Please try again in 1 hour.",
          code: "TOO_MANY_REQUESTS",
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Resend verification rate limiter error:", error);
    next();
  }
};

export const passwordResetLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : "unknown_email";
    const key = `rate_limit:password_reset:${email}:${ip}`;

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      // Set expiry to 1 hour (3600 seconds)
      await redis.expire(key, 3600);
    }

    if (attempts > 3) {
      res.status(429).json({
        error: {
          message: "Too many password reset attempts. Please try again in 1 hour.",
          code: "TOO_MANY_REQUESTS",
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Password reset rate limiter error:", error);
    next();
  }
};
