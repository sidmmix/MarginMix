import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useSearch, useLocation } from "wouter";
import { ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Send, Check, ChevronDown, Save, Home, Shield, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, BarChart3, Users, Zap, Target, AlertCircle, Info, Download, ChevronRight, Mail, Building2, Briefcase } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/footer";

const STORAGE_KEY = "marginmix_assessment_progress";
const PROFILER_STORAGE_KEY = "marginmix_profiler_answers";

const PROFILER_FIELD_KEYS = [
  "decisionEvaluating",
  "engagementClassification",
  "clientVolatility",
  "seniorLeadershipInvolvement",
  "executionThinkingMix",
  "aiEffortShift",
];

const questionRiskMapping: Record<string, Record<string, "low" | "medium" | "high">> = {
  organisationSize: { "50-500": "low", "500-1000": "medium", "1000-1500": "high", "1500-2000": "high" },
  decisionEvaluating: { "new-client-win": "low", "renewal-extension": "low", "scope-expansion": "high", "escalation": "high", "strategic-exception": "medium", "exploratory": "low" },
  specifyContext: { "single-client": "low", "group-of-clients": "medium" },
  engagementClassification: { "new": "medium", "ongoing-less-6": "medium", "ongoing-6-12": "low", "ongoing-12-plus": "low", "renewal-expansion": "medium" },
  engagementType: {
    "commission": "high", "fixed-fee": "low", "retainer": "low", "outcome-based": "high", "hybrid-retainer-commission": "medium", "hybrid-retainer-outcome": "medium",
    "ites-tm": "medium", "ites-fixed-price": "high", "ites-managed-services": "medium", "ites-retainer": "low", "ites-outcome": "high", "ites-hybrid": "medium",
    "mc-fixed-fee": "high", "mc-retainer": "low", "mc-tm": "medium", "mc-outcome": "high", "mc-hybrid": "medium",
    "sw-implementation": "high", "sw-managed-services": "medium", "sw-saas-services": "medium", "sw-fixed-price": "high", "sw-tm": "medium", "sw-outcome": "high",
  },
  deliveryModel: { "onshore-only": "low", "offshore-only": "medium", "hybrid-onshore-offshore": "medium", "nearshore": "low" },
  clientVolatility: { "low": "low", "medium": "medium", "high": "high" },
  stakeholderComplexity: { "low": "low", "medium": "medium", "high": "high" },
  seniorLeadershipInvolvement: { "minimal": "low", "periodic": "medium", "frequent": "high", "continuous": "high" },
  midLevelOversight: { "low": "low", "medium": "medium", "high": "high" },
  executionThinkingMix: { "execution-heavy": "low", "balanced": "medium", "thinking-heavy": "high", "advisory-solutioning": "high", "strategy-advisory": "high", "technical-implementation": "medium" },
  iterationIntensity: { "low": "low", "medium": "medium", "high": "high" },
  scopeChangeLikelihood: { "low": "low", "medium": "medium", "high": "high" },
  crossFunctionalCoordination: { "low": "low", "medium": "medium", "high": "high" },
  aiEffortShift: { "junior_execution": "low", "mid_level_production": "medium", "senior_thinking_review": "high", "no_clear_substitution": "high" },
  marginalValueSaturation: { "significant": "low", "some": "medium", "minimal": "high", "none": "high" },
  seniorOversightLoad: { "less": "low", "about_same": "medium", "more": "high" },
  coordinationDecisionDrag: { "minimal": "low", "moderate": "medium", "heavy": "high" },
  deliveryConfidence: { "high": "low", "some_concerns": "medium", "low": "high" },
  aiHumanHoursReplaced: { "0-25": "low", "25-50": "medium", "50-75": "high", "75-100": "high", "na": "low" },
  aiCommercialImpactMeasured: { "yes": "low", "no": "high", "na": "low" },
  aiAgenticFramework: { "yes": "high", "no": "low", "na": "low" },
};

function getHeatmapColor(risk: "low" | "medium" | "high"): string {
  if (risk === "high") return "bg-red-500";
  if (risk === "medium") return "bg-amber-400";
  return "bg-emerald-500";
}

const neutralFields = ["fullName", "workEmail", "roleTitle", "organisationName", "industry", "openSignal"];

const bucketLabels: Record<string, string> = {
  WI: "Workforce Intensity",
  SI: "Scope & Iteration",
  CO: "Coordination & Overhead",
  VSI: "Volatility & Stakeholder Impact",
  CE: "Commercial Exposure",
};

function getVerdictRecommendations(verdict: string): string[] {
  switch (verdict) {
    case "Do Not Proceed Without Repricing":
      return [
        "Halt engagement until pricing reflects true delivery complexity",
        "Conduct a structural redesign of the delivery model",
        "Re-evaluate senior involvement requirements and cost implications",
        "Negotiate scope boundaries before any commitment",
        "Establish mandatory repricing triggers for scope changes",
      ];
    case "Structurally Fragile":
      return [
        "Reduce coordination load across teams and stakeholders",
        "Implement governance checkpoints at key delivery milestones",
        "Cap senior involvement to sustainable levels",
        "Establish clear escalation protocols to prevent ad-hoc demands",
        "Monitor workforce intensity metrics weekly",
      ];
    case "Execution Heavy":
      return [
        "Set clear effort caps for senior and mid-level resources",
        "Limit senior leadership involvement to strategic checkpoints only",
        "Automate repetitive execution tasks where possible",
        "Track iteration cycles to prevent scope creep through overwork",
      ];
    case "Price Sensitive":
      return [
        "Protect scope boundaries with formal change request processes",
        "Build pricing safeguards for out-of-scope work",
        "Review commercial terms for flexibility provisions",
        "Monitor scope elasticity indicators monthly",
      ];
    case "Structurally Safe":
      return [
        "Proceed with standard governance and monitoring",
        "Maintain current delivery model and resource allocation",
        "Schedule periodic reviews to catch emerging risk signals",
        "Document successful patterns for future engagements",
      ];
    default:
      return ["Review engagement parameters and consult with leadership."];
  }
}

const assessmentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  workEmail: z.string().email("Valid email is required"),
  roleTitle: z.string().min(1, "Role/Title is required"),
  organisationName: z.string().min(1, "Organization name is required"),
  organisationSize: z.string().min(1, "Please select organization size"),
  industry: z.string().min(1, "Please select your industry"),
  decisionEvaluating: z.string().min(1, "Please select what decision you are evaluating"),
  engagementType: z.string().min(1, "Please select engagement type"),
  deliveryModel: z.string().optional(),
  specifyContext: z.string().min(1, "Please select context"),
  engagementClassification: z.string().min(1, "Please select engagement classification"),
  clientVolatility: z.string().min(1, "Please select client volatility"),
  stakeholderComplexity: z.string().min(1, "Please select stakeholder complexity"),
  seniorLeadershipInvolvement: z.string().min(1, "Please select senior leadership involvement"),
  midLevelOversight: z.string().min(1, "Please select mid-level oversight intensity"),
  executionThinkingMix: z.string().min(1, "Please select execution vs thinking mix"),
  iterationIntensity: z.string().min(1, "Please select iteration intensity"),
  scopeChangeLikelihood: z.string().min(1, "Please select scope change likelihood"),
  crossFunctionalCoordination: z.string().min(1, "Please select cross-functional coordination"),
  aiEffortShift: z.string().min(1, "Please select where AI is expected to substitute effort"),
  marginalValueSaturation: z.string().min(1, "Please select marginal value saturation"),
  seniorOversightLoad: z.string().min(1, "Please select senior oversight load"),
  coordinationDecisionDrag: z.string().min(1, "Please select coordination level"),
  deliveryConfidence: z.string().min(1, "Please select delivery confidence"),
  aiHumanHoursReplaced: z.string().min(1, "Please select"),
  aiCommercialImpactMeasured: z.string().min(1, "Please select"),
  aiAgenticFramework: z.string().min(1, "Please select"),
  openSignal: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface Question {
  id: keyof AssessmentFormData;
  number: number;
  title: string;
  subtitle?: string;
  context?: string;
  type: "text" | "email" | "select" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required: boolean;
  section: string;
  sectionColor: string;
}

