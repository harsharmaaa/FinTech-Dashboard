import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    version: "1.0.0",
  });
});

export default router;