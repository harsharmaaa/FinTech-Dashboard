import { Request, Response, NextFunction } from "express";

export const requireVerified = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({
      error: {
        message: "Unauthorized",
        code: "INVALID_TOKEN",
      },
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      error: {
        message: "Forbidden. Email verification required.",
        code: "EMAIL_NOT_VERIFIED",
      },
    });
    return;
  }

  next();
};
