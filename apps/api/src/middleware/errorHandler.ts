import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
      code: err.code || "SERVER_ERROR",
      status: err.status || 500,
    },
  });
};