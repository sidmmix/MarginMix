/** Shared intake definition: used by the guided form and server validation.
 * This is evidence collection, not a calibrated financial risk model.
 */
export type AuditAnswer = string | string[] | Record<string, string>[];
export type AuditAnswers = Record<string, AuditAnswer>;
export interface AuditQuestion {
  id: string;
  section: string;
  title: string;
  description?: string;
  type: "text" | "email" | "textarea" | "number" | "single" | "multi" | "table";
  options?: { value: string; label: string }[];
  columns?: { key: string; label: string; type?: "text" | "number" | "date" }[];
  required?: boolean;
  contact?: boolean;
  allowUnknown?: boolean;
  placeholder?: string;
}

export const auditSections = [
  { id: "contact", title: "Your details", description: "Who is completing this intake?" },
  { id: "context", title: "Engagement", description: "The work, contract and decision you are evaluating." },
  { id: "financial", title: "Financial baseline", description: "Define retained revenue and the margin you want to protect." },
  { id: "delivery", title: "Scope & delivery", description: "Describe the work, team, capacity and delivery costs." },
  { id: "actuals", title: "Progress to date", description: "Compare actual performance with what remains." },
  { id: "commercial", title: "Commercial model", description: "Questions tailored to how this engagement earns revenue." },
  { id: "exposure", title: "Delivery exposure", description: "Approvals, rework, dependencies and automation." },
  { id: "scenarios", title: "Scenarios & actions", description: "Define a credible downside and practical mitigation." },
  { id: "evidence", title: "Evidence & review", description: "Make uncertainty and missing information explicit." },
];

const options = (items: [string, string][]) => items.map(([value, label]) => ({ value, label }));
const cols = (...items: [string, string, ("text" | "number" | "date")?][]) =>
  items.map(([key, label, type]) => ({ key, label, type }));
const table = (id: string, section: string, title: string, columns: NonNullable<AuditQuestion["columns"]>, description?: string): AuditQuestion =>
  ({ id, section, title, type: "table", columns, description, required: true, allowUnknown: true });
const text = (id: string, section: string, title: string, description?: string): AuditQuestion =>
  ({ id, section, title, type: "textarea", description, required: true, allowUnknown: true });
const single = (id: string, section: string, title: string, items: [string, string][], description?: string): AuditQuestion =>
  ({ id, section, title, type: "single", options: options(items), description, required: true, allowUnknown: true });
const basis: [string, string] = ["basis", "Basis: actual / contracted / estimated"];
const commercial = "commercial";

