import { Router, type IRouter } from "express";
import authRouter from "./auth.routes";
import userRouter from "./user.routes";
import { authenticate } from "../middleware/authenticate";
import { requireVerified } from "../middleware/requireVerified";

const router: IRouter = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    version: "1.0.0",
  });
});

router.use("/auth", authRouter);
router.use("/v1/auth", authRouter);
router.use("/v1/users", userRouter);

router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "Protected route works ✅",
  });
});

router.get("/verified-only", authenticate, requireVerified, (req, res) => {
  res.json({
    message: "Verified-only route works ✅",
  });
});

export default router;