import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  register,
  loginHandler,
  refresh,
  logoutHandler,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleCallback,
  getSessions,
  deleteSession,
} from "../controllers/auth.controller";
import { validateRequest } from "../middleware/validateRequest";
import {
  loginRateLimiter,
  resendVerificationLimiter,
  passwordResetLimiter,
} from "../middleware/rateLimiter";
import { authenticate } from "../middleware/authenticate";
import passport from "passport";

const router: IRouter = Router();

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  fullName: z.string().min(2, "Full name must be at least 2 characters long"),
  role: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const emailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", loginRateLimiter, validateRequest(loginSchema), loginHandler);
router.post("/refresh", refresh);
router.post("/logout", logoutHandler);

// Email verification & password reset routes
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationLimiter, validateRequest(emailSchema), resendVerification);
router.post("/forgot-password", passwordResetLimiter, validateRequest(emailSchema), forgotPassword);
router.post("/reset-password", validateRequest(resetPasswordSchema), resetPassword);

// Google OAuth routes
router.get("/oauth/google", googleLogin);
router.get(
  "/oauth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "http://localhost:3000/login?error=oauth_failed" }),
  googleCallback
);

// Session management routes
router.get("/sessions", authenticate, getSessions);
router.delete("/sessions/:id", authenticate, deleteSession);

export default router;