function getQuestionsForIndustry(industry: string): Question[] {
  const isITeS = industry === "ites";
  const isMC = industry === "management-consulting";
  const isSW = industry === "computer-software";
  const hasDeliveryModel = isITeS || isSW;

  const decisionOptions = [
    { value: "new-client-win", label: isITeS ? "New contract / SOW acceptance" : "New client win / pitch acceptance" },
    { value: "renewal-extension", label: "Renewal / contract extension" },
    { value: "scope-expansion", label: "Scope expansion without repricing" },
    { value: "escalation", label: "Escalation on a live account" },
    { value: "strategic-exception", label: "Strategic / leadership-driven exception" },
    { value: "exploratory", label: "Exploratory / no active decision" },
  ];

  const engagementTypeOptions = isITeS ? [
    { value: "ites-tm", label: "Time & Materials (T&M)" },
    { value: "ites-fixed-price", label: "Fixed Price" },
    { value: "ites-managed-services", label: "Managed Services" },
    { value: "ites-retainer", label: "Retainer / Ongoing Support" },
    { value: "ites-outcome", label: "Outcome / Milestone-based" },
    { value: "ites-hybrid", label: "Hybrid" },
  ] : isMC ? [
    { value: "mc-fixed-fee", label: "Fixed Fee / Project-based" },
    { value: "mc-retainer", label: "Retainer / Advisory" },
    { value: "mc-tm", label: "Time & Materials" },
    { value: "mc-outcome", label: "Outcome / Success-based" },
    { value: "mc-hybrid", label: "Hybrid" },
  ] : isSW ? [
    { value: "sw-implementation", label: "Implementation / Professional Services" },
    { value: "sw-managed-services", label: "Managed Services" },
    { value: "sw-saas-services", label: "SaaS + Services Hybrid" },
    { value: "sw-fixed-price", label: "Fixed Price Development" },
    { value: "sw-tm", label: "T&M Development" },
    { value: "sw-outcome", label: "Outcome-based" },
  ] : [
    { value: "commission", label: "Commission" },
    { value: "fixed-fee", label: "Fixed Fees" },
    { value: "retainer", label: "Retainer" },
    { value: "outcome-based", label: "Outcome based" },
    { value: "hybrid-retainer-commission", label: "Hybrid - Retainer + Commission" },
    { value: "hybrid-retainer-outcome", label: "Hybrid - Retainer + Outcome based" },
  ];

  const executionThinkingOptions = [
    { value: "execution-heavy", label: "Execution-heavy" },
    { value: "balanced", label: "Balanced" },
    { value: "thinking-heavy", label: "Thinking-heavy" },
    ...(isITeS ? [{ value: "advisory-solutioning", label: "Advisory / Solutioning-heavy" }] : []),
    ...(isMC ? [{ value: "strategy-advisory", label: "Strategy / Advisory-heavy" }] : []),
    ...(isSW ? [{ value: "technical-implementation", label: "Technical / Implementation-heavy" }] : []),
  ];

  const scopeChangeContext = isSW
    ? "Scope changes without repricing are the most common source of margin leak. Including technical dependency changes outside your control."
    : "Scope changes without repricing are the most common source of margin leak.";

  const raw: Omit<Question, "number">[] = [
    { id: "fullName", title: "What's your full name?", type: "text", placeholder: "Enter your full name", required: true, section: "Contact & Context", sectionColor: "emerald" },
    { id: "workEmail", title: "What's your work email?", type: "email", placeholder: "Enter your work email", required: true, section: "Contact & Context", sectionColor: "emerald" },
    { id: "roleTitle", title: "What's your role or title?", type: "text", placeholder: "Enter your role or title", required: true, section: "Contact & Context", sectionColor: "emerald" },
    { id: "organisationName", title: "What's your organization name?", type: "text", placeholder: "Enter your organization name", required: true, section: "Contact & Context", sectionColor: "emerald" },
    {
      id: "organisationSize", title: "What's your organization size?",
      context: "Larger organizations create more coordination layers that consume margin.",
      type: "select",
      options: [{ value: "50-500", label: "50–500" }, { value: "500-1000", label: "500–1000" }, { value: "1000-1500", label: "1000–1500" }, { value: "1500-2000", label: "1500–2000" }],
      required: true, section: "Contact & Context", sectionColor: "emerald"
    },
    {
      id: "industry", title: "Which industry do you belong to?",
      type: "select",
      options: [
        { value: "marketing-advertising", label: "Marketing & Advertising" },
        { value: "ites", label: "ITeS" },
        { value: "management-consulting", label: "Management Consulting" },
        { value: "computer-software", label: "Computer Software" },
      ],
      required: true, section: "Contact & Context", sectionColor: "emerald"
    },
    {
      id: "decisionEvaluating", title: "What decision are you evaluating with this assessment?",
      context: "The type of decision shapes how much pricing flexibility remains.",
      type: "select", options: decisionOptions, required: true, section: "Contact & Context", sectionColor: "emerald"
    },
    {
      id: "specifyContext", title: "Specify Context",
      context: "Multi-client assessments carry compounding coordination risk.",
      type: "select",
      options: [{ value: "single-client", label: "Single client" }, { value: "group-of-clients", label: "Group of clients - Org level" }],
      required: true, section: "Client Engagement Context", sectionColor: "teal"
    },
    {
      id: "engagementClassification", title: "How would you classify this engagement today?",
      context: "Engagement maturity affects how predictable the delivery effort will be.",
      type: "select",
      options: [
        { value: "new", label: "New (pre-kickoff / onboarding phase)" },
        { value: "ongoing-less-6", label: "Ongoing (in delivery for less than 6 months)" },
        { value: "ongoing-6-12", label: "Ongoing (in delivery for 6–12 months)" },
        { value: "ongoing-12-plus", label: "Ongoing (in delivery for 12+ months)" },
        { value: "renewal-expansion", label: "Renewal / scope expansion of an existing engagement" }
      ],
      required: true, section: "Client Engagement Context", sectionColor: "teal"
    },
    {
      id: "engagementType", title: "What's the engagement type?",
      context: "Fixed-fee models absorb scope creep risk that retainers can pass through.",
      type: "select", options: engagementTypeOptions, required: true, section: "Client Engagement Context", sectionColor: "teal"
    },
    ...(hasDeliveryModel ? [{
      id: "deliveryModel" as keyof AssessmentFormData,
      title: "What is the delivery model?",
      context: "Onshore/offshore mix affects coordination overhead and margin risk.",
      type: "select" as const,
      options: [
        { value: "onshore-only", label: "Onshore only" },
        { value: "offshore-only", label: "Offshore only" },
        { value: "hybrid-onshore-offshore", label: "Hybrid onshore/offshore" },
        { value: "nearshore", label: "Nearshore" },
      ],
      required: true, section: "Client Engagement Context", sectionColor: "teal"
    }] : []),
    {
      id: "clientVolatility", title: "How would you rate client volatility?",
      context: "Client stability directly impacts coordination cost and rework risk.",
      type: "select",
      options: [
        { value: "low", label: "Low (stable stakeholders, clear expectations)" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High (frequent changes, multiple decision-makers)" }
      ],
      required: true, section: "Client Engagement Context", sectionColor: "teal"
    },
    {
      id: "stakeholderComplexity", title: "What's the stakeholder complexity level?",
      context: "More stakeholders mean more alignment cycles and hidden decision drag.",
      type: "select",
      options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }],
      required: true, section: "Client Engagement Context", sectionColor: "teal"
    },
    {
      id: "seniorLeadershipInvolvement", title: "How involved is senior leadership in day-to-day delivery?",
      context: "Senior involvement in delivery signals that junior/mid teams cannot carry the engagement independently.",
      type: "select",
      options: [
        { value: "minimal", label: "Minimal (strategic oversight only)" },
        { value: "periodic", label: "Periodic (key milestones)" },
        { value: "frequent", label: "Frequent (weekly touchpoints)" },
        { value: "continuous", label: "Continuous (hands-on delivery)" }
      ],
      required: true, section: "Planned Delivery Structure", sectionColor: "cyan"
    },
    {
      id: "midLevelOversight", title: "What's the mid-level oversight intensity?",
      context: "Mid-level oversight absorbs coordination costs that are often invisible in project budgets.",
      type: "select",
      options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }],
      required: true, section: "Planned Delivery Structure", sectionColor: "cyan"
    },
    {
      id: "executionThinkingMix", title: "What's the execution vs thinking mix?",
      context: "Thinking-heavy work is harder to scope, price, and delegate.",
      type: "select", options: executionThinkingOptions, required: true, section: "Planned Delivery Structure", sectionColor: "cyan"
    },
    {
      id: "iterationIntensity", title: "What's the expected or current iteration intensity?",
      context: "High iteration erodes margin through repeated cycles of rework and refinement.",
      type: "select",
      options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }],
      required: true, section: "Delivery Dynamics", sectionColor: "sky"
    },
    {
      id: "scopeChangeLikelihood", title: "What's the likelihood of scope change?",
      context: scopeChangeContext,
      type: "select",
      options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }],
      required: true, section: "Delivery Dynamics", sectionColor: "sky"
    },
    {
      id: "crossFunctionalCoordination", title: "How much cross-functional coordination is required?",
      context: "Cross-team coordination creates invisible overhead that rarely gets priced in.",
      type: "select",
      options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }],
      required: true, section: "Delivery Dynamics", sectionColor: "sky"
    },
    {
      id: "aiEffortShift", title: "Where is AI primarily expected to substitute effort?",
      context: "The layer where AI replaces human effort determines whether it reduces cost or increases oversight burden.",
      type: "select",
      options: [
        { value: "junior_execution", label: "Junior execution" },
        { value: "mid_level_production", label: "Mid-level production" },
        { value: "senior_thinking_review", label: "Senior thinking / review" },
        { value: "no_clear_substitution", label: "No clear substitution" }
      ],
      required: true, section: "Delivery Dynamics", sectionColor: "sky"
    },
    {
      id: "marginalValueSaturation", title: "Value Saturation",
      subtitle: "Compared to similar work, how much incremental value does adding more people create here?",
      context: "When adding people stops creating value, staffing becomes a cost center.",
      type: "select",
      options: [
        { value: "significant", label: "Significant additional value" },
        { value: "some", label: "Some additional value" },
        { value: "minimal", label: "Minimal additional value" },
        { value: "none", label: "No meaningful additional value" }
      ],
      required: true, section: "Value, Load & Confidence", sectionColor: "amber"
    },
    {
      id: "seniorOversightLoad", title: "Senior Oversight Load",
      subtitle: "Compared to similar engagements, how much senior oversight does this require?",
      context: "Disproportionate senior oversight signals structural delivery risk.",
      type: "select",
      options: [{ value: "less", label: "Less than usual" }, { value: "about_same", label: "About the same" }, { value: "more", label: "More than usual" }],
      required: true, section: "Value, Load & Confidence", sectionColor: "amber"
    },
    {
      id: "coordinationDecisionDrag", title: "Coordination & Decision Drag",
      subtitle: "How much coordination is required across teams and stakeholders?",
      context: "Heavy coordination slows decisions and inflates the cost of every deliverable.",
      type: "select",
      options: [{ value: "minimal", label: "Minimal" }, { value: "moderate", label: "Moderate" }, { value: "heavy", label: "Heavy" }],
      required: true, section: "Value, Load & Confidence", sectionColor: "amber"
    },
    {
      id: "deliveryConfidence", title: "Delivery Confidence",
      subtitle: "How confident are you in the delivery model for this engagement? (executive gut-check)",
      context: "Low confidence often signals structural issues that pricing alone cannot fix.",
      type: "select",
      options: [{ value: "high", label: "High confidence" }, { value: "some_concerns", label: "Some concerns" }, { value: "low", label: "Low confidence" }],
      required: true, section: "Value, Load & Confidence", sectionColor: "amber"
    },
    {
      id: "aiAgenticFramework", title: "Are you using AI or an Agentic framework and what kind of projects are they being deployed on?",
      context: "Agentic deployments in billable workflows directly affect pricing integrity and delivery accountability.",
      type: "select",
      options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "na", label: "NA" }],
      required: true, section: "AI Risk", sectionColor: "violet"
    },
    {
      id: "aiHumanHoursReplaced", title: "How many human hours will you replace / augment with an AI agent in delivery workflows?",
      context: "The scale of AI substitution determines whether cost savings flow to margin or create oversight overhead.",
      type: "select",
      options: [
        { value: "0-25", label: "0–25%" },
        { value: "25-50", label: "25–50%" },
        { value: "50-75", label: "50–75%" },
        { value: "75-100", label: "75–100%" },
        { value: "na", label: "NA" },
      ],
      required: true, section: "AI Risk", sectionColor: "violet"
    },
    {
      id: "aiCommercialImpactMeasured", title: "Have you measured the commercial impact of using AI agents?",
      context: "Unmeasured AI impact means you cannot price its contribution or account for its risks.",
      type: "select",
      options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "na", label: "NA" }],
      required: true, section: "AI Risk", sectionColor: "violet"
    },
    {
      id: "openSignal", title: "Is there anything about this client engagement that feels risky or unusual?",
      subtitle: "Share any concerns, gut-feel risks, or unusual factors — even if they don't fit neatly into a category",
      type: "textarea", placeholder: "Share any concerns or observations... (optional)",
      required: false, section: "Open Signal", sectionColor: "violet"
    },
  ];

  return raw.map((q, idx) => ({ ...q, number: idx + 1 }));
};

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(-2); // -2 = intro, -1 = margin question
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [decisionResult, setDecisionResult] = useState<any>(null);
  const [showDecisionPage, setShowDecisionPage] = useState(false);
  const [storedPdfData, setStoredPdfData] = useState<any>(null);
  const [submittedUserInfo, setSubmittedUserInfo] = useState<{fullName: string; workEmail: string; roleTitle: string; organisationName: string; organisationSize: string} | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [currentMargin, setCurrentMargin] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const shouldReduce = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const marginAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const isFromProfiler = searchString.includes("from=profiler");

  const [profilerAnswers, setProfilerAnswers] = useState<Record<string, string>>({});
  const [selectedIndustry, setSelectedIndustry] = useState("marketing-advertising");

  useEffect(() => {
    if (isFromProfiler) {
      try {
        const stored = localStorage.getItem(PROFILER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfilerAnswers(parsed);
          if (parsed._currentMargin) {
            setCurrentMargin(parsed._currentMargin);
          }
        }
      } catch (e) {
        console.error("Error loading profiler answers:", e);
      }
    }
  }, [isFromProfiler]);

  // Handle return from Stripe Checkout — verify payment and release PDFs
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const stripeSession = params.get("stripe_session");
    if (!stripeSession) return;

    setIsVerifyingPayment(true);

    fetch(`/api/checkout-complete?session_id=${stripeSession}`)
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          if (result.pdfs) {
            setStoredPdfData(result.pdfs);
            setTimeout(() => downloadPDF(result.pdfs.decisionMemo.filename, result.pdfs.decisionMemo.data), 300);
            setTimeout(() => downloadPDF(result.pdfs.assessmentOutput.filename, result.pdfs.assessmentOutput.data), 700);
          }
          // If we don't already have the decision result (e.g. page was refreshed), set it
          if (result.decisionObject) {
            setDecisionResult(result.decisionObject);
          }
          setIsPaid(true);
          setShowDecisionPage(true);
          try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
          toast({ title: "Payment confirmed", description: "Your PDFs are downloading and your report has been emailed to you." });
        } else {
          toast({ title: "Could not verify payment", description: result.message || "Please contact support.", variant: "destructive" });
        }
      })
      .catch(() => {
        toast({ title: "Verification error", description: "Could not confirm your payment. Please contact support.", variant: "destructive" });
      })
      .finally(() => {
        setIsVerifyingPayment(false);
        // Clean up URL params
        setLocation("/assessment");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle cancellation return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("payment_cancelled") === "true") {
      toast({ title: "Payment cancelled", description: "No charge was made. You can resubmit when ready.", variant: "destructive" });
      setLocation("/assessment");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const industryQuestions = getQuestionsForIndustry(selectedIndustry);
  const activeQuestions = isFromProfiler
    ? industryQuestions.filter(q => !PROFILER_FIELD_KEYS.includes(q.id)).map((q, idx) => ({ ...q, number: idx + 1 }))
    : industryQuestions;

  const saveProgress = () => {
    try {
      const values = form.getValues();
      const saveData = {
        data: values,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      toast({
        title: "Progress saved",
        description: "Your assessment progress has been saved. You can resume anytime.",
      });
    } catch (e) {
      console.error("Error saving progress:", e);
      toast({
        title: "Save failed",
        description: "Could not save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const totalQuestions = activeQuestions.length;
  const isIntro = currentQuestion === -2;
  const isMarginQuestion = currentQuestion === -1;
  const isReviewScreen = currentQuestion === totalQuestions;

  const getDefaultValues = useCallback(() => {
    return {
      fullName: "",
      workEmail: "",
      roleTitle: "",
      organisationName: "",
      organisationSize: "",
      industry: "",
      decisionEvaluating: "",
      engagementType: "",
      deliveryModel: "",
      specifyContext: "",
      engagementClassification: "",
      clientVolatility: "",
      stakeholderComplexity: "",
      seniorLeadershipInvolvement: "",
      midLevelOversight: "",
      executionThinkingMix: "",
      iterationIntensity: "",
      scopeChangeLikelihood: "",
      crossFunctionalCoordination: "",
      aiEffortShift: "",
      marginalValueSaturation: "",
      seniorOversightLoad: "",
      coordinationDecisionDrag: "",
      deliveryConfidence: "",
      aiHumanHoursReplaced: "",
      aiCommercialImpactMeasured: "",
      aiAgenticFramework: "",
      openSignal: "",
    };
  }, []);

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: getDefaultValues(),
  });

  const watchedIndustry = form.watch("industry");
  useEffect(() => {
    if (watchedIndustry && watchedIndustry !== selectedIndustry) {
      setSelectedIndustry(watchedIndustry);
      form.setValue("engagementType", "");
      form.setValue("deliveryModel", "");
      form.setValue("executionThinkingMix", "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedIndustry]);

  useEffect(() => {
    if (isFromProfiler && Object.keys(profilerAnswers).length > 0) {
      const currentValues = form.getValues();
      form.reset({ ...currentValues, ...profilerAnswers });
      toast({
        title: "Quick Profile Loaded",
        description: "7 inputs carried forward (6 risk questions + current margin). Complete the remaining questions.",
      });
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { data } = JSON.parse(saved);
        const hasAnyData = Object.values(data).some(v => v && v !== "");
        if (hasAnyData) {
          form.reset(data);
          toast({
            title: "Progress Restored",
            description: "Your previous answers have been loaded.",
          });
        }
      }
    } catch (e) {
      console.error("Error loading saved progress:", e);
    }
  }, [profilerAnswers]);

  const watchedValues = form.watch();

  useEffect(() => {
    const hasAnyData = Object.entries(watchedValues).some(
      ([key, value]) => value && value !== "" && key !== "openSignal"
    );
    if (hasAnyData) {
      try {
        const saveData = {
          data: watchedValues,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      } catch (e) {
        console.error("Error saving progress:", e);
      }
    }
  }, [watchedValues]);

  // Scroll to top and reset view on page load for mobile (including AMP and all mobile browsers)
  useEffect(() => {
    const scrollToTop = () => {
      // Method 1: Standard scrollTo
      window.scrollTo(0, 0);
      
      // Method 2: scrollTo with options (modern browsers)
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {
        // Fallback for older browsers
      }
      
      // Method 3: Direct property assignment (iOS Safari, older browsers)
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Method 4: Scroll container if it exists
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      
      // Method 5: Find and scroll any scrollable parent
      const scrollableParent = document.querySelector('[data-scroll-container]');
      if (scrollableParent) {
        scrollableParent.scrollTop = 0;
      }
    };
    
    // Execute immediately
    scrollToTop();
    
    // Execute after a frame (helps with some mobile browsers)
    requestAnimationFrame(scrollToTop);
    
    // Execute after a short delay (helps with AMP and slow-loading environments)
    const timer = setTimeout(scrollToTop, 100);
    
    // Ensure we start at intro (currentQuestion = -2)
    setCurrentQuestion(-2);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus text/email/textarea input fields after transition
  // Select/multiple-choice questions get NO auto-focus (prevents unwanted keyboard on mobile)
  useEffect(() => {
    if (currentQuestion >= 0 && currentQuestion < totalQuestions) {
      const question = activeQuestions[currentQuestion];
      if (question.type === "text" || question.type === "email" || question.type === "textarea") {
        const timer = setTimeout(() => {
          const input = document.querySelector(`input[name="${question.id}"], textarea[name="${question.id}"]`) as HTMLElement;
          if (input) {
            input.focus();
          }
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestion]);

  // Check if all mandatory questions are answered (openSignal is optional)
  const areMandatoryQuestionsAnswered = () => {
    const values = form.getValues();
    for (let i = 0; i < totalQuestions; i++) {
      const question = activeQuestions[i];
      if (question.id === "openSignal") continue; // optional
      const value = values[question.id as keyof typeof values];
      if (!value || value === "") {
        return false;
      }
    }
    return true;
  };

  // Check if current question is answered — openSignal is optional so always passes
  const isCurrentQuestionAnswered = () => {
    if (currentQuestion < 0 || currentQuestion >= totalQuestions) return true;
    const question = activeQuestions[currentQuestion];
    if (question.id === "openSignal") return true; // optional
    const values = form.getValues();
    const value = values[question.id as keyof typeof values];
    return value && value !== "";
  };

  // Wheel event for scroll-based navigation
  useEffect(() => {
    let lastScrollTime = 0;
    const scrollThrottle = 800; // Prevent rapid scrolling
    
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < scrollThrottle) return;
      if (isTransitioning || isSubmitting) return;
      if (isReviewScreen || showDecisionPage) return;

      lastScrollTime = now;
      if (e.deltaY > 50) {
        handleNext();
      } else if (e.deltaY < -50) {
        handleBack();
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentQuestion, isIntro, isMarginQuestion, currentMargin, isFromProfiler, isReviewScreen, isTransitioning, isSubmitting, totalQuestions, showDecisionPage]);

  // Touch swipe for mobile navigation
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning || isSubmitting || isReviewScreen || showDecisionPage) return;
      
      touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          handleNext();
        } else {
          handleBack();
        }
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentQuestion, isIntro, isMarginQuestion, currentMargin, isFromProfiler, isReviewScreen, isTransitioning, isSubmitting, totalQuestions, showDecisionPage]);

  const downloadPDF = (filename: string, base64Data: string) => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${base64Data}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = async (data: AssessmentFormData) => {
    setIsSubmitting(true);
    try {
      const marginValue = currentMargin ? parseFloat(currentMargin) : undefined;
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, currentMargin: marginValue, fromProfiler: isFromProfiler }),
      });

      if (response.ok) {
        const result = await response.json();

        // DEV/staging bypass — result returned directly without payment
        if (!result.requiresPayment && result.pdfs) {
          setStoredPdfData(result.pdfs);
          setDecisionResult(result.decisionObject);
          setIsPaid(true);
          setSubmittedUserInfo({
            fullName: data.fullName,
            workEmail: data.workEmail,
            roleTitle: data.roleTitle,
            organisationName: data.organisationName,
            organisationSize: data.organisationSize,
          });
          setShowDecisionPage(true);
          try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
          setTimeout(() => downloadPDF(result.pdfs.decisionMemo.filename, result.pdfs.decisionMemo.data), 300);
          setTimeout(() => downloadPDF(result.pdfs.assessmentOutput.filename, result.pdfs.assessmentOutput.data), 700);
          return;
        }

        // Show blurred decision page — payment required to unlock PDFs
        if (result.requiresPayment && result.checkoutUrl) {
          setCheckoutUrl(result.checkoutUrl);
          setDecisionResult(result.decisionObject);
          setIsPaid(false);
          setSubmittedUserInfo({
            fullName: data.fullName,
            workEmail: data.workEmail,
            roleTitle: data.roleTitle,
            organisationName: data.organisationName,
            organisationSize: data.organisationSize,
          });
          setShowDecisionPage(true);
          try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
          return;
        }
      } else {
        const error = await response.json();
        toast({
          title: "Submission Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to submit assessment:", error);
      toast({
        title: "Submission Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToQuestion = (index: number) => {
    if (isTransitioning) return;
    setDirection(index >= currentQuestion ? 1 : -1);
    setIsTransitioning(true);
    setCurrentQuestion(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleNext = () => {
    if (isIntro) {
      if (isFromProfiler) {
        scrollToQuestion(0);
      } else {
        scrollToQuestion(-1);
      }
      return;
    }

    if (isMarginQuestion) {
      scrollToQuestion(0);
      return;
    }
    
    // Must answer current question before advancing (except Q23 which is optional)
    if (!isCurrentQuestionAnswered()) {
      toast({
        title: "Please answer before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    // On last question (Q23), only allow going to review if Q1-Q22 are answered
    if (currentQuestion === totalQuestions - 1) {
      if (areMandatoryQuestionsAnswered()) {
        scrollToQuestion(currentQuestion + 1);
      }
      return;
    }
    
    if (currentQuestion < totalQuestions) {
      scrollToQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (isMarginQuestion) {
      scrollToQuestion(-2);
      return;
    }
    if (currentQuestion === 0) {
      if (isFromProfiler) {
        scrollToQuestion(-2);
      } else {
        scrollToQuestion(-1);
      }
      return;
    }
    if (currentQuestion > 0) {
      scrollToQuestion(currentQuestion - 1);
    }
  };

  const handleOptionSelect = (value: string) => {
    const question = activeQuestions[currentQuestion];
    form.setValue(question.id, value);
    setTimeout(() => handleNext(), 400);
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return;
      if (e.key === "Enter" && !e.shiftKey) {
        if (isIntro || isMarginQuestion) {
          e.preventDefault();
          handleNext();
          return;
        }
        if (currentQuestion >= 0 && currentQuestion < totalQuestions) {
          const question = activeQuestions[currentQuestion];
          const isLastQuestion = currentQuestion === totalQuestions - 1;
          if (question.type !== "textarea" || isLastQuestion) {
            if (!isCurrentQuestionAnswered()) {
              toast({
                title: "Please answer before proceeding.",
                variant: "destructive",
              });
              return;
            }
            if (isLastQuestion && !areMandatoryQuestionsAnswered()) {
              return;
            }
            e.preventDefault();
            handleNext();
          }
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleBack();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentQuestion, isIntro, isMarginQuestion, currentMargin, isFromProfiler, isTransitioning]);

  const calculateProgress = () => {
    if (isIntro) return 0;
    return Math.round(((currentQuestion + 1) / (totalQuestions + 1)) * 100);
  };

  const getSectionGradient = (color: string) => {
    const gradients: Record<string, string> = {
      emerald: "from-emerald-600 via-emerald-500 to-teal-500",
      teal: "from-teal-600 via-teal-500 to-cyan-500",
      cyan: "from-cyan-600 via-cyan-500 to-sky-500",
      sky: "from-sky-600 via-sky-500 to-blue-500",
      amber: "from-amber-600 via-amber-500 to-orange-500",
      violet: "from-violet-600 via-violet-500 to-purple-500",
    };
    return gradients[color] || gradients.emerald;
  };

  const renderCard = (questionIndex: number) => {
    const question = activeQuestions[questionIndex];
    const gradient = getSectionGradient(question.sectionColor);
    const currentValue = watchedValues[question.id] || "";

    return (
      <div className={`h-full bg-gradient-to-br ${gradient} flex flex-col overflow-y-auto`}>
        {/* Question content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-14 sm:pt-20 pb-20 sm:pb-20">
          <div className="w-full max-w-2xl">
              {/* Section & Question number */}
              <div className="mb-3 sm:mb-5">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  {question.section}
                </span>
                <div className="text-white/70 text-xs sm:text-base font-medium">
                  Question {question.number} of {totalQuestions}
                </div>
              </div>

              {/* Question title */}
              <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-2 sm:mb-3">
                {question.title}
              </h2>
              
              {question.subtitle && (
                <p className="text-sm sm:text-lg text-white/80 mb-2 sm:mb-3">
                  {question.subtitle}
                </p>
              )}

              {question.context && (
                <p className="text-xs sm:text-sm text-white/60 italic mb-3 sm:mb-5">
                  Why this matters: {question.context}
                </p>
              )}

              {/* Input area */}
              <div className="mt-3 sm:mt-6">
                <Form {...form}>
                  {question.type === "text" || question.type === "email" ? (
                    <FormField
                      control={form.control}
                      name={question.id}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type={question.type}
                              placeholder={question.placeholder}
                              key={`input-${question.id}-${questionIndex}`}
                              className="text-base sm:text-xl py-4 sm:py-6 px-4 sm:px-6 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:bg-white/20 rounded-xl"
                            />
                          </FormControl>
                          <FormMessage className="text-white/90 mt-2" />
                        </FormItem>
                      )}
                    />
                  ) : question.type === "textarea" ? (
                    <FormField
                      control={form.control}
                      name={question.id}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={question.placeholder}
                              key={`textarea-${question.id}-${questionIndex}`}
                              className="text-base sm:text-lg py-3 sm:py-4 px-4 sm:px-6 min-h-[120px] sm:min-h-[150px] bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:bg-white/20 rounded-xl"
                            />
                          </FormControl>
                          <FormMessage className="text-white/90 mt-2" />
                          {question.id === "openSignal" && (
                            <p className="mt-3 text-sm text-white/60 italic">
                              Press Enter or click <span className="font-semibold text-white/80">Review</span> to continue if you're leaving the box empty.
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2.5">
                      {question.options?.map((option, index) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleOptionSelect(option.value)}
                          className={`w-full text-left px-3 sm:px-5 py-2.5 sm:py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-2.5 sm:gap-4 group ${
                            currentValue === option.value
                              ? "bg-white text-gray-900 border-white shadow-lg scale-[1.02]"
                              : "bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                          }`}
                        >
                          <span className={`flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${
                            currentValue === option.value
                              ? "bg-emerald-500 text-white"
                              : "bg-white/20 text-white group-hover:bg-white/30"
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-sm sm:text-base font-medium flex-1 leading-snug">
                            {option.label}
                          </span>
                          {currentValue === option.value && (
                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </Form>
              </div>

          </div>
        </div>
      </div>
    );
  };

  const renderMarginQuestion = () => {
    if (isFromProfiler) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-16 sm:pt-20 pb-28 sm:pb-20">
          <div className="w-full max-w-2xl">
            <div className="mb-4 sm:mb-6">
              <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                Margin Qualifier
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 sm:mb-3">
              What's the current margin of the project/client/group of clients you are evaluating?
            </h2>

            <p className="text-sm sm:text-base text-white/50 italic mb-3 sm:mb-4">
              Indicative required, if not actual
            </p>

            <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-8">
              Enter your margin % to see estimated impact on your results
            </p>

            <div className="w-full max-w-md mx-auto">
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={currentMargin}
                  onChange={(e) => {
                    setCurrentMargin(e.target.value);
                    if (marginAdvanceTimer.current) clearTimeout(marginAdvanceTimer.current);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0 && val <= 100) {
                      marginAdvanceTimer.current = setTimeout(() => handleNext(), 800);
                    }
                  }}
                  placeholder="e.g. 18"
                  autoFocus
                  className="text-center text-2xl sm:text-3xl py-5 sm:py-6 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/40 focus:border-white focus:bg-white/20 rounded-xl pr-14"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/60 text-2xl font-medium">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIntro = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto text-center text-white">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4">Margin Risk Assessment</h1>
            <p className="text-base sm:text-xl md:text-2xl text-emerald-100 mb-4 sm:mb-8 italic" style={{ fontFamily: 'Georgia, serif' }}>
              Margin Risk Clarity
            </p>
            
            <p className="text-sm sm:text-base md:text-lg text-emerald-50 mb-6 sm:mb-10 leading-relaxed max-w-xl mx-auto px-2">
              {isFromProfiler
                ? "Your Quick Risk Profile answers have been carried over. Complete the remaining questions for full Decision Clarity with a detailed Margin Risk Decision Memo."
                : "You're about to assess margin risk before it gets priced into a decision. This assessment helps leaders evaluate whether a client engagement is priced in line with its true delivery complexity."}
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-6 mb-6 sm:mb-8 text-emerald-100 text-xs sm:text-base">
              <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{totalQuestions} questions</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>~5 minutes</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>GDPR & CCPA compliant</span>
              </div>
            </div>

            <Button
              onClick={handleNext}
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-6 sm:px-12 py-4 sm:py-7 text-base sm:text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              Click / Enter / Return to continue
              <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-6 sm:w-6" />
            </Button>

            <p className="mt-4 text-sm sm:text-base text-emerald-100 font-medium">
              Assessments are at an introductory price of $89
            </p>
            
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-emerald-200/80 px-4">
              No financial data, timesheets, or individual performance information is required.
            </p>
          </div>
          
        </div>
    );
  };

  const renderReview = () => {
    return (
      <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Review Your Answers</h2>
            <p className="text-gray-400 mb-8">Click any answer to edit it.</p>
            
            <div className="space-y-3 mb-8">
              {activeQuestions.map((question, index) => {
                const value = watchedValues[question.id];
                const displayValue = question.options?.find(o => o.value === value)?.label || value || "Not answered";
                const gradient = getSectionGradient(question.sectionColor);
                
                return (
                  <button
                    key={question.id}
                    onClick={() => scrollToQuestion(index)}
                    className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="text-sm text-gray-500">
                          Q{question.number}. {question.title}
                        </span>
                        <p className={`mt-1 font-medium bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                          {displayValue}
                        </p>
                      </div>
                      <ArrowUp className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* GDPR Consent */}
            <div className="flex items-start gap-3 p-5 bg-white/5 rounded-xl border border-white/10 mb-6">
              <input
                type="checkbox"
                id="consent"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 h-5 w-5 text-emerald-500 border-gray-600 rounded focus:ring-emerald-500 bg-transparent"
              />
              <label htmlFor="consent" className="text-sm text-gray-300 cursor-pointer leading-relaxed">
                I consent to MarginMix processing my professional and company information to deliver this assessment and related communications, in accordance with GDPR and CCPA.
              </label>
            </div>
            
            {/* Submit button */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-7 text-lg shadow-lg rounded-xl"
                  disabled={isSubmitting || !consentChecked}
                >
                  {isSubmitting ? (
                    "Processing…"
                  ) : (
                    <>
                      Submit to Proceed
                      <Send className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            <p className="text-sm text-gray-500 text-center mt-4">
              Your margin risk assessment & decision memo will be delivered to your email & a copy of the files will be auto downloaded on this device.
            </p>
          </div>
          
          <Footer />
        </div>
    );
  };

  const renderDecisionPage = () => {
    if (!showDecisionPage || !decisionResult) return null;
    
    const d = decisionResult;
    const verdictColorMap: Record<string, string> = {
      "Structurally Safe": "text-emerald-400",
      "Price Sensitive": "text-amber-400",
      "Execution Heavy": "text-amber-400",
      "Structurally Fragile": "text-red-400",
      "Do Not Proceed Without Repricing": "text-red-500",
    };
    const verdictBgMap: Record<string, string> = {
      "Structurally Safe": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
      "Price Sensitive": "from-amber-500/20 to-amber-600/10 border-amber-500/30",
      "Execution Heavy": "from-amber-500/20 to-orange-600/10 border-amber-500/30",
      "Structurally Fragile": "from-red-500/20 to-red-600/10 border-red-500/30",
      "Do Not Proceed Without Repricing": "from-red-600/20 to-red-700/10 border-red-600/30",
    };
    const riskBandColor: Record<string, string> = {
      Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      Moderate: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      High: "bg-red-500/20 text-red-400 border-red-500/30",
      "Very High": "bg-red-600/20 text-red-500 border-red-600/30",
    };
    
    const getDimensionColor = (level: string) => {
      if (level === "high" || level === "negative") return "text-red-400 bg-red-500/20 border-red-500/30";
      if (level === "medium" || level === "neutral") return "text-amber-400 bg-amber-500/20 border-amber-500/30";
      return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
    };
    
    const getDimensionLabel = (level: string) => {
      if (level === "positive") return "Positive";
      if (level === "negative") return "Negative";
      if (level === "neutral") return "Neutral";
      return level.charAt(0).toUpperCase() + level.slice(1);
    };

    const getBucketBarColor = (score: number) => {
      if (score >= 60) return "bg-red-500";
      if (score >= 40) return "bg-amber-400";
      return "bg-emerald-500";
    };

    const recommendations = getVerdictRecommendations(d.marginRiskVerdict);

    const handleRedownload = () => {
      if (storedPdfData) {
        setTimeout(() => downloadPDF(storedPdfData.decisionMemo.filename, storedPdfData.decisionMemo.data), 100);
        setTimeout(() => downloadPDF(storedPdfData.assessmentOutput.filename, storedPdfData.assessmentOutput.data), 500);
        toast({ title: "PDFs Downloading", description: "Your assessment files are being downloaded." });
      }
    };

    const dimensionCards = [
      { name: "Workforce Intensity", level: d.dimensions?.workforceIntensity, icon: Users },
      { name: "Coordination Entropy", level: d.dimensions?.coordinationEntropy, icon: Zap },
      { name: "Commercial Exposure", level: d.dimensions?.commercialExposure, icon: TrendingUp },
      { name: "Volatility Control", level: d.dimensions?.volatilityControl, icon: AlertTriangle },
      { name: "Confidence Signal", level: d.dimensions?.confidenceSignal, icon: Shield },
      { name: "Measurement Maturity", level: d.dimensions?.measurementMaturity, icon: BarChart3 },
    ];

    return (
      <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-16 sm:py-20 px-4 sm:px-6">

            {/* Section 1 - Verdict Banner */}
            <div className={`rounded-2xl border bg-gradient-to-br ${verdictBgMap[d.marginRiskVerdict] || verdictBgMap["Structurally Safe"]} p-6 sm:p-8 mb-6`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${verdictColorMap[d.marginRiskVerdict] || "text-white"}`}>
                  {d.marginRiskVerdict}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${riskBandColor[d.riskBand] || riskBandColor["Moderate"]}`}>
                  {d.riskBand} Risk
                </span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
                {d.verdictReason}
              </p>
              <div className={`flex items-center gap-4 ${!isPaid ? "blur-sm select-none" : ""}`}>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Composite Risk Score</span>
                    <span className="font-mono font-bold text-white">{d.compositeRiskScore}/100</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        d.compositeRiskScore >= 60 ? "bg-red-500" : d.compositeRiskScore >= 35 ? "bg-amber-400" : "bg-emerald-500"
                      }`}
                      style={{ width: `${d.compositeRiskScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pay-gate: everything below the verdict banner */}
            <div className="relative">
              {/* Blur overlay when not paid */}
              {!isPaid && (
                <div className="absolute inset-0 z-20 flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-4">
                  <div className="text-center bg-gray-900/95 backdrop-blur-sm rounded-2xl p-5 sm:p-8 border border-white/20 shadow-2xl max-w-sm w-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                    </div>
                    <h3 className="text-base sm:text-xl font-bold text-white mb-2">Your Full Margin Risk Report</h3>
                    <p className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
                      Pay $89 to access the complete risk breakdown, effort allocation, structural signals, and download your Decision Memo &amp; Assessment PDFs.
                    </p>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-4 sm:py-6 rounded-xl text-sm sm:text-base font-semibold shadow-lg flex flex-col h-auto gap-1 px-3"
                      onClick={() => checkoutUrl && (window.location.href = checkoutUrl)}
                    >
                      <span className="leading-snug">Pay $89 — Unlock Full Report &amp; PDFs</span>
                      <span className="text-xs text-emerald-100 font-normal leading-snug">Decision Memo + Assessment Results included</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Content — blurred until paid */}
              <div className={!isPaid ? "blur-md select-none pointer-events-none" : ""}>

            {/* Margin Impact Section */}
            {d.marginImpact && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  Estimated Margin Impact
                </h2>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Current Margin</p>
                    <p className="text-xl sm:text-3xl font-bold text-white">{d.marginImpact.currentMargin}%</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Estimated Margin Erosion</p>
                    <p className={`text-xl sm:text-3xl font-bold ${
                      d.marginImpact.impactColor === "emerald" ? "text-emerald-400" : 
                      d.marginImpact.impactColor === "amber" ? "text-amber-400" : "text-red-400"
                    }`}>
                      {d.marginImpact.estimatedLoss > 0 ? `-${d.marginImpact.estimatedLoss}%` : "0%"}
                    </p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-500 mb-1">Effective Margin</p>
                    <p className={`text-xl sm:text-3xl font-bold ${
                      d.marginImpact.effectiveMargin >= d.marginImpact.currentMargin * 0.7 ? "text-emerald-400" : 
                      d.marginImpact.effectiveMargin >= d.marginImpact.currentMargin * 0.5 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {d.marginImpact.effectiveMargin}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full bg-white/20 rounded-full"
                        style={{ width: `${Math.min(d.marginImpact.currentMargin, 100)}%` }}
                      />
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
                          d.marginImpact.impactColor === "emerald" ? "bg-emerald-500" : 
                          d.marginImpact.impactColor === "amber" ? "bg-amber-400" : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(d.marginImpact.effectiveMargin, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    d.marginImpact.impactColor === "emerald" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                    d.marginImpact.impactColor === "amber" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                    "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {d.marginImpact.impactLabel}
                  </span>
                </div>
              </div>
            )}

            {/* Assessment Context */}
            {submittedUserInfo && (
              <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" />
                  Basic Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="text-sm text-white font-medium">{submittedUserInfo.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-white font-medium">{submittedUserInfo.workEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Role / Title</p>
                      <p className="text-sm text-white font-medium">{submittedUserInfo.roleTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Organisation</p>
                      <p className="text-sm text-white font-medium">{submittedUserInfo.organisationName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Organisation Size</p>
                      <p className="text-sm text-white font-medium">{submittedUserInfo.organisationSize} employees</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2 - Risk Dimension Summary */}
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-400" />
                Risk Dimensions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {dimensionCards.map((dim) => {
                  const Icon = dim.icon;
                  return (
                    <div key={dim.name} className={`rounded-xl border p-3 sm:p-4 ${getDimensionColor(dim.level || "low")}`}>
                      <Icon className="h-4 w-4 mb-2 opacity-80" />
                      <p className="text-xs text-gray-400 mb-1">{dim.name}</p>
                      <p className="text-sm font-semibold">{getDimensionLabel(dim.level || "low")}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3 - Bucket Scores */}
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Bucket Scores
              </h2>
              <div className="space-y-4">
                {(["WI", "SI", "CO", "VSI", "CE"] as const).map((key) => {
                  const score = d.bucketScores?.[key] ?? 0;
                  const band = d.bucketBands?.[key] ?? "";
                  return (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-300">{bucketLabels[key]}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{band}</span>
                          <span className="text-sm font-mono font-bold text-white">{score}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${getBucketBarColor(score)}`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4 - Effort Allocation */}
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-400" />
                Effort Allocation
              </h2>
              <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-gray-300 mb-4">
                {d.effortBand}
              </span>
              <div className="space-y-3">
                {[
                  { label: "Senior", value: d.effortPercentages?.senior, detail: d.effortAllocation?.senior },
                  { label: "Mid-Level", value: d.effortPercentages?.mid, detail: d.effortAllocation?.mid },
                  { label: "Junior / Execution", value: d.effortPercentages?.junior, detail: d.effortAllocation?.execution },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-300">{item.label}</span>
                      <span className="text-sm font-mono font-bold text-white">{item.value}</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-700" style={{ width: item.value || "0%" }} />
                    </div>
                    {item.detail != null && (
                      <p className="text-xs text-gray-500 mt-0.5">Allocation: {item.detail}%</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5 - Primary Risk Drivers */}
            {d.dominantDrivers && d.dominantDrivers.length > 0 && (
              <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Primary Risk Drivers
                </h2>
                <div className="flex flex-wrap gap-2">
                  {d.dominantDrivers.map((driver: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <ChevronRight className="h-3 w-3" />
                      {driver}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6 - Structural Risk Signals */}
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                Structural Risk Signals
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Value Saturation Present", value: d.saturationDetails?.valueSaturationPresent },
                  { label: "Optics-Driven Staffing", value: d.saturationDetails?.opticsDrivenStaffing },
                  { label: "Upward Cost Shift", value: d.saturationDetails?.upwardCostShift },
                ].map((flag) => (
                  <div key={flag.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${flag.value ? "bg-red-500" : "bg-emerald-500"}`} />
                    <span className="text-sm text-gray-300">{flag.label}</span>
                    <span className={`ml-auto text-xs font-medium ${flag.value ? "text-red-400" : "text-emerald-400"}`}>
                      {flag.value ? "Yes" : "No"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">Risk Source</p>
                  <p className="text-sm font-medium text-white">{d.riskSource}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">Correctability</p>
                  <p className="text-sm font-medium text-white">{d.correctability}</p>
                </div>
              </div>
            </div>

            {/* Section 7 - AI Effort Shift */}
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-cyan-400" />
                AI Effort Shift
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">AI Substitution Layer</p>
                  <p className="text-sm font-medium text-white">{d.aiEffortShiftLabel || "Not specified"}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">Risk Marker</p>
                  <p className={`text-sm font-medium ${
                    d.aiImpactClassification === "Accretive" ? "text-emerald-400" :
                    d.aiImpactClassification === "Neutral" ? "text-amber-400" :
                    "text-red-400"
                  }`}>{d.aiImpactClassification}</p>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Implication</p>
                <p className="text-sm text-gray-300">{
                  d.aiImpactClassification === "Accretive" ? "AI is substituting junior execution — real cost reduction with minimal oversight overhead." :
                  d.aiImpactClassification === "Neutral" ? "AI is substituting mid-level production — efficiency gains possible but requires monitoring." :
                  d.aiImpactClassification === "Fragile" ? "AI is substituting senior thinking/review — increased oversight cost may offset gains." :
                  "No clear AI substitution identified — risk of unmeasured effort displacement."
                }</p>
              </div>
            </div>

            {/* Section 8 - Contradiction Flags */}
            {d.contradictionFlags && d.contradictionFlags.length > 0 && (
              <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                  Contradiction Flags
                </h2>
                <div className="space-y-2">
                  {d.contradictionFlags.map((flag: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${flag.severity === "warning" ? "bg-amber-500/10 border border-amber-500/20" : "bg-blue-500/10 border border-blue-500/20"}`}>
                      {flag.severity === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm text-gray-200">{flag.description}</p>
                        <span className={`text-xs ${flag.severity === "warning" ? "text-amber-400" : "text-blue-400"}`}>
                          {flag.severity === "warning" ? "Warning" : "Info"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 8 - Actionable Recommendations */}
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Actionable Recommendations
              </h2>
              <div className="space-y-2">
                {recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 9 - CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 pb-8">
              {storedPdfData && (
                <Button
                  onClick={handleRedownload}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 text-base shadow-lg rounded-xl flex-1"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download PDFs Again
                </Button>
              )}
              <Link href="/" className="flex-1">
                <Button
                  className="w-full border border-white/20 bg-transparent text-white hover:bg-white/10 py-6 text-base rounded-xl"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Return to Home
                </Button>
              </Link>
            </div>

              </div>{/* end blurred content */}
            </div>{/* end pay-gate relative wrapper */}

          </div>
          <Footer />
        </div>
    );
  };

  if (isVerifyingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Confirming your payment…</h2>
          <p className="text-white/70 text-base max-w-sm mx-auto">
            Please wait while we verify your payment and prepare your assessment results.
          </p>
        </div>
      </div>
    );
  }

  const activePhaseKey = isIntro
    ? "intro"
    : showDecisionPage
    ? "decision"
    : isReviewScreen
    ? "review"
    : isMarginQuestion && !isFromProfiler
    ? "margin"
    : `q-${currentQuestion}`;

  const questionVariants = {
    enter: (dir: number) => ({
      x: shouldReduce ? 0 : dir > 0 ? "80%" : "-80%",
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: shouldReduce ? 0 : dir > 0 ? "-80%" : "80%",
      opacity: 0,
    }),
  };

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden bg-emerald-600">
      {shouldReduce ? (
        <div className="absolute inset-0">
          {isIntro && renderIntro()}
          {!isIntro && showDecisionPage && decisionResult && renderDecisionPage()}
          {!isIntro && !showDecisionPage && isReviewScreen && renderReview()}
          {!isIntro && !showDecisionPage && !isReviewScreen && isMarginQuestion && !isFromProfiler && renderMarginQuestion()}
          {!isIntro && !showDecisionPage && !isReviewScreen && !isMarginQuestion && renderCard(currentQuestion)}
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activePhaseKey}
            custom={direction}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {isIntro && renderIntro()}
            {!isIntro && showDecisionPage && decisionResult && renderDecisionPage()}
            {!isIntro && !showDecisionPage && isReviewScreen && renderReview()}
            {!isIntro && !showDecisionPage && !isReviewScreen && isMarginQuestion && !isFromProfiler && renderMarginQuestion()}
            {!isIntro && !showDecisionPage && !isReviewScreen && !isMarginQuestion && renderCard(currentQuestion)}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Fixed header with progress - rendered after content to be on top */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-black/40 backdrop-blur-md" style={{ pointerEvents: 'auto' }}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:text-emerald-200 hover:bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="font-bold hidden sm:inline">MarginMix</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isIntro && !showDecisionPage && (
              <>
                <span className="text-xs sm:text-sm text-white/80 font-medium">
                  {isReviewScreen ? "Review" : isMarginQuestion ? "Margin" : `${currentQuestion + 1}/${totalQuestions}`}
                </span>
                <div className="w-16 sm:w-24 md:w-32">
                  <Progress value={calculateProgress()} className="h-1.5 bg-white/20" />
                </div>
                <Button 
                  variant="ghost" 
                  onClick={saveProgress}
                  className="text-white hover:text-emerald-200 hover:bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <Save className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                <Link href="/">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-emerald-200 hover:bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    <Home className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Home</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
        
      </div>

      {/* Vertical heatmap - fixed on right side */}
      {!isIntro && !isReviewScreen && !showDecisionPage && currentQuestion >= 0 && (
        <div className="fixed right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-[90] flex flex-col items-center gap-[2px] sm:gap-1 bg-black/30 backdrop-blur-sm rounded-full py-2 sm:py-4 px-1 sm:px-2 border border-white/10 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto scrollbar-hide" style={{ pointerEvents: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {activeQuestions.map((q, idx) => {
            const value = watchedValues[q.id] || "";
            const isAnswered = value !== "";
            const isCurrent = currentQuestion === idx;
            const isNeutral = neutralFields.includes(q.id);
            const riskMapping = questionRiskMapping[q.id];
            const risk = riskMapping && value ? riskMapping[value] : null;

            let cellColor = "bg-white/15 border-white/10";
            if (isAnswered) {
              if (isNeutral || !risk) {
                cellColor = "bg-white/50 border-white/30";
              } else if (risk === "low") {
                cellColor = "bg-emerald-500 border-emerald-400";
              } else if (risk === "medium") {
                cellColor = "bg-amber-400 border-amber-300";
              } else {
                cellColor = "bg-red-500 border-red-400";
              }
            }

            return (
              <button
                key={q.id}
                onClick={() => scrollToQuestion(idx)}
                className={`flex-shrink-0 rounded-full border transition-all duration-300 ${cellColor} ${
                  isCurrent
                    ? "w-3 h-3 sm:w-4 sm:h-4 ring-2 ring-white shadow-lg shadow-white/30"
                    : "w-2 h-2 sm:w-3 sm:h-3"
                } ${!isAnswered && !isCurrent ? "opacity-40" : "opacity-100"}`}
                title={`Q${q.number}: ${q.title}`}
              />
            );
          })}
        </div>
      )}

      {/* Margin question navigation - outside AnimatePresence */}
      {isMarginQuestion && !isFromProfiler && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 bg-black/30 backdrop-blur-md border-t border-white/10" style={{ pointerEvents: 'auto' }}>
          <motion.button
            onClick={handleBack}
            whileHover={shouldReduce ? {} : { scale: 1.06 }}
            whileTap={shouldReduce ? {} : { scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Back</span>
          </motion.button>
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.button
              onClick={handleNext}
              whileHover={shouldReduce ? {} : { scale: 1.04 }}
              whileTap={shouldReduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-emerald-700 rounded-full font-semibold hover:bg-emerald-50 transition-all text-sm sm:text-base shadow-lg"
            >
              Continue
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Navigation buttons - rendered after content to be on top */}
      {!isIntro && !isMarginQuestion && !isReviewScreen && !showDecisionPage && (
        <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-8" style={{ pointerEvents: 'auto' }}>
          <motion.div
            whileHover={shouldReduce ? {} : { scale: 1.04 }}
            whileTap={shouldReduce ? {} : { scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentQuestion <= 0}
              className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
              Back
            </Button>
          </motion.div>
          <motion.div
            whileHover={shouldReduce ? {} : { scale: 1.04 }}
            whileTap={shouldReduce ? {} : { scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              onClick={handleNext}
              className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              {currentQuestion === totalQuestions - 1 ? "Review" : "Continue"}
              <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      )}

      {/* Generating Dialog */}
      <Dialog open={isSubmitting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-center text-emerald-600">
              Your Margin Assessment is being prepared.
            </DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-gray-600">Give us a minute - Please stay on this page.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

    </div>
  );
}
