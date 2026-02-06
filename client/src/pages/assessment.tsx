import { useState, useEffect, useCallback, useRef } from "react";
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
import { Link, useSearch } from "wouter";
import { ArrowDown, ArrowUp, ArrowLeft, Send, Check, ChevronDown, Save, Home, Shield, ShieldCheck, ShieldAlert, AlertTriangle, TrendingUp, BarChart3, Users, Zap, Target, AlertCircle, Info, Download, ChevronRight, Mail, Building2, Briefcase } from "lucide-react";
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
  "deliveryConfidence",
];

const questionRiskMapping: Record<string, Record<string, "low" | "medium" | "high">> = {
  organisationSize: { "200-500": "low", "500-1000": "low", "1000-1500": "medium", "1500-2000": "high" },
  decisionEvaluating: { "new-client-win": "low", "renewal-extension": "low", "scope-expansion": "high", "escalation": "high", "strategic-exception": "medium", "exploratory": "low" },
  specifyContext: { "single-client": "low", "group-of-clients": "medium" },
  engagementClassification: { "new": "medium", "ongoing-less-6": "medium", "ongoing-6-12": "low", "ongoing-12-plus": "low", "renewal-expansion": "medium" },
  engagementType: { "fixed-fee": "high", "retainer": "low", "hybrid": "medium" },
  clientVolatility: { "low": "low", "medium": "medium", "high": "high" },
  stakeholderComplexity: { "low": "low", "medium": "medium", "high": "high" },
  seniorLeadershipInvolvement: { "minimal": "low", "periodic": "medium", "frequent": "high", "continuous": "high" },
  midLevelOversight: { "low": "low", "medium": "medium", "high": "high" },
  executionThinkingMix: { "execution-heavy": "low", "balanced": "medium", "thinking-heavy": "high" },
  iterationIntensity: { "low": "low", "medium": "medium", "high": "high" },
  scopeChangeLikelihood: { "low": "low", "medium": "medium", "high": "high" },
  crossFunctionalCoordination: { "low": "low", "medium": "medium", "high": "high" },
  aiImpactMeasurement: { "yes": "low", "no": "medium", "not_applicable": "low" },
  marginalValueSaturation: { "significant": "low", "some": "medium", "minimal": "high", "none": "high" },
  seniorOversightLoad: { "less": "low", "about_same": "medium", "more": "high" },
  coordinationDecisionDrag: { "minimal": "low", "moderate": "medium", "heavy": "high" },
  deliveryConfidence: { "high": "low", "some_concerns": "medium", "low": "high" },
};

function getHeatmapColor(risk: "low" | "medium" | "high"): string {
  if (risk === "high") return "bg-red-500";
  if (risk === "medium") return "bg-amber-400";
  return "bg-emerald-500";
}

const neutralFields = ["fullName", "workEmail", "roleTitle", "organisationName", "openSignal"];

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
  decisionEvaluating: z.string().min(1, "Please select what decision you are evaluating"),
  engagementType: z.string().min(1, "Please select engagement type"),
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
  aiImpactMeasurement: z.string().min(1, "Please select AI impact measurement status"),
  marginalValueSaturation: z.string().min(1, "Please select marginal value saturation"),
  seniorOversightLoad: z.string().min(1, "Please select senior oversight load"),
  coordinationDecisionDrag: z.string().min(1, "Please select coordination level"),
  deliveryConfidence: z.string().min(1, "Please select delivery confidence"),
  openSignal: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface Question {
  id: keyof AssessmentFormData;
  number: number;
  title: string;
  subtitle?: string;
  type: "text" | "email" | "select" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required: boolean;
  section: string;
  sectionColor: string;
}

