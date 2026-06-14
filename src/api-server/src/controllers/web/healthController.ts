import type { Request, Response } from "express";
import { z } from "zod";

const HealthCheckResponse = z.object({ status: z.enum(["ok"]) });

export function getHealth(_req: Request, res: Response) {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
}
