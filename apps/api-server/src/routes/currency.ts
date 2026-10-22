import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { currencyService } from "../services/currency-service";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * GET /currency/rates
 * Returns daily reference exchange rates against INR from Frankfurter (ECB).
 * Server-side cached, validated, and resilient with transparent reference date & status.
 */
router.get("/currency/rates", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const forceFresh = req.query.fresh === "true" || req.query.fresh === "1";
    const snapshot = await currencyService.getExchangeRates(forceFresh);
    res.setHeader("Cache-Control", "public, max-age=1800"); // 30 mins browser caching
    res.json(snapshot);
  } catch (err: any) {
    logger.error({ err: err?.message }, "[Currency Route] Unexpected error fetching currency rates");
    res.status(500).json({
      error: "Unable to retrieve reference exchange rates at this time.",
    });
  }
});

export default router;
