import { Request, Response, NextFunction } from "express";

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          message: "Forbidden",
          code: "INSUFFICIENT_PERMISSIONS",
        },
      });
      return;
    }

    next();
  };
};
