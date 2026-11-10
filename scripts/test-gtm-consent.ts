import assert from "node:assert/strict";
import { chromium, type Page, type Request } from "playwright";
import { createServer } from "vite";

const browserPath = "/repl/tools/bin/chromium";

function isGtmContainerRequest(request: Request) {
  const url = new URL(request.url());
  return url.hostname === "www.googletagmanager.com" && url.pathname === "/gtm.js";
}

function isAnalyticsRequest(request: Request) {
  const url = new URL(request.url());
  return (
    url.pathname === "/g/collect" &&
    (url.hostname === "www.google-analytics.com" ||
      url.hostname === "region1.google-analytics.com" ||
      url.hostname === "analytics.google.com")
  );
}

async function waitForConsentPrompt(page: Page) {
  await page.getByRole("button", { name: "Accept all", exact: true }).waitFor();
}

const vite = await createServer({
  configFile: "vite.config.ts",
  server: { host: "127.0.0.1", port: 0, strictPort: false },
  logLevel: "error",
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

try {
  await vite.listen();
  const address = vite.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine the browser test server address.");
  }

  browser = await chromium.launch({
    executablePath: browserPath,
    headless: true,
    args: ["--no-sandbox"],
  });

  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  const noScriptGtmRequests: Request[] = [];
  const noScriptAnalyticsRequests: Request[] = [];
  noScriptPage.on("request", (request) => {
    if (isGtmContainerRequest(request)) noScriptGtmRequests.push(request);
    if (isAnalyticsRequest(request)) noScriptAnalyticsRequests.push(request);
  });
  await noScriptPage.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "domcontentloaded" });
  await noScriptPage.waitForTimeout(1000);
  assert.equal(noScriptGtmRequests.length, 0, "GTM must not load when consent cannot be collected.");
  assert.equal(noScriptAnalyticsRequests.length, 0, "Analytics tags must not send without JavaScript consent.");
  await noScriptContext.close();

  const declinedContext = await browser.newContext();
  const declinedPage = await declinedContext.newPage();
  const declinedGtmRequests: Request[] = [];
  const declinedAnalyticsRequests: Request[] = [];
  declinedPage.on("request", (request) => {
    if (isGtmContainerRequest(request)) declinedGtmRequests.push(request);
    if (isAnalyticsRequest(request)) declinedAnalyticsRequests.push(request);
  });

  await declinedPage.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "domcontentloaded" });
  await waitForConsentPrompt(declinedPage);
  await declinedPage.waitForTimeout(1200);
  assert.equal(declinedGtmRequests.length, 0, "GTM must not load before a consent choice.");
  assert.equal(declinedAnalyticsRequests.length, 0, "Analytics tags must not send before consent.");
  await declinedPage.getByRole("button", { name: "Decline", exact: true }).click();
  await declinedPage.waitForTimeout(1200);
  assert.equal(declinedGtmRequests.length, 0, "Declining consent must keep GTM unloaded.");
  assert.equal(declinedAnalyticsRequests.length, 0, "Declining consent must keep analytics blocked.");
  await declinedContext.close();

  const acceptedContext = await browser.newContext();
  const acceptedPage = await acceptedContext.newPage();
  const acceptedGtmRequests: Request[] = [];
  const acceptedAnalyticsRequests: Request[] = [];
  acceptedPage.on("request", (request) => {
    if (isGtmContainerRequest(request)) acceptedGtmRequests.push(request);
    if (isAnalyticsRequest(request)) acceptedAnalyticsRequests.push(request);
  });

  await acceptedPage.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "domcontentloaded" });
  await waitForConsentPrompt(acceptedPage);
  await acceptedPage.waitForTimeout(1200);
  assert.equal(acceptedGtmRequests.length, 0, "GTM must stay unloaded until consent is accepted.");
  assert.equal(acceptedAnalyticsRequests.length, 0, "Analytics tags must stay blocked before acceptance.");

  const gtmLoad = acceptedPage.waitForRequest(isGtmContainerRequest, { timeout: 30000 });
  const grantedAnalyticsHit = acceptedPage.waitForRequest(
    (request) => isAnalyticsRequest(request) && new URL(request.url()).searchParams.get("gcs") === "G111",
    { timeout: 30000 },
  );
  await acceptedPage.getByRole("button", { name: "Accept all", exact: true }).click();
  await Promise.all([gtmLoad, grantedAnalyticsHit]);

  assert.equal(acceptedGtmRequests.length, 1, "Accepting consent must load GTM.");
  assert.ok(acceptedAnalyticsRequests.length > 0, "Analytics tags must send after consent is accepted.");
  assert.equal(
    await acceptedPage.evaluate(() => localStorage.getItem("marginmix_cookie_consent")),
    "accepted",
  );
  await acceptedContext.close();

  const returningContext = await browser.newContext();
  await returningContext.addInitScript(() => {
    localStorage.setItem("marginmix_cookie_consent", "accepted");
  });
  const returningPage = await returningContext.newPage();
  const returningGtmRequests: Request[] = [];
  const returningAnalyticsRequests: Request[] = [];
  returningPage.on("request", (request) => {
    if (isGtmContainerRequest(request)) returningGtmRequests.push(request);
    if (isAnalyticsRequest(request)) returningAnalyticsRequests.push(request);
  });
  const returningGtmLoad = returningPage.waitForRequest(isGtmContainerRequest, { timeout: 30000 });
  const returningAnalyticsHit = returningPage.waitForRequest(
    (request) => isAnalyticsRequest(request) && new URL(request.url()).searchParams.get("gcs") === "G111",
    { timeout: 30000 },
  );
  await returningPage.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "domcontentloaded" });
  await Promise.all([returningGtmLoad, returningAnalyticsHit]);
  assert.equal(returningGtmRequests.length, 1, "Stored accepted consent must load GTM on return visits.");
  assert.ok(returningAnalyticsRequests.length > 0, "Stored accepted consent must allow analytics tags.");
  assert.equal(await returningPage.getByRole("button", { name: "Accept all", exact: true }).count(), 0);
  await returningContext.close();

  console.log("GTM consent browser check passed: no tags before consent; analytics sends after acceptance.");
} finally {
  await browser?.close();
  await vite.close();
}