export const auditQuestions: AuditQuestion[] = [
  { id: "name", section: "contact", title: "First, what’s your name?", type: "text", contact: true, required: true, placeholder: "Your full name" },
  { id: "email", section: "contact", title: "What’s your email address?", description: "We’ll email a PDF of your responses to this address after you submit, with a copy to Sid.", type: "email", contact: true, required: true, placeholder: "you@agency.com" },
  { id: "agency", section: "contact", title: "What’s your agency’s name?", type: "text", contact: true, required: true, placeholder: "Agency name" },
  { id: "engagement", section: "context", title: "What should we call this engagement?", description: "Use a client/project reference. An anonymous reference is fine.", type: "text", required: true, allowUnknown: true },
  { id: "services", section: "context", title: "What services are you delivering?", description: "Choose all that apply. Your answers tailor the questions ahead.", type: "multi", required: true, options: options([
    ["marketing", "Marketing, creative or media"], ["consulting", "Consulting or advisory"], ["ites", "IT-enabled or operational services"],
    ["software", "Software development"], ["implementation", "Implementation / professional services"],
    ["managed", "Managed services / ongoing support"], ["other", "Other"],
  ]) },
  text("servicesOther", "context", "Tell us about your other services."),
  { id: "models", section: "context", title: "How is this engagement priced?", description: "Select every component. Multiple selections create a hybrid intake.", type: "multi", required: true, options: options([
    ["commission", "Commission"], ["fixed", "Fixed fee / fixed price"], ["retainer", "Retainer"],
    ["tm", "Time & Materials"], ["outcome", "Outcome / success-based"], ["saas", "Subscription / SaaS"], ["other", "Other"],
  ]) },
  text("modelsOther", "context", "Describe the other pricing arrangement.", "Explain how fees are earned, the delivery obligations, and any minimums or caps."),
  { ...single("lifecycle", "context", "What decision are you evaluating?", [
    ["new", "Accepting a new engagement"], ["active", "Reviewing an active engagement"], ["renewal", "Renewing a contract"],
    ["expansion", "Expanding or changing scope"], ["recovery", "Recovering an engagement under pressure"], ["strategic", "Approving a strategic exception"],
  ]), allowUnknown: false },
  table("period", "context", "What period should we assess?", cols(
    ["start", "Engagement start", "date"], ["end", "Expected end / next review", "date"],
    ["from", "Assessment period start", "date"], ["to", "Assessment period end", "date"],
  ), "For an open-ended engagement, use the next contract review as the expected end."),
  { id: "deliveryMode", section: "context", title: "How will the work be delivered?", type: "multi", required: true, allowUnknown: true, options: options([
    ["onsite", "Onsite"], ["remote", "Remote"], ["offshore", "Offshore / nearshore"], ["distributed", "Multiple locations"], ["partners", "External partners"],
  ]) },
  text("locations", "context", "Where will delivery happen, and how will teams coordinate?", "List locations, currencies, coverage hours, time-zone overlap and handoff requirements. For a single team, say so."),
  { id: "currency", section: "financial", title: "Which currency should we use?", type: "text", placeholder: "e.g. USD, GBP, MYR", required: true, allowUnknown: true, description: "Use this currency for all amounts. List other currencies and FX assumptions in the next question." },
  text("fx", "financial", "Do other currencies affect this engagement?", "List currencies, exchange-rate assumptions and contractual FX protection. Enter “None” if not applicable."),
  single("marginDefinition", "financial", "Which margin are you assessing?", [
    ["delivery", "Delivery / gross margin — less direct delivery costs"],
    ["contribution", "Contribution margin — less specified attributable costs"],
    ["operating", "Operating margin — includes allocated overhead"],
    ["unsure", "Unsure — help us define this"],
  ], "The audit must use one consistent cost definition."),
  text("costDefinition", "financial", "Which costs are included in your margin definition?", "Identify included and excluded costs. Avoid adding employment overhead again if it is already in loaded role costs."),
  { id: "targetMargin", section: "financial", title: "What is your target margin?", type: "number", placeholder: "Percentage, e.g. 30", description: "Enter a percentage, not a decimal fraction. Choose Unknown if no target has been defined.", required: true, allowUnknown: true },
  table("revenue", "financial", "What revenue do you expect to retain?", cols(
    ["component", "Revenue component"], ["amount", "Amount", "number"], ["condition", "Period / earning condition"], basis,
  ), "Separate base fees, variable fees and other retained revenue. Exclude client pass-through spend."),
  table("deductions", "financial", "What reduces the revenue you retain?", cols(
    ["item", "Discount / credit / rebate / revenue share"], ["amount", "Amount", "number"], ["condition", "When it applies"], basis,
  ), "Include refunds, clawbacks and partner shares. If none, add “None” with amount 0."),
  table("passThrough", "financial", "Are any billings pass-through amounts?", cols(
    ["item", "Media / production / tax / other"], ["amount", "Gross amount", "number"],
    ["retained", "Retained markup / commission", "number"], basis,
  ), "Keep client spend separate from agency revenue. If none, add “None” and 0 for amounts."),
  text("terms", "financial", "What are the payment and cancellation terms?", "Include invoice timing, payment days, deposits, termination notice, amounts recoverable on cancellation, and purchases you must fund upfront."),
  table("scope", "delivery", "What is included in the agreed scope?", cols(
    ["deliverable", "Deliverable / service"], ["quantity", "Quantity / frequency"], ["acceptance", "Acceptance criteria"],
    ["revisions", "Included revisions"], ["exclusions", "Key exclusions"],
  )),
  table("staffing", "delivery", "What staffing is needed?", cols(
    ["role", "Role / grade"], ["location", "Location"], ["hours", "Planned hours", "number"],
    ["cost", "Loaded hourly cost", "number"], ["source", "Internal / contractor"], basis,
  ), "Include account management, meetings, review, QA and senior oversight. Use role-level costs, not employee salary records."),
  table("capacity", "delivery", "Can the team deliver within the planned window?", cols(
    ["role", "Role / skill"], ["available", "Available hours", "number"], ["committed", "Competing committed hours", "number"],
    ["gap", "Overtime / hiring / dependency"],
  ), "State whether available hours are before other commitments. Identify single-person or supplier dependencies."),
  table("otherCosts", "delivery", "What other delivery costs will arise?", cols(
    ["item", "Vendor / travel / tool / hosting / other"], ["amount", "Amount", "number"], ["period", "Period / cost driver"], basis,
  ), "Do not repeat contractors already included in staffing. If none, add “None” with amount 0."),
  text("obligations", "delivery", "Are setup, transition, warranty or exit activities included?", "List the work, hours/costs, and whether the client pays separately. Enter “None” if not applicable."),
  table("overhead", "delivery", "What overhead is allocated to this engagement?", cols(
    ["item", "Overhead item"], ["amount", "Amount", "number"], ["allocation", "Allocation basis"], basis,
  ), "Only include costs required by your chosen margin definition. Do not double-count loaded staffing costs."),
  table("actuals", "actuals", "What has happened so far?", cols(
    ["metric", "Revenue / hours by role / costs / accepted work"], ["value", "Actual value / quantity"], ["unit", "Currency / hours / units"],
    ["asOf", "Actuals through", "date"],
  ), "Include recognized revenue, worked hours, incurred costs and accepted deliverables. Keep invoicing and unpaid balances separate."),
  table("remaining", "actuals", "What work and revenue remain?", cols(
    ["item", "Remaining deliverable / role / cost / revenue"], ["quantity", "Amount / hours"], ["unit", "Unit"],
    ["due", "Expected date", "date"], basis,
  )),
  text("variance", "actuals", "How does performance compare with the original plan?", "Explain effort/cost overruns, fee changes, delays, non-billable work and the reasons for material differences."),
  table("changes", "actuals", "What scope changes have occurred?", cols(
    ["change", "Scope change"], ["hours", "Extra hours", "number"], ["cost", "Extra cost", "number"],
    ["approval", "Client approval status"], ["fee", "Additional fee", "number"], ["recovery", "Expected recovery"],
  ), "If none, add “None”, zero amounts and “Not applicable” for approval/recovery."),
  text("commissionBase", commercial, "What value is commissionable?", "Describe the spend/sales base and assessment period. Give expected and credible downside volumes, with the evidence supporting them."),
  table("commissionRates", commercial, "How is commission earned and retained?", cols(
    ["base", "Commission base / tier"], ["rate", "Net retained rate %", "number"], ["minimum", "Minimum fee / threshold"],
    ["cap", "Cap"], ["condition", "Rebates / shares / clawbacks"],
  )),
  text("commissionExposure", commercial, "What costs remain if commissionable volume falls?", "Include fixed account-team costs, cancellations and obligations to fund client spend before reimbursement."),
  table("fixedFees", commercial, "What fixed fees apply to each deliverable or milestone?", cols(
    ["deliverable", "Deliverable / milestone"], ["fee", "Fee", "number"], ["effort", "Effort assumptions"],
    ["acceptance", "Acceptance / payment terms"], basis,
  )),
  text("fixedProtection", commercial, "What protects the fixed-fee scope?", "State included revisions, client dependencies, change-order pricing/approval/recovery, contingency, warranty and unpaid post-delivery work."),
  text("retainerTerms", commercial, "What does the retainer include?", "Give the fee per period, minimum term, included hours/outputs/service levels, reserved capacity and expected demand by service category."),
  text("retainerExposure", commercial, "How are overages, capacity and renewal handled?", "Explain rollover, unused allowances, overage rates, minimum staffing, onboarding, notice periods, cancellation and fee escalation."),
  table("tmRates", commercial, "What are the T&M rates and hours?", cols(
    ["role", "Role / location"], ["sellRate", "Sell rate / hour", "number"], ["costRate", "Loaded cost / hour", "number"],
    ["worked", "Expected worked hours", "number"], ["billed", "Expected billed hours", "number"], basis,
  )),
  text("tmProtection", commercial, "What limits T&M billing or rate recovery?", "Include client approval, non-billable time, utilization, realization, caps, discounts, guaranteed hours, rejected timesheets/write-offs, bench and rate-versus-cost escalation dates."),
  single("outcomeType", commercial, "What makes the payment contingent?", [
    ["business", "A measured business outcome / success"],
    ["acceptance", "Acceptance of completed milestones"],
    ["both", "Both, under separate conditions"],
  ], "Acceptance milestones and success fees expose the agency to different risks."),
  text("outcomeFormula", commercial, "What is the exact outcome-payment formula?", "Include guaranteed fees, payout thresholds/caps, baseline, attribution, verification, measurement window, payment lag, dispute terms and clawbacks."),
  table("outcomeCases", commercial, "What supports your outcome scenarios?", cols(
    ["case", "Low / expected / high outcome"], ["outcome", "KPI / milestone result"], ["payout", "Fee earned", "number"],
    ["evidence", "Supporting evidence / assumptions"],
  ), "Do not invent probabilities. Distinguish agency-controlled outcomes from external dependencies."),
  text("outcomeCosts", commercial, "What is spent even if no variable fee is earned?", "Quantify unavoidable delivery costs, client obligations and external factors affecting success."),
  text("managedDemand", commercial, "How is managed-service demand charged and forecast?", "Specify the charging unit (ticket, transaction, user, capacity etc.), fee, demand by complexity/category/season, handling effort and escalation rate."),
  text("managedCoverage", commercial, "What coverage and SLA obligations apply?", "State coverage hours, minimum staffing, on-call effort, service targets, credits/penalty caps, infrastructure/licensing/support costs, transition and exit work."),
  text("implementation", commercial, "What makes implementation or software delivery complex?", "List modules, integrations, environments, migration volumes/data quality, customization, requirements maturity, technical debt, testing, security/compliance, client readiness, training and hypercare."),
  table("saasRevenue", commercial, "Separate subscription and services economics.", cols(
    ["component", "Subscription / implementation / support / other"], ["revenue", "Revenue", "number"],
    ["cost", "Attributable cost", "number"], ["allocation", "Bundle / discount allocation"], basis,
  )),
  text("saasUsage", commercial, "How do usage, customization and churn affect cost?", "Give hosting/storage/API/AI/license usage, support effort, client-specific maintenance, term/renewal/expansion assumptions and setup costs unrecovered on cancellation."),
  text("hybridAllocation", commercial, "How do your commercial components interact?", "Explain shared staffing/cost allocation, minimum guarantees, offsets, caps and cross-subsidies. Which delivery obligations remain if variable fees fall? Do not double-count shared costs."),
  text("sectorMarketing", "exposure", "What drives marketing or media workload?", "Provide campaigns, channels, markets, creative assets, localization, optimization/reporting frequency, production obligations and media-funding requirements."),
  text("sectorConsulting", "exposure", "What drives consulting workload?", "Provide partner/director hours, research and interview volumes, workshops, travel, specialist expertise and client decision dependencies."),
  text("coordination", "exposure", "How much coordination does this work require?", "List approval groups, the final decision-maker, meeting/reporting hours per period, typical approval days and conflicting requirements."),
  text("rework", "exposure", "How much rework should we expect?", "Give included versus observed revisions, rework hours or share of effort, causes and recoverability. Separate measured history from estimates."),
  table("dependencies", "exposure", "Which client dependencies could affect delivery?", cols(
    ["dependency", "Input / decision / dependency"], ["owner", "Responsible role / party"], ["date", "Required date", "date"],
    ["impact", "Delay impact / likely extra cost"],
  ), "If none, enter “None” and use the review date."),
  single("aiUse", "exposure", "Does AI or automation affect this engagement?", [
    ["yes", "Yes — in use"], ["planned", "Planned"], ["no", "No"],
  ]),
  table("aiEvidence", "exposure", "What is the measured or expected AI impact?", cols(
    ["task", "Task"], ["before", "Comparable hours before", "number"], ["after", "Hours after", "number"],
    ["review", "Review / rework hours", "number"], ["cost", "Tool / API cost", "number"],
    ["quality", "Quality outcome / fee impact"], basis,
  ), "Separate measured savings from assumed savings. Include adoption and exception-handling in your assumptions."),
  text("contractExposure", "exposure", "What contractual exposures could reduce margin?", "List service credits, penalties, refunds, warranty obligations, disputes and applicable limits. Enter “None” where appropriate."),
  text("renewal", "scenarios", "What changes at renewal or expansion?", "Provide historic actual margin, demand/scope trends, proposed fees, extra staffing obligations and the change from the existing contract."),
  text("recovery", "scenarios", "What are the recovery or exit economics?", "Separate costs already incurred from incremental completion cost. State remaining recoverable revenue, exit obligations and recovery options."),
  text("baseCase", "scenarios", "What is your expected delivery case?", "Confirm the revenue, workload, staffing and cost assumptions supporting the base case. Reference the figures provided earlier."),
  table("downside", "scenarios", "What credible downside should we test?", cols(
    ["driver", "Revenue / hours / cost / delay / penalty"], ["base", "Base assumption"], ["downside", "Downside assumption"],
    ["unit", "Unit / period"], ["evidence", "Evidence and linked changes"],
  ), "Quantify plausible changes. Identify changes that occur together; probabilities are optional and need evidence."),
  table("mitigations", "scenarios", "What practical changes could protect the margin?", cols(
    ["action", "Reprice / scope / staffing / governance / AI action"], ["benefit", "Expected benefit + unit"],
    ["cost", "Implementation cost", "number"], ["owner", "Responsible role"], ["timing", "Timing"],
    ["approval", "Client approval / status"],
  ), "If no mitigation is identified, say so and enter 0 for implementation cost."),
  text("strategic", "scenarios", "What strategic exception has been approved?", "Give the subsidy or acceptable loss, approving role, time limit, expected benefit and review date. An exception is not evidence that an engagement is financially safe."),
  table("evidence", "evidence", "How reliable are the material inputs?", cols(
    ["input", "Material input / assumption"], ["source", "Source document / system"], ["date", "As-of date", "date"],
    basis, ["range", "Expected value and reasonable range"],
  ), "Reference documents rather than uploading them. Do not include passwords, credentials or employee salary records."),
  text("missing", "evidence", "What information is still missing?", "Identify gaps that could materially change the result. Enter “None” if everything material is supported."),
  { id: "reviewers", section: "evidence", title: "Who has reviewed this submission?", type: "multi", required: true, options: options([
    ["account", "Account / client lead"], ["delivery", "Delivery lead"], ["finance", "Finance"],
    ["leadership", "Commercial / leadership"], ["not-yet", "Not yet reviewed"],
  ]) },
];

