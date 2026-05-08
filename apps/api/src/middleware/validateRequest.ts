import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validateRequest =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({
        error: {
          message: error.errors?.[0]?.message || "Validation error",
          code: "VALIDATION_ERROR",
          status: 400,
        },
      });
    }
  };