const questions: Question[] = [
  {
    id: "fullName",
    number: 1,
    title: "What's your full name?",
    type: "text",
    placeholder: "Enter your full name",
    required: true,
    section: "Contact & Context",
    sectionColor: "emerald"
  },
  {
    id: "workEmail",
    number: 2,
    title: "What's your work email?",
    type: "email",
    placeholder: "Enter your work email",
    required: true,
    section: "Contact & Context",
    sectionColor: "emerald"
  },
  {
    id: "roleTitle",
    number: 3,
    title: "What's your role or title?",
    type: "text",
    placeholder: "Enter your role or title",
    required: true,
    section: "Contact & Context",
    sectionColor: "emerald"
  },
  {
    id: "organisationName",
    number: 4,
    title: "What's your organization name?",
    type: "text",
    placeholder: "Enter your organization name",
    required: true,
    section: "Contact & Context",
    sectionColor: "emerald"
  },
  {
    id: "organisationSize",
    number: 5,
    title: "What's your organization size?",
    type: "select",
    options: [
      { value: "200-500", label: "200–500" },
      { value: "500-1000", label: "500–1,000" },
      { value: "1000-1500", label: "1,000–1,500" },
      { value: "1500-2000", label: "1,500–2,000" }
    ],
    required: true,
    section: "Contact & Context",
    sectionColor: "emerald"
  },
  {
    id: "decisionEvaluating",
    number: 6,
    title: "What decision are you evaluating with this assessment?",
    type: "select",
    options: [
      { value: "new-client-win", label: "New client win / pitch acceptance" },
      { value: "renewal-extension", label: "Renewal / contract extension" },
      { value: "scope-expansion", label: "Scope expansion without repricing" },
      { value: "escalation", label: "Escalation on a live account" },
      { value: "strategic-exception", label: "Strategic / leadership-driven exception" },
      { value: "exploratory", label: "Exploratory / no active decision" }
    ],
    required: true,
    section: "Contact & Context",
    sectionColor: "emerald"
  },
  {
    id: "specifyContext",
    number: 7,
    title: "Specify Context",
    type: "select",
    options: [
      { value: "single-client", label: "Single client" },
      { value: "group-of-clients", label: "Group of clients - Org level" }
    ],
    required: true,
    section: "Client Engagement Context",
    sectionColor: "teal"
  },
  {
    id: "engagementClassification",
    number: 8,
    title: "How would you classify this engagement today?",
    type: "select",
    options: [
      { value: "new", label: "New (pre-kickoff / onboarding phase)" },
      { value: "ongoing-less-6", label: "Ongoing (in delivery for less than 6 months)" },
      { value: "ongoing-6-12", label: "Ongoing (in delivery for 6–12 months)" },
      { value: "ongoing-12-plus", label: "Ongoing (in delivery for 12+ months)" },
      { value: "renewal-expansion", label: "Renewal / scope expansion of an existing engagement" }
    ],
    required: true,
    section: "Client Engagement Context",
    sectionColor: "teal"
  },
  {
    id: "engagementType",
    number: 9,
    title: "What's the engagement type?",
    type: "select",
    options: [
      { value: "fixed-fee", label: "Fixed fee" },
      { value: "retainer", label: "Retainer" },
      { value: "hybrid", label: "Hybrid" }
    ],
    required: true,
    section: "Client Engagement Context",
    sectionColor: "teal"
  },
  {
    id: "clientVolatility",
    number: 10,
    title: "How would you rate client volatility?",
    type: "select",
    options: [
      { value: "low", label: "Low (stable stakeholders, clear expectations)" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High (frequent changes, multiple decision-makers)" }
    ],
    required: true,
    section: "Client Engagement Context",
    sectionColor: "teal"
  },
  {
    id: "stakeholderComplexity",
    number: 11,
    title: "What's the stakeholder complexity level?",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ],
    required: true,
    section: "Client Engagement Context",
    sectionColor: "teal"
  },
  {
    id: "seniorLeadershipInvolvement",
    number: 12,
    title: "What's the planned senior leadership involvement?",
    type: "select",
    options: [
      { value: "minimal", label: "Minimal (oversight only)" },
      { value: "periodic", label: "Periodic (key moments)" },
      { value: "frequent", label: "Frequent (ongoing)" },
      { value: "continuous", label: "Continuous (embedded)" }
    ],
    required: true,
    section: "Planned Delivery Structure",
    sectionColor: "cyan"
  },
  {
    id: "midLevelOversight",
    number: 13,
    title: "What's the mid-level oversight intensity?",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ],
    required: true,
    section: "Planned Delivery Structure",
    sectionColor: "cyan"
  },
  {
    id: "executionThinkingMix",
    number: 14,
    title: "What's the execution vs thinking mix?",
    type: "select",
    options: [
      { value: "execution-heavy", label: "Execution-heavy" },
      { value: "balanced", label: "Balanced" },
      { value: "thinking-heavy", label: "Thinking-heavy" }
    ],
    required: true,
    section: "Planned Delivery Structure",
    sectionColor: "cyan"
  },
  {
    id: "iterationIntensity",
    number: 15,
    title: "What's the expected iteration intensity?",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ],
    required: true,
    section: "Delivery Dynamics",
    sectionColor: "sky"
  },
  {
    id: "scopeChangeLikelihood",
    number: 16,
    title: "What's the likelihood of scope change?",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ],
    required: true,
    section: "Delivery Dynamics",
    sectionColor: "sky"
  },
  {
    id: "crossFunctionalCoordination",
    number: 17,
    title: "How much cross-functional coordination is required?",
    type: "select",
    options: [
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" }
    ],
    required: true,
    section: "Delivery Dynamics",
    sectionColor: "sky"
  },
  {
    id: "aiImpactMeasurement",
    number: 18,
    title: "Are you measuring the impact of AI in your client delivery?",
    type: "select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_applicable", label: "Not Applicable" }
    ],
    required: true,
    section: "Delivery Dynamics",
    sectionColor: "sky"
  },
  {
    id: "marginalValueSaturation",
    number: 19,
    title: "Value Saturation",
    subtitle: "Compared to similar work, how much incremental value does adding more people create here?",
    type: "select",
    options: [
      { value: "significant", label: "Significant additional value" },
      { value: "some", label: "Some additional value" },
      { value: "minimal", label: "Minimal additional value" },
      { value: "none", label: "No meaningful additional value" }
    ],
    required: true,
    section: "Value, Load & Confidence",
    sectionColor: "amber"
  },
  {
    id: "seniorOversightLoad",
    number: 20,
    title: "Senior Oversight Load",
    subtitle: "Compared to similar engagements, how much senior oversight does this require?",
    type: "select",
    options: [
      { value: "less", label: "Less than usual" },
      { value: "about_same", label: "About the same" },
      { value: "more", label: "More than usual" }
    ],
    required: true,
    section: "Value, Load & Confidence",
    sectionColor: "amber"
  },
  {
    id: "coordinationDecisionDrag",
    number: 21,
    title: "Coordination & Decision Drag",
    subtitle: "How much coordination is required across teams and stakeholders?",
    type: "select",
    options: [
      { value: "minimal", label: "Minimal" },
      { value: "moderate", label: "Moderate" },
      { value: "heavy", label: "Heavy" }
    ],
    required: true,
    section: "Value, Load & Confidence",
    sectionColor: "amber"
  },
  {
    id: "deliveryConfidence",
    number: 22,
    title: "Delivery Confidence",
    subtitle: "How confident are you in the delivery model for this engagement? (executive gut-check)",
    type: "select",
    options: [
      { value: "high", label: "High confidence" },
      { value: "some_concerns", label: "Some concerns" },
      { value: "low", label: "Low confidence" }
    ],
    required: true,
    section: "Value, Load & Confidence",
    sectionColor: "amber"
  },
  {
    id: "openSignal",
    number: 23,
    title: "Is there anything about this client engagement that feels risky or unusual?",
    subtitle: "This is optional - share any concerns or observations",
    type: "textarea",
    placeholder: "Share any concerns or observations...",
    required: false,
    section: "Open Signal",
    sectionColor: "violet"
  }
];

