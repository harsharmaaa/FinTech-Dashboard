import { Router } from "express";
import {
  getQuote,
  getBars,
  searchSymbols,
  getTopMovers,
  getOverview,
  getNews,
  getEarnings,
  getAssets,
} from "../controllers/market.controller";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Require authorization for market data access
router.use(authenticate);

router.get("/quote/:symbol", getQuote);
router.get("/bars/:symbol", getBars);
router.get("/search", searchSymbols);
router.get("/movers", getTopMovers);
router.get("/overview", getOverview);
router.get("/news", getNews);
router.get("/calendar/earnings", getEarnings);
router.get("/assets", getAssets);

export default router;
