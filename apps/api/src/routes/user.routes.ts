import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";

const router: Router = Router();

// Apply authenticate middleware to all user routes
router.use(authenticate);

router.get("/me", getMe);
router.patch("/me", updateMe);

export default router;