const selected = (answers: AuditAnswers, id: string, value: string) =>
  Array.isArray(answers[id]) && (answers[id] as string[]).includes(value);

export function getVisibleQuestions(answers: AuditAnswers): AuditQuestion[] {
  const modelQuestions: Record<string, string> = {
    commissionBase: "commission", commissionRates: "commission", commissionExposure: "commission",
    fixedFees: "fixed", fixedProtection: "fixed", retainerTerms: "retainer", retainerExposure: "retainer",
    tmRates: "tm", tmProtection: "tm", outcomeType: "outcome", outcomeFormula: "outcome",
    outcomeCases: "outcome", outcomeCosts: "outcome", saasRevenue: "saas", saasUsage: "saas",
  };
  return auditQuestions.filter((q) => {
    if (q.id === "servicesOther") return selected(answers, "services", "other");
    if (q.id === "modelsOther") return selected(answers, "models", "other");
    if (q.section === "actuals") return ["active", "renewal", "expansion", "recovery"].includes(String(answers.lifecycle));
    if (q.id === "overhead") return ["operating", "contribution"].includes(String(answers.marginDefinition));
    if (modelQuestions[q.id]) return selected(answers, "models", modelQuestions[q.id]);
    if (q.id === "managedDemand" || q.id === "managedCoverage") return selected(answers, "services", "managed") || selected(answers, "services", "ites");
    if (q.id === "implementation") return selected(answers, "services", "software") || selected(answers, "services", "implementation");
    if (q.id === "hybridAllocation") return Array.isArray(answers.models) && answers.models.length > 1;
    if (q.id === "sectorMarketing") return selected(answers, "services", "marketing");
    if (q.id === "sectorConsulting") return selected(answers, "services", "consulting");
    if (q.id === "aiEvidence") return ["yes", "planned"].includes(String(answers.aiUse));
    if (q.id === "renewal") return ["renewal", "expansion"].includes(String(answers.lifecycle));
    if (q.id === "recovery") return answers.lifecycle === "recovery";
    if (q.id === "strategic") return answers.lifecycle === "strategic";
    return true;
  });
}

