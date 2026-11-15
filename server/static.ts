import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { injectCrawlerPage } from "./crawler-pages";
import { pageResponseStatus } from "../client/src/lib/route-metadata";

export function serveStatic(
  app: Express,
  distPath = path.resolve(import.meta.dirname, "public"),
) {
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Let the HTML fallback inject route-specific crawler content, including at /.
  app.use(express.static(distPath, { index: false }));

  // Fall through to index.html if the file doesn't exist.
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(
        path.resolve(distPath, "index.html"),
        "utf-8",
      );
      const pathname = new URL(req.originalUrl, "http://localhost").pathname;
      res
        .status(pageResponseStatus(pathname))
        .type("html")
        .send(injectCrawlerPage(template, pathname));
    } catch (error) {
      next(error);
    }
  });
}
