/**
 * Browser regression checks for the profiler, full assessment, and engagement
 * audit. Uses synthetic inputs only and never submits data to the app.
 * Run against the configured development workflow:
 *   npm run test:questionnaire-navigation
 */
import assert from "node:assert/strict";
import { chromium, type Page } from "playwright";

const base = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://127.0.0.1:5000";
const viewports = [
  { name: "desktop", width: 1365, height: 900 },
  { name: "phone", width: 390, height: 844 },
] as const;

const browser = await chromium.launch({
  executablePath: "/repl/tools/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const pageErrors: string[] = [];

async function preparePage(page: Page, path: string) {
  await page.addInitScript(() => {
    localStorage.removeItem("marginmix_profiler_answers");
    localStorage.removeItem("marginmix_assessment_progress");
    localStorage.removeItem("marginmix_audit_draft");
    localStorage.setItem("marginmix_cookie_consent", "declined");
  });
  await page.goto(`${base}${path}`);
  await page.locator("nav.mm-nav").waitFor();
  assert.equal(await page.locator("nav.mm-nav").count(), 1, `${path} should use one shared header`);
  assert.equal(await page.locator("footer").count(), 1, `${path} should use one shared footer`);
}

async function assertFocused(page: Page, selector: string, message: string) {
  await page.waitForFunction(
    (inputSelector) => document.activeElement === document.querySelector(inputSelector),
    selector,
  );
  assert.equal(await page.locator(selector).evaluate((element) => element === document.activeElement), true, message);
}

async function checkQuickProfiler(width: number, height: number) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await preparePage(page, "/quick-profiler");
    await page.getByRole("heading", { name: "Quick Margin Risk Profiler" }).waitFor();
    await page.getByRole("button", { name: /Click \/ Enter \/ Return to continue/ }).click();

    const margin = page.locator('input[type="number"]');
    await margin.waitFor();
    await assertFocused(page, 'input[type="number"]', "Profiler margin should receive focus");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByText("Please enter a valid margin % (between 0 and 100) to continue.", { exact: true }).waitFor();

    await margin.fill("22");
    await page.getByRole("heading", { name: "What decision are you evaluating with this assessment?" }).waitFor();
    await page.getByRole("button", { name: /New client win \/ pitch acceptance/i }).click();
    await page.getByRole("heading", { name: "How would you classify this engagement today?" }).waitFor();
    // Answer as soon as the animated question appears to catch stale delayed transitions.
    await page.getByRole("button", { name: /New \(pre-kickoff \/ onboarding phase\)/i }).click();
    await page.getByRole("heading", { name: "How would you rate client volatility?" }).waitFor();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByText("Please answer before proceeding.", { exact: true }).waitFor();
  } finally {
    await context.close();
  }
}

async function checkAssessment(width: number, height: number) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await preparePage(page, "/assessment");
    await page.getByRole("button", { name: /Click \/ Enter \/ Return to continue/ }).click();

    const accountName = page.getByPlaceholder("e.g. Acme Corp");
    await accountName.waitFor();
    await assertFocused(page, 'input[placeholder="e.g. Acme Corp"]', "Assessment account name should receive focus");
    await accountName.fill("Synthetic Navigation Test");
    await accountName.press("Enter");

    const margin = page.locator('input[type="number"]');
    await margin.waitFor();
    await assertFocused(page, 'input[type="number"]', "Assessment margin should receive focus");
    await margin.fill("22");
    await page.getByRole("heading", { name: "What's your full name?" }).waitFor();

    const fullName = page.getByPlaceholder("Enter your full name");
    await assertFocused(page, 'input[placeholder="Enter your full name"]', "Assessment contact field should receive focus");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByText("Please answer before proceeding.", { exact: true }).waitFor();
    await fullName.fill("Synthetic User");
    await fullName.press("Enter");
    await page.getByRole("heading", { name: "What's your work email?" }).waitFor();
    await assertFocused(page, 'input[placeholder="Enter your work email"]', "Assessment email field should receive focus");
  } finally {
    await context.close();
  }
}

async function checkAudit(width: number, height: number) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  try {
    await preparePage(page, "/audit-questions");
    await page.getByRole("heading", { name: "First, what’s your name?" }).waitFor();
    const name = page.getByRole("textbox", { name: "First, what’s your name?" });
    await assertFocused(page, 'input[aria-label="First, what’s your name?"]', "Audit name field should receive focus");

    const continueButtons = page.getByRole("button", { name: "Press Enter or click here to continue", exact: true });
    await continueButtons.first().click();
    const requiredAnswerAlert = page.getByRole("alert");
    await requiredAnswerAlert.waitFor();
    assert.match(await requiredAnswerAlert.innerText(), /Please answer this question/);

    await name.fill("Synthetic User");
    await name.press("Enter");
    const email = page.getByRole("textbox", { name: "What’s your email address?" });
    await email.waitFor();
    await assertFocused(page, 'input[aria-label="What’s your email address?"]', "Audit email field should receive focus");

    await email.fill("not-an-email");
    await continueButtons.last().click();
    await page.getByRole("alert").filter({ hasText: "valid email" }).waitFor();

    await email.fill("navigation-test@example.invalid");
    await email.press("Enter");
    const agency = page.getByRole("textbox", { name: "What’s your agency’s name?" });
    await agency.waitFor();
    await assertFocused(page, 'input[aria-label="What’s your agency’s name?"]', "Audit agency field should receive focus");
    await agency.fill("Synthetic Agency");
    await page.getByRole("button", { name: "Press Enter or click here to continue", exact: true }).last().click();
    await page.getByRole("heading", { name: "What should we call this engagement?" }).waitFor();
  } finally {
    await context.close();
  }
}

try {
  for (const viewport of viewports) {
    await checkQuickProfiler(viewport.width, viewport.height);
    await checkAssessment(viewport.width, viewport.height);
    await checkAudit(viewport.width, viewport.height);
    console.log(`PASS questionnaire navigation at ${viewport.name} width`);
  }
  assert.deepEqual(pageErrors, [], `Browser pages reported errors:\n${pageErrors.join("\n")}`);
  console.log("PASS automatic movement, manual audit controls, required-answer alerts, contact autofocus, and shared header/footer");
} finally {
  await browser.close();
}
