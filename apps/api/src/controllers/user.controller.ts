import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../lib/errors";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const { timezone, country, riskLevel, experience } = req.body;
    
    const profile = await prisma.userProfile.update({
      where: { userId },
      data: {
        ...(timezone && { timezone }),
        ...(country !== undefined && { country }),
        ...(riskLevel && { riskLevel }),
        ...(experience && { experience }),
      },
    });

    res.json({
      status: "success",
      data: { profile },
    });
  } catch (error) {
    next(error);
  }
}