export default function Assessment() {
  const [currentQuestion, setCurrentQuestion] = useState(-1); // -1 = intro
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionResult, setDecisionResult] = useState<any>(null);
  const [showDecisionPage, setShowDecisionPage] = useState(false);
  const [storedPdfData, setStoredPdfData] = useState<any>(null);
  const [submittedUserInfo, setSubmittedUserInfo] = useState<{fullName: string; workEmail: string; roleTitle: string; organisationName: string; organisationSize: string} | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const searchString = useSearch();
  const isFromProfiler = searchString.includes("from=profiler");

  const [profilerAnswers, setProfilerAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isFromProfiler) {
      try {
        const stored = localStorage.getItem(PROFILER_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfilerAnswers(parsed);
        }
      } catch (e) {
        console.error("Error loading profiler answers:", e);
      }
    }
  }, [isFromProfiler]);

  const activeQuestions = isFromProfiler
    ? questions.filter(q => !PROFILER_FIELD_KEYS.includes(q.id)).map((q, idx) => ({ ...q, number: idx + 1 }))
    : questions;

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
  const isIntro = currentQuestion === -1;
  const isReviewScreen = currentQuestion === totalQuestions;

  const getDefaultValues = useCallback(() => {
    return {
      fullName: "",
      workEmail: "",
      roleTitle: "",
      organisationName: "",
      organisationSize: "",
      decisionEvaluating: "",
      engagementType: "",
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
      aiImpactMeasurement: "",
      marginalValueSaturation: "",
      seniorOversightLoad: "",
      coordinationDecisionDrag: "",
      deliveryConfidence: "",
      openSignal: "",
    };
  }, []);

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (isFromProfiler && Object.keys(profilerAnswers).length > 0) {
      const currentValues = form.getValues();
      form.reset({ ...currentValues, ...profilerAnswers });
      toast({
        title: "Quick Profile Loaded",
        description: `${Object.keys(profilerAnswers).length} answers carried over. Complete the remaining questions.`,
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
    
    // Ensure we start at intro (currentQuestion = -1)
    setCurrentQuestion(-1);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-focus input fields after transition
  // Q1-Q4 (indices 0-3): text/email inputs - auto-focus enabled
  // Q5-Q22 (indices 4-21): multiple choice options - NO auto-focus (prevents keyboard on mobile)
  // Q23 (index 22): textarea - auto-focus enabled
  useEffect(() => {
    if (currentQuestion >= 0 && currentQuestion < totalQuestions) {
      const question = activeQuestions[currentQuestion];
      const shouldAutoFocus = currentQuestion <= 3 || currentQuestion === totalQuestions - 1;
      
      if (shouldAutoFocus && (question.type === "text" || question.type === "email" || question.type === "textarea")) {
        const timer = setTimeout(() => {
          const input = document.querySelector(`input[name="${question.id}"], textarea[name="${question.id}"]`) as HTMLElement;
          if (input) {
            input.focus();
          }
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [currentQuestion]);

  // Check if all mandatory questions (1-22) are answered
  const areMandatoryQuestionsAnswered = () => {
    const values = form.getValues();
    // Questions 0-21 (indices) are mandatory, question 22 (index) / Q23 is optional
    for (let i = 0; i < totalQuestions - 1; i++) {
      const question = activeQuestions[i];
      const value = values[question.id as keyof typeof values];
      if (!value || value === "") {
        return false;
      }
    }
    return true;
  };

  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (currentQuestion < 0 || currentQuestion >= totalQuestions) return true;
    const question = activeQuestions[currentQuestion];
    // Q23 (last question) is optional
    if (currentQuestion === totalQuestions - 1) return true;
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
      
      // Don't intercept scroll inside review screen's scrollable content
      if (isReviewScreen) return;
      
      if (e.deltaY > 50) {
        // Scroll down - go to next question (forward)
        // Must answer current question before advancing (except Q23 which is optional)
        if (!isCurrentQuestionAnswered()) {
          lastScrollTime = now;
          toast({
            title: "Please answer before proceeding.",
            variant: "destructive",
          });
          return;
        }
        
        lastScrollTime = now;
        if (isIntro) {
          scrollToQuestion(0);
        } else if (currentQuestion < totalQuestions - 1) {
          // Can scroll forward if current question is answered
          scrollToQuestion(currentQuestion + 1);
        } else if (currentQuestion === totalQuestions - 1) {
          // On last question (Q23), only allow scroll to review if Q1-Q22 are answered
          if (areMandatoryQuestionsAnswered()) {
            scrollToQuestion(currentQuestion + 1);
          }
        }
      } else if (e.deltaY < -50) {
        // Scroll up - go to previous question (backward)
        lastScrollTime = now;
        if (currentQuestion > -1) {
          scrollToQuestion(currentQuestion - 1);
        }
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentQuestion, isIntro, isReviewScreen, isTransitioning, isSubmitting, totalQuestions]);

  // Touch swipe for mobile navigation
  useEffect(() => {
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning || isSubmitting || isReviewScreen) return;
      
      touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // Swipe up - go to next question (forward)
          if (!isCurrentQuestionAnswered()) {
            toast({
              title: "Please answer before proceeding.",
              variant: "destructive",
            });
            return;
          }
          
          if (isIntro) {
            scrollToQuestion(0);
          } else if (currentQuestion < totalQuestions - 1) {
            scrollToQuestion(currentQuestion + 1);
          } else if (currentQuestion === totalQuestions - 1) {
            if (areMandatoryQuestionsAnswered()) {
              scrollToQuestion(currentQuestion + 1);
            }
          }
        } else {
          // Swipe down - go to previous question (backward)
          if (currentQuestion > -1) {
            scrollToQuestion(currentQuestion - 1);
          }
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
  }, [currentQuestion, isIntro, isReviewScreen, isTransitioning, isSubmitting, totalQuestions]);

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
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.pdfs) {
          setStoredPdfData(result.pdfs);
          setTimeout(() => downloadPDF(result.pdfs.decisionMemo.filename, result.pdfs.decisionMemo.data), 100);
          setTimeout(() => downloadPDF(result.pdfs.assessmentOutput.filename, result.pdfs.assessmentOutput.data), 500);
        }
        
        setDecisionResult(result.decisionObject);
        setSubmittedUserInfo({
          fullName: data.fullName,
          workEmail: data.workEmail,
          roleTitle: data.roleTitle,
          organisationName: data.organisationName,
          organisationSize: data.organisationSize,
        });
        setShowDecisionPage(true);
        setIsSubmitting(false);
        
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        
        toast({
          title: "Assessment Complete",
          description: "Your PDFs are downloading and email has been sent.",
        });
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
    setIsTransitioning(true);
    setCurrentQuestion(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleNext = () => {
    if (isIntro) {
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
    if (currentQuestion > -1) {
      scrollToQuestion(currentQuestion - 1);
    }
  };

  const handleOptionSelect = (value: string) => {
    const question = activeQuestions[currentQuestion];
    form.setValue(question.id, value);
    setTimeout(() => handleNext(), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && currentQuestion >= 0 && currentQuestion < totalQuestions) {
      const question = activeQuestions[currentQuestion];
      const isLastQuestion = currentQuestion === totalQuestions - 1;
      // Allow Enter on non-textarea questions, or on the last question (optional) to go to review
      if (question.type !== "textarea" || isLastQuestion) {
        // Must answer current question before advancing
        if (!isCurrentQuestionAnswered()) {
          toast({
            title: "Please answer before proceeding.",
            variant: "destructive",
          });
          return;
        }
        // On last question, only allow going to review if Q1-Q22 are answered
        if (isLastQuestion && !areMandatoryQuestionsAnswered()) {
          return;
        }
        e.preventDefault();
        handleNext();
      }
    }
  };

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
    const isActive = currentQuestion === questionIndex;
    
    // Only render cards that are nearby for performance
    const distance = Math.abs(questionIndex - currentQuestion);
    if (distance > 1 && !isIntro && !isReviewScreen) return null;
    
    const gradient = getSectionGradient(question.sectionColor);
    const currentValue = watchedValues[question.id] || "";

    return (
      <div
        key={question.id}
        className={`absolute inset-0 z-20 ${isActive ? "" : "pointer-events-none opacity-0"}`}
      >
        <div className={`min-h-screen bg-gradient-to-br ${gradient} flex flex-col`}>
          {/* Question content */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-20">
            <div 
              className={`w-full max-w-2xl transition-all duration-500 ${
                isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: isActive ? "150ms" : "0ms" }}
            >
              {/* Section & Question number */}
              <div className="mb-4 sm:mb-6">
                <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                  {question.section}
                </span>
                <div className="text-white/70 text-sm sm:text-lg font-medium">
                  Question {question.number} of {totalQuestions}
                </div>
              </div>

              {/* Question title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4">
                {question.title}
              </h2>
              
              {question.subtitle && (
                <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-8">
                  {question.subtitle}
                </p>
              )}

              {/* Input area */}
              <div className="mt-6 sm:mt-8" onKeyDown={handleKeyDown}>
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
                              key={`input-${question.id}-${isActive}`}
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
                              key={`textarea-${question.id}-${isActive}`}
                              className="text-base sm:text-lg py-3 sm:py-4 px-4 sm:px-6 min-h-[120px] sm:min-h-[150px] bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/50 focus:border-white focus:bg-white/20 rounded-xl"
                            />
                          </FormControl>
                          <FormMessage className="text-white/90 mt-2" />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {question.options?.map((option, index) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleOptionSelect(option.value)}
                          className={`w-full text-left px-4 sm:px-6 py-3 sm:py-5 rounded-xl border-2 transition-all duration-300 flex items-center gap-3 sm:gap-4 group ${
                            currentValue === option.value
                              ? "bg-white text-gray-900 border-white shadow-lg scale-[1.02]"
                              : "bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
                          }`}
                        >
                          <span className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                            currentValue === option.value
                              ? "bg-emerald-500 text-white"
                              : "bg-white/20 text-white group-hover:bg-white/30"
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-sm sm:text-lg font-medium flex-1">
                            {option.label}
                          </span>
                          {currentValue === option.value && (
                            <Check className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </Form>
              </div>

              {/* Continue hint for text inputs */}
              {(question.type === "text" || question.type === "email") && (
                <div className="mt-6 flex items-center gap-2 text-white/60 text-sm">
                  <span className="hidden sm:inline">Press</span>
                  <kbd className="hidden sm:inline px-2 py-1 bg-white/20 rounded text-xs font-mono">Enter ↵</kbd>
                  <span className="hidden sm:inline">or use buttons to continue</span>
                  <span className="sm:hidden">Swipe up or tap Continue</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIntro = () => {
    if (!isIntro) return null;
    
    return (
      <div className="absolute inset-0 z-30">
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
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-6 mb-6 sm:mb-12 text-emerald-100 text-xs sm:text-base">
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
              Start Assessment
              <ArrowDown className="ml-2 sm:ml-3 h-4 w-4 sm:h-6 sm:w-6" />
            </Button>
            
            <p className="mt-8 sm:mt-10 text-xs sm:text-sm text-emerald-200/80 px-4">
              No financial data, timesheets, or individual performance information is required.
            </p>
          </div>
          
          <div className="absolute bottom-4 sm:bottom-8 animate-bounce">
            <ChevronDown className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-200/60" />
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => {
    if (!isReviewScreen) return null;
    
    return (
      <div className="absolute inset-0 z-30 overflow-y-auto">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 px-6">
          <div className="max-w-2xl mx-auto">
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
                    "Submitting..."
                  ) : (
                    <>
                      Submit Assessment
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
      <div className="absolute inset-0 z-30 overflow-y-auto">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">

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
              <div className="flex items-center gap-4">
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

            {/* Assessment Context */}
            {submittedUserInfo && (
              <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-400" />
                  Assessment Context
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-500 mb-1">AI Impact</p>
                  <p className="text-sm font-medium text-white">{d.aiImpactClassification}</p>
                </div>
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

            {/* Section 7 - Contradiction Flags */}
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
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 py-6 text-base rounded-xl"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Return to Home
                </Button>
              </Link>
            </div>

          </div>
          <Footer />
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden bg-emerald-600">
      {/* Render all screens first */}
      {renderIntro()}
      {activeQuestions.map((_, index) => renderCard(index))}
      {renderReview()}
      {renderDecisionPage()}

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
                  {isReviewScreen ? "Review" : `${currentQuestion + 1}/${totalQuestions}`}
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
        {!isIntro && !isReviewScreen && !showDecisionPage && (
          <div className="max-w-4xl mx-auto px-3 sm:px-4 pb-2 flex items-center gap-0.5 overflow-x-auto">
            {activeQuestions.map((q, idx) => {
              const value = watchedValues[q.id] || "";
              const isAnswered = value !== "";
              const isCurrent = currentQuestion === idx;
              const isNeutral = neutralFields.includes(q.id);
              const riskMapping = questionRiskMapping[q.id];
              const risk = riskMapping && value ? riskMapping[value] : null;
              
              let cellColor = "bg-white/10";
              if (isAnswered) {
                if (isNeutral || !risk) {
                  cellColor = "bg-white/30";
                } else {
                  cellColor = getHeatmapColor(risk);
                }
              }
              
              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(idx)}
                  className={`flex-shrink-0 w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] rounded-[1px] transition-all duration-300 ${cellColor} ${
                    isCurrent ? "ring-1 ring-white ring-offset-1 ring-offset-transparent animate-pulse scale-150" : ""
                  } ${!isAnswered && !isCurrent ? "opacity-40" : ""}`}
                  title={`Q${q.number}: ${q.title}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation buttons - rendered after content to be on top */}
      {!isIntro && !isReviewScreen && !showDecisionPage && (
        <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 sm:px-6" style={{ pointerEvents: 'auto' }}>
          {/* Swipe hint for mobile - show on first few questions */}
          {currentQuestion >= 0 && currentQuestion <= 2 && (
            <div className="sm:hidden flex items-center gap-2 text-white/60 text-xs mb-1 animate-pulse">
              <ChevronDown className="h-3 w-3 rotate-180" />
              <span>Swipe up to continue</span>
              <ChevronDown className="h-3 w-3 rotate-180" />
            </div>
          )}
          <div className="flex justify-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentQuestion <= 0}
              className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              <ArrowUp className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <Button
              onClick={handleNext}
              className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
            >
              {currentQuestion === totalQuestions - 1 ? "Review" : "Continue"}
              <ArrowDown className="ml-1 sm:ml-2 h-4 w-4" />
            </Button>
          </div>
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
                <p className="text-gray-600">Give us a minute.</p>
                <p className="text-gray-600">
                  Your assessment and decision memo will be auto downloaded on this device and sent to you via email as well.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

    </div>
  );
}
