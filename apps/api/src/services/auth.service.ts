import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import {
  InvalidCredentialsError,
  UnauthorizedError,
  AppError,
} from "../lib/errors";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../lib/email";

export async function register(
  email: string,
  password: string,
  fullName: string,
  role?: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerifyToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: role || "USER",
      emailVerifyToken,
      profile: {
        create: {}
      }
    },
  });

  try {
    await sendVerificationEmail(user.email, user.fullName, emailVerifyToken);
  } catch (error) {
    console.error("Failed to send verification email on register:", error);
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export async function login(data: {
  email: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user || !user.passwordHash) {
    throw new InvalidCredentialsError();
  }

  const isPasswordValid = await bcrypt.compare(
    data.password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
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

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
  };
}

export async function refreshToken(token: string) {
  let payload: any;
  try {
    payload = verifyRefreshToken(token);
  } catch (error) {
    throw new UnauthorizedError("Invalid refresh token signature");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const dbToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!dbToken || dbToken.revoked) {
    // Token not found or revoked — possible replay attack; revoke whole family if it exists
    if (dbToken) {
      await prisma.refreshToken.updateMany({
        where: { family: dbToken.family },
        data: { revoked: true },
      });
    }
    throw new UnauthorizedError("Compromised session. All tokens revoked.");
  }

  if (dbToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token expired");
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: dbToken.id },
    data: { revoked: true },
  });

  // Generate new tokens
  const newAccessToken = generateAccessToken(
    dbToken.userId,
    dbToken.user.role,
    dbToken.user.email,
    dbToken.user.emailVerified
  );
  const newRefreshToken = generateRefreshToken(dbToken.userId);

  const newHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: dbToken.userId,
      tokenHash: newHash,
      family: dbToken.family,
      expiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: dbToken.user.id,
      email: dbToken.user.email,
      fullName: dbToken.user.fullName,
      role: dbToken.user.role,
    },
  };
}

export async function logout(token: string) {
  let payload: any;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return;
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revoked: true },
    });
  } catch (error) {
    // ignore if not found
  }
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findUnique({
    where: { emailVerifyToken: token },
  });

  if (!user) {
    throw new AppError("Invalid or expired verification token", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  });

  try {
    await sendWelcomeEmail(user.email, user.fullName);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }

  return {
    id: user.id,
    email: user.email,
    emailVerified: true,
  };
}

export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.emailVerified) {
    throw new AppError("Email is already verified", 400);
  }

  const emailVerifyToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken },
  });

  try {
    await sendVerificationEmail(user.email, user.fullName, emailVerifyToken);
  } catch (error) {
    console.error("Failed to send verification email on resend:", error);
  }

  return { message: "Verification email resent successfully" };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const passwordResetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken,
      passwordResetExpires,
    },
  });

  try {
    await sendPasswordResetEmail(user.email, user.fullName, passwordResetToken);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }

  return { message: "Password reset email sent successfully" };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { passwordResetToken: token },
  });

  if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Revoke all existing refresh tokens for security
  await prisma.refreshToken.updateMany({
    where: { userId: user.id },
    data: { revoked: true },
  });

  return { message: "Password has been reset successfully" };
}
