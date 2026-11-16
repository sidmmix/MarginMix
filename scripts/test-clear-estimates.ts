/**
 * Checks session cleanup using synthetic data only; never submits review emails.
 * Run against the development workflow: npm run test:clear-estimates
 */
import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";
import { computeLeak, LEAK_RESULT_STORAGE_KEY } from "../shared/leak-engine";
import { LEAK_ESTIMATES_STORAGE_KEY } from "../client/src/lib/leak-estimates";

const base = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://127.0.0.1:5000";
const calculator = "/free-tier/calculator";
const output = `${calculator}/output`;
const result = computeLeak({
  currency: "USD", fee: 100_000, months: 6, fte: 2, staffcost: 50_000,
  targetMarginPercent: 40, scopemove: "moderate",
  scopebilled: "partly_billed", hourstracked: "partly",
});
const keys = { comparison: LEAK_ESTIMATES_STORAGE_KEY, legacy: LEAK_RESULT_STORAGE_KEY };
const browser = await chromium.launch({
  executablePath: "/repl/tools/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});

async function snapshot(page: Page) {
  return page.evaluate((keys) => ({
    comparison: sessionStorage.getItem(keys.comparison),
    legacy: sessionStorage.getItem(keys.legacy),
    unrelated: sessionStorage.getItem("clear-test-unrelated"),
  }), keys);
}

try {
  for (const viewport of [{ width: 1365, height: 900 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: "no-preference" });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.addInitScript(() => {
        localStorage.setItem("marginmix_cookie_consent", "declined");
      });
      await page.goto(`${base}${calculator}`);
      for (const legacyOnly of [false, true]) {
        await page.evaluate(({ keys, result, legacyOnly }) => {
          sessionStorage.setItem(keys.legacy, JSON.stringify(result));
          if (!legacyOnly) {
            sessionStorage.setItem(keys.comparison, JSON.stringify([
              { label: "Synthetic Northstar", result },
              { label: "Synthetic Harbor", result },
            ]));
          }
          sessionStorage.setItem("clear-test-unrelated", "keep");
        }, { keys, result, legacyOnly });
        await page.goto(`${base}${output}`);
        const clear = page.getByRole("button", { name: "Clear all estimates", exact: true });
        await clear.waitFor();
        const before = await snapshot(page);
        if (!legacyOnly) {
          await page.getByRole("heading", { name: "Synthetic Northstar", exact: true }).waitFor();
          await page.getByRole("heading", { name: "Synthetic Harbor", exact: true }).waitFor();
        }

        await clear.click();
        const dialog = page.getByRole("dialog", { name: "Clear all estimates?" });
        await dialog.waitFor();
        assert.deepEqual(await snapshot(page), before, "Opening confirmation must not delete data");
        assert.equal(await dialog.getByRole("button", { name: "Cancel", exact: true })
          .evaluate((button) => button === document.activeElement), true, "Cancel receives initial focus");
        await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
        assert.deepEqual(await snapshot(page), before, "Cancel preserves all estimates");
        assert.equal(await clear.evaluate((button) => button === document.activeElement), true);

        await clear.click();
        await dialog.waitFor();
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        assert.deepEqual(await snapshot(page), before, "Escape preserves all estimates");

        // A failed deletion must leave the dialog open and must not claim success.
        await page.evaluate(() => {
          const original = Storage.prototype.removeItem;
          Storage.prototype.removeItem = function (key) {
            if (this === sessionStorage) throw new Error("Synthetic blocked storage");
            return original.call(this, key);
          };
        });
        await clear.click();
        await dialog.getByRole("button", { name: "Clear all estimates", exact: true }).click();
        await dialog.getByRole("alert").waitFor();
        assert.deepEqual(await snapshot(page), before);
        await page.reload(); // Restores the browser's native storage method.

        await clear.click();
        await dialog.getByRole("button", { name: "Clear all estimates", exact: true }).click();
        await page.waitForURL(`${base}${calculator}`);
        assert.deepEqual(await snapshot(page), {
          comparison: null, legacy: null, unrelated: "keep",
        });
        await page.getByRole("heading", { name: "Engagement leak calculator", exact: true }).waitFor();
        assert.equal(await page.getByRole("region", { name: "Engagement estimate comparison" }).count(), 0);
        await page.reload();
        assert.equal(new URL(page.url()).pathname, calculator);
        await page.goto(`${base}${output}`);
        await page.waitForURL(`${base}${calculator}`);
        await page.goBack();
        await page.getByRole("heading", { name: "Engagement leak calculator", exact: true }).waitFor();
        assert.deepEqual(await snapshot(page), { comparison: null, legacy: null, unrelated: "keep" });
        console.log(`Passed ${viewport.width}px: ${legacyOnly ? "legacy result" : "full comparison"}`);
      }
      assert.deepEqual(errors, [], "No browser runtime errors");
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
