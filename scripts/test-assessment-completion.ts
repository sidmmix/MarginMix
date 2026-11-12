import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { chromium, type Download } from "playwright";
import { createServer as createViteServer } from "vite";
import viteConfig from "../vite.config";
import { registerRoutes } from "../server/routes";
import { buildAssessmentEmail } from "../server/resend";
import { generateFallbackNarrative } from "../server/narrative-generator";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const progressKey = "marginmix_assessment_progress";
const answers = {
  fullName: "Assessment Browser Test",
  workEmail: "assessment-e2e@example.invalid",
  roleTitle: "Owner",
  organisationName: "Fixture Agency",
  organisationSize: "500-1000",
  industry: "marketing-advertising",
  decisionEvaluating: "renewal-extension",
  specifyContext: "single-client",
  engagementClassification: "ongoing-6-12",
  engagementType: "retainer",
  clientVolatility: "low",
  stakeholderComplexity: "low",
  seniorLeadershipInvolvement: "minimal",
  midLevelOversight: "low",
  executionThinkingMix: "execution-heavy",
  iterationIntensity: "low",
  scopeChangeLikelihood: "low",
  crossFunctionalCoordination: "low",
  aiEffortShift: "junior_execution",
  marginalValueSaturation: "significant",
  seniorOversightLoad: "less",
  coordinationDecisionDrag: "minimal",
  deliveryConfidence: "high",
  aiHumanHoursReplaced: "0-25",
  aiCommercialImpactMeasured: "yes",
  aiAgenticFramework: "no",
  openSignal: "",
};

