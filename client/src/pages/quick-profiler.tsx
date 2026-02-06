import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { ArrowRight, ArrowDown, ArrowUp, Zap, AlertTriangle, ShieldCheck, ShieldAlert, Shield, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const PROFILER_STORAGE_KEY = "marginmix_profiler_answers";

interface ProfilerQuestion {
  id: string;
  fieldKey: string;
  number: number;
  title: string;
  subtitle?: string;
  options: { value: string; label: string }[];
  riskMapping: Record<string, "low" | "medium" | "high">;
}

const profilerQuestions: ProfilerQuestion[] = [
  {
    id: "q1",
    fieldKey: "decisionEvaluating",
    number: 1,
    title: "What decision are you evaluating with this assessment?",
    options: [
      { value: "new-client-win", label: "New client win / pitch acceptance" },
      { value: "renewal-extension", label: "Renewal / contract extension" },
      { value: "scope-expansion", label: "Scope expansion without repricing" },
      { value: "escalation", label: "Escalation on a live account" },
      { value: "strategic-exception", label: "Strategic / leadership-driven exception" },
      { value: "exploratory", label: "Exploratory / no active decision" }
    ],
    riskMapping: {
      "new-client-win": "low",
      "renewal-extension": "low",
      "scope-expansion": "high",
      "escalation": "high",
      "strategic-exception": "medium",
      "exploratory": "low"
    }
  },
  {
    id: "q2",
    fieldKey: "engagementClassification",
    number: 2,
    title: "How would you classify this engagement today?",
    options: [
      { value: "new", label: "New (pre-kickoff / onboarding phase)" },
      { value: "ongoing-less-6", label: "Ongoing (in delivery for less than 6 months)" },
      { value: "ongoing-6-12", label: "Ongoing (in delivery for 6–12 months)" },
      { value: "ongoing-12-plus", label: "Ongoing (in delivery for 12+ months)" },
      { value: "renewal-expansion", label: "Renewal / scope expansion of an existing engagement" }
    ],
    riskMapping: {
      "new": "medium",
      "ongoing-less-6": "medium",
      "ongoing-6-12": "low",
      "ongoing-12-plus": "low",
      "renewal-expansion": "medium"
    }
  },
  {
    id: "q3",
    fieldKey: "clientVolatility",
    number: 3,
    title: "How would you rate client volatility?",
    options: [
      { value: "low", label: "Low (stable stakeholders, clear expectations)" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High (frequent changes, multiple decision-makers)" }
    ],
    riskMapping: {
      "low": "low",
      "medium": "medium",
      "high": "high"
    }
  },
  {
    id: "q4",
    fieldKey: "seniorLeadershipInvolvement",
    number: 4,
    title: "What's the planned senior leadership involvement?",
    options: [
      { value: "minimal", label: "Minimal (oversight only)" },
      { value: "periodic", label: "Periodic (key moments)" },
      { value: "frequent", label: "Frequent (ongoing)" },
      { value: "continuous", label: "Continuous (embedded)" }
    ],
    riskMapping: {
      "minimal": "low",
      "periodic": "medium",
      "frequent": "high",
      "continuous": "high"
    }
  },
  {
    id: "q5",
    fieldKey: "executionThinkingMix",
    number: 5,
    title: "What's the execution vs thinking mix?",
    options: [
      { value: "execution-heavy", label: "Execution-heavy" },
      { value: "balanced", label: "Balanced" },
      { value: "thinking-heavy", label: "Thinking-heavy" }
    ],
    riskMapping: {
      "execution-heavy": "low",
      "balanced": "medium",
      "thinking-heavy": "high"
    }
  },
  {
    id: "q6",
    fieldKey: "deliveryConfidence",
    number: 6,
    title: "Delivery Confidence",
    subtitle: "How confident are you in the delivery model for this engagement? (executive gut-check)",
    options: [
      { value: "high", label: "High confidence" },
      { value: "some_concerns", label: "Some concerns" },
      { value: "low", label: "Low confidence" }
    ],
    riskMapping: {
      "high": "low",
      "some_concerns": "medium",
      "low": "high"
    }
  }
];

type RiskLevel = "none" | "low" | "moderate" | "elevated" | "high" | "critical";

interface RiskState {
  level: RiskLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof ShieldCheck;
  percentage: number;
}

type Level = "low" | "medium" | "high";
type Confidence = "positive" | "neutral" | "negative";
type Verdict = "Structurally Safe" | "Price Sensitive" | "Execution Heavy" | "Structurally Fragile" | "Do Not Proceed Without Repricing";

function deriveSignals(answers: Record<string, string>) {
  const seniorInvolvement = answers["q4"] || "";
  const seniorDependency: Level =
    seniorInvolvement === "frequent" || seniorInvolvement === "continuous" ? "high" :
    seniorInvolvement === "periodic" ? "medium" : "low";

  const clientVol = answers["q3"] || "";
  const clientVolatility: Level =
    clientVol === "high" ? "high" :
    clientVol === "medium" ? "medium" : "low";

  const execMix = answers["q5"] || "";
  const teamMaturity: Level =
    execMix === "execution-heavy" ? "high" :
    execMix === "balanced" ? "medium" : "low";

  const delConf = answers["q6"] || "";
  const deliveryConfidence: Confidence =
    delConf === "high" ? "positive" :
    delConf === "some_concerns" ? "neutral" :
    delConf === "low" ? "negative" : "neutral";

  return { seniorDependency, clientVolatility, teamMaturity, deliveryConfidence };
}

interface QuickDimensions {
  workforceIntensity: Level;
  coordinationEntropy: Level;
  commercialExposure: Level;
  volatilityControl: Level;
  confidenceSignal: Confidence;
}

function deriveDimensions(signals: ReturnType<typeof deriveSignals>): QuickDimensions {
  const workforceIntensity: Level =
    signals.seniorDependency === "high" ? "high" :
    signals.seniorDependency === "medium" ? "medium" : "low";

  const coordinationEntropy: Level = "low" as Level;

  const commercialExposure: Level = "low" as Level;

  const volatilityControl: Level =
    signals.clientVolatility === "high" ? "high" :
    signals.clientVolatility === "medium" ? "medium" : "low";

  const confidenceSignal: Confidence =
    signals.deliveryConfidence === "negative" ? "negative" :
    signals.deliveryConfidence === "positive" ? "positive" : "neutral";

  return { workforceIntensity, coordinationEntropy, commercialExposure, volatilityControl, confidenceSignal };
}

function decideVerdict(dims: QuickDimensions): { verdict: Verdict; reason: string } {
  if (dims.confidenceSignal === "negative") {
    return {
      verdict: "Do Not Proceed Without Repricing",
      reason: "Pricing or delivery confidence is insufficient to proceed safely. Engagement requires repricing or structural changes before commitment."
    };
  }
  if (dims.workforceIntensity === "high" && dims.coordinationEntropy === "high") {
    return {
      verdict: "Structurally Fragile",
      reason: "Structural load exceeds safe operating assumptions. High workforce intensity combined with high coordination entropy creates unsustainable margin pressure."
    };
  }
  if (dims.commercialExposure === "high") {
    return {
      verdict: "Price Sensitive",
      reason: "Pricing assumptions require protection. High scope elasticity or pricing rigidity creates commercial vulnerability."
    };
  }
  if (dims.workforceIntensity === "high") {
    return {
      verdict: "Execution Heavy",
      reason: "Execution and coordination will dominate effort. Senior dependency and iteration load require elevated management attention."
    };
  }
  return {
    verdict: "Structurally Safe",
    reason: "Engagement viable under stated assumptions. No high-risk conditions triggered. Proceed with standard governance."
  };
}

const verdictToRisk: Record<Verdict, Omit<RiskState, 'percentage'>> = {
  "Do Not Proceed Without Repricing": { level: "critical", label: "Do Not Proceed Without Repricing", color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-500", icon: ShieldAlert },
  "Structurally Fragile": { level: "high", label: "Structurally Fragile", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-400", icon: AlertTriangle },
  "Execution Heavy": { level: "elevated", label: "Execution Heavy", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-400", icon: AlertTriangle },
  "Price Sensitive": { level: "moderate", label: "Price Sensitive", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-400", icon: Shield },
  "Structurally Safe": { level: "low", label: "Structurally Safe", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-400", icon: ShieldCheck },
};

const verdictPercentage: Record<Verdict, number> = {
  "Do Not Proceed Without Repricing": 100,
  "Structurally Fragile": 85,
  "Execution Heavy": 65,
  "Price Sensitive": 45,
  "Structurally Safe": 15,
};

function computeRisk(answers: Record<string, string>): RiskState {
  const answeredQuestions = profilerQuestions.filter(q => answers[q.id]);
  if (answeredQuestions.length === 0) {
    return { level: "none", label: "Awaiting Input", color: "text-gray-400", bgColor: "bg-gray-100", borderColor: "border-gray-300", icon: Shield, percentage: 0 };
  }

  const signals = deriveSignals(answers);
  const dimensions = deriveDimensions(signals);
  const { verdict } = decideVerdict(dimensions);
  const riskStyle = verdictToRisk[verdict];

  return { ...riskStyle, percentage: verdictPercentage[verdict] };
}

function getHeatmapColor(risk: "low" | "medium" | "high"): string {
  if (risk === "high") return "bg-red-500";
  if (risk === "medium") return "bg-amber-400";
  return "bg-emerald-500";
}

function getHeatmapGlow(risk: "low" | "medium" | "high"): string {
  if (risk === "high") return "shadow-red-500/40";
  if (risk === "medium") return "shadow-amber-400/40";
  return "shadow-emerald-500/40";
}

export default function QuickProfiler() {
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const totalQuestions = profilerQuestions.length;
  const isIntro = currentQuestion === -1;

  const risk = computeRisk(answers);

  const scrollToQuestion = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    if (index > totalQuestions - 1 && Object.keys(answers).length === totalQuestions) {
      setShowResult(true);
    }
    setCurrentQuestion(index);
    setTimeout(() => setIsTransitioning(false), 400);
  };

  const handleOptionSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(() => {
      const currentIdx = profilerQuestions.findIndex(q => q.id === questionId);
      if (currentIdx < totalQuestions - 1) {
        scrollToQuestion(currentIdx + 1);
      } else {
        setShowResult(true);
        scrollToQuestion(totalQuestions);
      }
    }, 300);
  };

  const handleGoToFullAssessment = () => {
    const profilerData: Record<string, string> = {};
    for (const q of profilerQuestions) {
      if (answers[q.id]) {
        profilerData[q.fieldKey] = answers[q.id];
      }
    }
    localStorage.setItem(PROFILER_STORAGE_KEY, JSON.stringify(profilerData));
    setLocation("/assessment?from=profiler");
  };

  useEffect(() => {
    let touchStartY = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning || showResult) return;
      const touchEndY = e.changedTouches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;

      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          if (isIntro) {
            scrollToQuestion(0);
          } else if (currentQuestion < totalQuestions - 1) {
            if (!answers[profilerQuestions[currentQuestion].id]) {
              toast({ title: "Please answer before proceeding.", variant: "destructive" });
              return;
            }
            scrollToQuestion(currentQuestion + 1);
          }
        } else {
          if (currentQuestion > -1) {
            scrollToQuestion(currentQuestion - 1);
          }
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (isTransitioning || showResult) return;
      if (e.deltaY > 50) {
        if (isIntro) {
          scrollToQuestion(0);
        } else if (currentQuestion < totalQuestions - 1) {
          if (!answers[profilerQuestions[currentQuestion].id]) {
            toast({ title: "Please answer before proceeding.", variant: "destructive" });
            return;
          }
          scrollToQuestion(currentQuestion + 1);
        }
      } else if (e.deltaY < -50) {
        if (currentQuestion > -1) {
          scrollToQuestion(currentQuestion - 1);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd);
      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentQuestion, isIntro, isTransitioning, showResult, answers, totalQuestions]);

  const progressPercentage = showResult ? 100 : Math.max(0, (currentQuestion / totalQuestions) * 100);

  const renderHeatmap = () => {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        {profilerQuestions.map((q, idx) => {
          const answer = answers[q.id];
          const riskLevel = answer ? q.riskMapping[answer] : null;
          const isActive = idx === currentQuestion;
          const isAnswered = !!answer;

          return (
            <div key={q.id} className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-500
                  ${isAnswered && riskLevel ? `${getHeatmapColor(riskLevel)} text-white shadow-lg ${getHeatmapGlow(riskLevel)}` : ''}
                  ${!isAnswered && isActive ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-2 ring-emerald-500 animate-pulse' : ''}
                  ${!isAnswered && !isActive ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600' : ''}
                `}
              >
                {q.number}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRiskIndicator = () => {
    if (risk.level === "none") return null;
    const RiskIcon = risk.icon;
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${risk.bgColor} ${risk.borderColor} transition-all duration-500`}>
        <RiskIcon className={`h-4 w-4 ${risk.color}`} />
        <span className={`text-xs sm:text-sm font-semibold ${risk.color}`}>{risk.label}</span>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-white dark:bg-gray-950">
      <Header variant="solid" />

      <div className="fixed top-16 left-0 right-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 py-2">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {renderHeatmap()}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mr-3">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                  risk.level === "critical" || risk.level === "high" ? "bg-red-500" :
                  risk.level === "elevated" ? "bg-orange-500" :
                  risk.level === "moderate" ? "bg-amber-500" :
                  risk.level === "low" ? "bg-emerald-500" : "bg-gray-400"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {renderRiskIndicator()}
          </div>
        </div>
      </div>

      <div className="h-full pt-32 sm:pt-36">
        {isIntro && !showResult && (
          <div className="h-full flex items-center justify-center px-4 animate-in fade-in duration-500">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-6">
                <Zap className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">60-Second Risk Check</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                Quick Margin Risk Profiler
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-3 max-w-xl mx-auto">
                Answer 6 rapid-fire questions. Watch your risk heatmap build in real time.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-8 max-w-lg mx-auto">
                Get an instant margin risk indication before committing to the full assessment.
              </p>
              <Button
                size="lg"
                className="h-14 text-lg px-8 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                onClick={() => scrollToQuestion(0)}
              >
                Start Risk Check
                <ArrowDown className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {!isIntro && !showResult && currentQuestion >= 0 && currentQuestion < totalQuestions && (
          <div className="h-full flex items-center justify-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="w-full max-w-2xl mx-auto">
              <div className="mb-2">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Question {profilerQuestions[currentQuestion].number} of {totalQuestions}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                {profilerQuestions[currentQuestion].title}
              </h2>
              {profilerQuestions[currentQuestion].subtitle && (
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6">
                  {profilerQuestions[currentQuestion].subtitle}
                </p>
              )}
              {!profilerQuestions[currentQuestion].subtitle && <div className="mb-6" />}
              <div className="space-y-3">
                {profilerQuestions[currentQuestion].options.map((option, idx) => {
                  const isSelected = answers[profilerQuestions[currentQuestion].id] === option.value;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleOptionSelect(profilerQuestions[currentQuestion].id, option.value)}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 sm:gap-4 group
                        ${isSelected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-400"
                          : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors
                        ${isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600"
                        }`}>
                        {letter}
                      </div>
                      <span className={`text-sm sm:text-base font-medium ${isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-gray-700 dark:text-gray-300"}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between items-center mt-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToQuestion(currentQuestion - 1)}
                  className="text-gray-500"
                >
                  <ArrowUp className="h-4 w-4 mr-1" /> Back
                </Button>
                {answers[profilerQuestions[currentQuestion].id] && currentQuestion < totalQuestions - 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToQuestion(currentQuestion + 1)}
                    className="text-emerald-600"
                  >
                    Next <ArrowDown className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {showResult && (
          <div className="h-full flex items-center justify-center px-4 animate-in fade-in zoom-in-95 duration-700 overflow-y-auto">
            <div className="w-full max-w-2xl mx-auto text-center py-8">
              <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 mb-6 ${risk.bgColor} ${risk.borderColor}`}>
                <risk.icon className={`h-6 w-6 ${risk.color}`} />
                <span className={`text-lg font-bold ${risk.color}`}>Margin Risk Profile</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {risk.label}
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto text-sm sm:text-base">
                {risk.level === "critical" && "Your delivery confidence is critically low. This engagement requires repricing or structural changes before commitment."}
                {risk.level === "high" && "Multiple high-risk signals detected. Structural overload likely — senior involvement and volatility create unsustainable margin pressure."}
                {risk.level === "elevated" && "Elevated risk indicators present. Execution demands will dominate effort and may erode margins without careful management."}
                {risk.level === "moderate" && "Some risk signals present. Pricing assumptions may need protection to preserve margins."}
                {risk.level === "low" && "No high-risk conditions triggered. Engagement appears viable under stated assumptions."}
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-8 max-w-md sm:max-w-xl mx-auto">
                {profilerQuestions.map((q) => {
                  const answer = answers[q.id];
                  const riskLevel = answer ? q.riskMapping[answer] : null;
                  return (
                    <div key={q.id} className="flex flex-col items-center gap-1">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg ${riskLevel ? `${getHeatmapColor(riskLevel)} text-white ${getHeatmapGlow(riskLevel)}` : 'bg-gray-200 text-gray-400'}`}>
                        Q{q.number}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {riskLevel === "high" ? "High" : riskLevel === "medium" ? "Med" : "Low"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className={`p-4 sm:p-6 rounded-2xl border-2 mb-8 ${risk.bgColor} ${risk.borderColor}`}>
                <p className={`text-sm sm:text-base font-medium ${risk.color}`}>
                  {risk.level === "critical" || risk.level === "high"
                    ? "This quick profile indicates significant margin risk. A full assessment will provide detailed dimension analysis, effort allocation recommendations, and a Decision Memo."
                    : risk.level === "elevated" || risk.level === "moderate"
                    ? "Some risk signals are present. A full assessment will break down each risk dimension and provide actionable recommendations to protect your margins."
                    : "Your initial profile looks positive. A full assessment will validate this across all 17 risk dimensions and provide a comprehensive Decision Memo."}
                </p>
              </div>

              <Button
                size="lg"
                className="h-14 text-base sm:text-lg px-6 sm:px-8 bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20"
                onClick={handleGoToFullAssessment}
              >
                Get Full Margin Risk Decision Clarity
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
                Your answers carry forward — the full assessment will skip these 6 questions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
