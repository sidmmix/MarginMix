import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { apiNotFoundMiddleware } from "./api-not-found";

test("mistyped API paths return a useful JSON 404 without affecting other routes", async () => {
  const app = express();
  app.get("/api/benchmarks", (_req, res) => res.json({ results: [] }));
  app.use("/api", apiNotFoundMiddleware);
  app.use((_req, res) => res.status(200).type("html").send("Application page"));

  const server = createServer(app);
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const unknownApi = await fetch(`${baseUrl}/api/benchmarks/searhc?source=test`);
    assert.equal(unknownApi.status, 404);
    assert.match(unknownApi.headers.get("content-type") ?? "", /application\/json/);
    assert.deepEqual(await unknownApi.json(), {
      error: "API endpoint not found",
      message: "Check the URL and HTTP method, then try again.",
      path: "/api/benchmarks/searhc",
      method: "GET",
    });

    const knownApi = await fetch(`${baseUrl}/api/benchmarks`);
    assert.equal(knownApi.status, 200);
    assert.deepEqual(await knownApi.json(), { results: [] });

    const applicationPage = await fetch(`${baseUrl}/application-route`);
    assert.equal(applicationPage.status, 200);
    assert.equal(await applicationPage.text(), "Application page");
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }
});