async function main() {
  let capturedEmail: ReturnType<typeof buildAssessmentEmail> | undefined;
  let storedAssessment: unknown;
  let emailSendCount = 0;
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  const server = await registerRoutes(app, {
    createAssessment: async (assessment) => {
      storedAssessment = assessment;
      return { id: "synthetic-assessment-id" };
    },
    generateNarrative: async (decision, openSignal) => generateFallbackNarrative(decision, openSignal),
    sendAssessmentEmail: async (decision, openSignal, attachments) => {
      emailSendCount += 1;
      capturedEmail = buildAssessmentEmail(decision, openSignal, attachments);
    },
  });

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
  });
  app.use(vite.middlewares);
  app.use("*", async (request, response, next) => {
    try {
      const template = await fs.readFile(path.join(projectRoot, "client", "index.html"), "utf8");
      const html = await vite.transformIndexHtml(request.originalUrl, template);
      response.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });

  const browserServer = server;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let browserServerListening = false;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/repl/tools/bin/chromium",
      args: ["--no-sandbox"],
    });
    await new Promise<void>((resolve, reject) => {
      browserServer.once("error", reject);
      browserServer.listen(0, "127.0.0.1", () => {
        browserServerListening = true;
        resolve();
      });
    });
    const address = browserServer.address();
    assert.ok(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    page.setDefaultTimeout(5_000);
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("validateDOMNesting")) {
        console.error("[browser console]", message.text());
      }
    });
    page.on("pageerror", (error) => console.error("[browser page error]", error.message));
    await page.addInitScript(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify({ data: value, timestamp: new Date().toISOString() }));
    }, { key: progressKey, value: answers });

    let assessmentPostCount = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && new URL(request.url()).pathname === "/api/assessments") {
        assessmentPostCount += 1;
      }
    });

    const navigation = await page.goto(`${origin}/assessment`);
    assert.equal(navigation?.status(), 200, "The assessment route should load");
    await page.getByRole("heading", { name: "Margin Risk Assessment" }).waitFor();
    await page.getByRole("button", { name: /Click \/ Enter \/ Return to continue/ }).click();

    await page.getByRole("heading", { name: "Name of Account" }).waitFor();
    await page.waitForTimeout(550);
    await page.getByPlaceholder("e.g. Acme Corp").fill("Synthetic Client");
    const accountContinue = page.getByRole("button", { name: "Continue" }).last();
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes("Continue"));
      return button instanceof HTMLButtonElement && !button.disabled;
    });
    await accountContinue.press("Enter");

    await page.getByRole("heading", { name: /current margin of the project/ }).waitFor();
    await page.getByPlaceholder("e.g. 18").fill("25");
    await page.getByRole("heading", { name: "What's your full name?" }).waitFor({ timeout: 2_000 });
    assert.equal(await page.getByPlaceholder("Enter your full name").inputValue(), answers.fullName);
    await page.waitForTimeout(550);

    const questionCount = await page.locator("button[title^='Q']").count();
    assert.ok(questionCount >= 20, `Expected the independent full questionnaire, found ${questionCount} question markers`);
    let reachedReview = false;
    for (let index = 0; index <= questionCount; index += 1) {
      const reviewButton = page.getByRole("button", { name: "Review", exact: true });
      if (await reviewButton.isVisible()) {
        await reviewButton.click({ force: true });
        reachedReview = true;
        break;
      }
      const questionHeading = page.locator(".mm-assessment h2").last();
      const titleBefore = await questionHeading.innerText();
      await page.getByRole("button", { name: "Continue", exact: true }).click({ force: true });
      await page.waitForTimeout(550);
      if (await questionHeading.innerText() === titleBefore) {
        const firstChoice = questionHeading
          .locator("xpath=ancestor::div[contains(@class, 'max-w-2xl')][1]")
          .locator('button[type="button"]')
          .first();
        if (await firstChoice.count()) {
          await firstChoice.click({ force: true });
          await page.waitForTimeout(550);
        }
      }
    }
    if (!reachedReview) {
      console.error(
        "Questionnaire did not reach review:",
        (await page.locator(".mm-assessment").innerText()).slice(0, 1_200),
      );
    }
    assert.ok(reachedReview, "The complete assessment questionnaire should reach its review screen");

    await page.getByRole("heading", { name: "Review Your Answers" }).waitFor();
    await page.locator("#consent").check();
    const downloadsReady = new Promise<Download[]>((resolve, reject) => {
      const captured: Download[] = [];
      const onDownload = (download: Download) => {
        captured.push(download);
        if (captured.length === 2) {
          clearTimeout(timeout);
          page.off("download", onDownload);
          resolve(captured);
        }
      };
      const timeout = setTimeout(() => {
        page.off("download", onDownload);
        reject(new Error(`Expected two automatic PDF downloads, received ${captured.length}`));
      }, 15_000);
      page.on("download", onDownload);
    });
    await page.getByRole("button", { name: /Submit to Proceed/ }).click({ force: true });
    await page.getByText("Your PDFs are ready.").waitFor();
    const automaticDownloads = await downloadsReady;
    const downloadedFiles = await Promise.all(automaticDownloads.map(async (download) => {
      const outputPath = await download.path();
      assert.ok(outputPath, `No browser download file for ${download.suggestedFilename()}`);
      const { readFile } = await import("node:fs/promises");
      return { filename: download.suggestedFilename(), bytes: await readFile(outputPath) };
    }));

    assert.equal(emailSendCount, 1, "The assessment should trigger exactly one automated email attempt");
    assert.equal(assessmentPostCount, 1, "Completing assessment should make exactly one API submission");
    assert.ok(storedAssessment, "The assessment endpoint should persist the submitted synthetic assessment");
    assert.ok(capturedEmail, "The automated email should be built by the assessment route");
    const emailAttachments = capturedEmail.attachments ?? [];
    assert.equal(emailAttachments.length, 2, "Automated email must include both PDFs");
    assert.deepEqual(
      emailAttachments.map((attachment) => attachment.filename).sort(),
      downloadedFiles.map((download) => download.filename).sort(),
      "Email attachments and automatic browser downloads must use the same two report filenames",
    );
    assert.equal(downloadedFiles.length, 2, "Both reports should automatically download");
    const attachmentByFilename = new Map(emailAttachments.map((attachment) => [
      attachment.filename,
      Buffer.from(attachment.content as unknown as Uint8Array),
    ]));
    for (const download of downloadedFiles) {
      assert.ok(download.bytes.subarray(0, 5).equals(Buffer.from("%PDF-")), `${download.filename} must be a valid PDF`);
      assert.ok(
        download.bytes.equals(attachmentByFilename.get(download.filename)),
        `${download.filename} browser download must match its automated email attachment`,
      );
    }
    for (const [filename, content] of attachmentByFilename) {
      assert.ok(content.subarray(0, 5).equals(Buffer.from("%PDF-")), `${filename} email attachment must be a valid PDF`);
    }
    assert.match(downloadedFiles.map(({ filename }) => filename).join("\n"), /decision_memo/i);
    assert.match(downloadedFiles.map(({ filename }) => filename).join("\n"), /assessment_results/i);

    await page.goto(`${origin}/quick-profiler`);
    await page.getByRole("heading", { name: /Quick Margin Risk Profiler/i }).waitFor();
    assert.equal(assessmentPostCount, 1, "Opening quick profiler must not submit another full assessment");
    assert.equal(emailSendCount, 1, "Opening quick profiler must not submit the full assessment or send another email");
    await context.close();

    console.log("Assessment browser-to-email check passed: both PDFs downloaded and attached; quick profiler remained separate.");
  } finally {
    await browser?.close();
    await vite.close();
    if (browserServerListening) {
      browserServer.closeAllConnections();
      await new Promise<void>((resolve, reject) => {
        browserServer.close((error) => error ? reject(error) : resolve());
      });
    }
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