export function validateAuditAnswer(question: AuditQuestion, answer: AuditAnswer | undefined): string | null {
  if (answer === "__unknown__") return question.allowUnknown ? null : "Please provide an answer to continue.";
  if (answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0)) {
    return question.required ? "Please answer this question or choose Unknown where available." : null;
  }
  if (typeof answer === "string" && answer.length > 12000) return "Please keep this answer under 12,000 characters.";
  if (question.type === "table") {
    if (!Array.isArray(answer) || answer.length > 100 || !answer.length || answer.some((row) => !row || typeof row !== "object" || Array.isArray(row))) return "Add at least one row (up to 100).";
    for (const row of answer as Record<string, string>[]) {
      for (const column of question.columns || []) {
        const value = row[column.key];
        if (typeof value !== "string" || !value.trim()) return `Complete “${column.label}” in each row, or choose Unknown for this question.`;
        if (value.length > 2000) return "Keep each table cell under 2,000 characters.";
        if (column.type === "number" && !Number.isFinite(Number(value))) return `Enter a valid number for “${column.label}”.`;
        if (column.type === "date" && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)))) return `Enter a valid date for “${column.label}”.`;
      }
      if (question.id === "period" && (row.start > row.end || row.from > row.to)) return "End dates must be on or after their corresponding start dates.";
      if (question.id === "staffing" && (Number(row.hours) < 0 || Number(row.cost) < 0)) return "Staffing hours and hourly costs cannot be negative.";
      if (question.id === "tmRates" && ["sellRate", "costRate", "worked", "billed"].some((key) => Number(row[key]) < 0)) return "Rates and hours cannot be negative.";
    }
    return null;
  }
  if (question.type === "multi") {
    if (!Array.isArray(answer) || answer.some((value) => typeof value !== "string" || !question.options?.some((o) => o.value === value))) return "Choose from the available options.";
    if (new Set(answer as string[]).size !== answer.length) return "Choose each option only once.";
    if (question.id === "reviewers" && (answer as string[]).includes("not-yet") && answer.length > 1) return "Choose reviewers or “Not yet reviewed”, not both.";
    return null;
  }
  if (typeof answer !== "string" || !answer.trim()) return "Please enter an answer.";
  if (question.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer.trim())) return "Please enter a valid email address.";
  if (question.type === "single" && !question.options?.some((o) => o.value === answer)) return "Choose from the available options.";
  if (question.type === "number" && !Number.isFinite(Number(answer))) return "Please enter a valid number.";
  if (question.id === "targetMargin" && Number(answer) > 100) return "A margin target cannot exceed 100%.";
  if (question.contact && answer.trim().length > 254) return "Please use 254 characters or fewer.";
  return null;
}

export function getAnswerStatus(question: AuditQuestion, answer: AuditAnswer | undefined): "unanswered" | "complete" | "estimated" | "unknown" {
  if (answer === "__unknown__" && question.allowUnknown) return "unknown";
  if (validateAuditAnswer(question, answer) || answer === undefined || answer === "") return "unanswered";
  if (Array.isArray(answer) && answer.some((row) => typeof row === "object" && /estimat|assum/i.test(row.basis || ""))) return "estimated";
  return "complete";
}

/** Never submit stale answers for branches the agency has deselected. */
export function getApplicableAnswers(answers: AuditAnswers): AuditAnswers {
  return Object.fromEntries(getVisibleQuestions(answers).filter((q) => answers[q.id] !== undefined).map((q) => [q.id, answers[q.id]]));
}
