import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { login } from "../services/auth.service";
import { UnauthorizedError } from "../lib/errors";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import passport from "passport";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, fullName, role } = req.body;
    const user = await authService.register(email, password, fullName, role);
    res.status(201).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await login(req.body);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.status(200).json({
      status: "success",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedError("Refresh token missing");
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(token);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.status(200).json({
      status: "success",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie("refreshToken");

    res.json({
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({
        error: {
          message: "Verification token is required",
          code: "INVALID_TOKEN",
        },
      });
      return;
    }
    const result = await authService.verifyEmail(token);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resendVerification(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({
        error: {
          message: "Email is required",
          code: "INVALID_INPUT",
        },
      });
      return;
    }
    const result = await authService.resendVerification(email);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({
        error: {
          message: "Email is required",
          code: "INVALID_INPUT",
        },
      });
      return;
    }
    const result = await authService.forgotPassword(email);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({
        error: {
          message: "Token and password are required",
          code: "INVALID_INPUT",
        },
      });
      return;
    }
    const result = await authService.resetPassword(token, password);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});

export async function googleCallback(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.user as any;
    if (!user) {
      res.redirect("http://localhost:3000/login?error=unauthorized");
      return;
    }

    const accessToken = generateAccessToken(
      user.id,
      user.role,
      user.email,
      user.emailVerified
    );

    const refreshToken = generateRefreshToken(user.id);
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const family = crypto.randomUUID();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        family,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.redirect(`http://localhost:3000/dashboard?token=${accessToken}`);
  } catch (error) {
    next(error);
  }
}

export async function getSessions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { sessions },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const sessionId = req.params.id;
    if (!sessionId) {
      res.status(400).json({
        error: {
          message: "Session ID is required",
          code: "INVALID_INPUT",
        },
      });
      return;
    }

    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({
        error: {
          message: "Session not found",
          code: "NOT_FOUND",
        },
      });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({
        error: {
          message: "You do not have permission to revoke this session",
          code: "FORBIDDEN",
        },
      });
      return;
    }

    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revoked: true },
    });

    res.status(200).json({
      status: "success",
      message: "Session revoked successfully",
    });
  } catch (error) {
    next(error);
  }
}
