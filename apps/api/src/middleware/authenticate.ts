import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      email: string;
      emailVerified: boolean;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: {
          message: "Unauthorized",
          code: "INVALID_TOKEN",
        },
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        error: {
          message: "Unauthorized",
          code: "INVALID_TOKEN",
        },
      });
      return;
    }

    const payload = verifyAccessToken(token) as any;
    req.user = {
      id: payload.userId,
      role: payload.role,
      email: payload.email,
      emailVerified: payload.emailVerified,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      error: {
        message: "Unauthorized",
        code: "INVALID_TOKEN",
      },
    });
    return;
  }
};
