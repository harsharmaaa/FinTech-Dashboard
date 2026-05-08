import { Request, Response } from "express";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: "Route not found",
      code: "NOT_FOUND",
      status: 404,
    },
  });
};