import { Router, type IRouter } from "express";
import { HealthCheckResponse, GetHealthStatusResponse } from "@workspace/api-zod";
import { isConnected, getConnectionState } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health/status", (_req, res) => {
  const connected = isConnected();
  const data = GetHealthStatusResponse.parse({
    status: connected ? "healthy" : "degraded",
    database: getConnectionState(),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
  res.status(connected ? 200 : 503).json(data);
});

export default router;
