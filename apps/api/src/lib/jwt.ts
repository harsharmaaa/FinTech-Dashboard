import jwt from "jsonwebtoken";
import { config } from "../config";
import crypto from "crypto";

export function generateAccessToken(userId: string, role: string, email: string, emailVerified: boolean) {
  return jwt.sign(
    { userId, role, email, emailVerified },
    config.jwt.accessSecret,
    { expiresIn: "15m" }
  );
}

export function generateRefreshToken(userId: string) {
  return jwt.sign(
    { userId, jti: crypto.randomUUID() },
    config.jwt.refreshSecret,
    { expiresIn: "30d" }
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.jwt.accessSecret);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, config.jwt.refreshSecret);
}
