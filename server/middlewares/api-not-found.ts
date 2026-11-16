import type { Request, Response } from "express";

export function apiNotFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    error: "API endpoint not found",
    message: "Check the URL and HTTP method, then try again.",
    path: `${req.baseUrl}${req.path}`,
    method: req.method,
  });
}
