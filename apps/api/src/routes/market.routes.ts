import { Router } from "express";
import {
  getQuote,
  getBars,
  searchSymbols,
  getTopMovers,
} from "../controllers/market.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Require authorization for market data access
router.use(authenticate);

router.get("/quote/:symbol", getQuote);
router.get("/bars/:symbol", getBars);
router.get("/search", searchSymbols);
router.get("/movers", getTopMovers);

export default router;
