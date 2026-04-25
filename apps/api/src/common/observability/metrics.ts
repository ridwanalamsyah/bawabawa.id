import type { NextFunction, Request, Response } from "express";

const counters = {
  requestsTotal: 0,
  requestsError: 0
};

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  counters.requestsTotal += 1;
  res.on("finish", () => {
    if (res.statusCode >= 400) counters.requestsError += 1;
  });
  next();
}

export function getMetricsSnapshot() {
  return {
    ...counters,
    errorRate:
      counters.requestsTotal === 0
        ? 0
        : Number((counters.requestsError / counters.requestsTotal).toFixed(4))
  };
}
