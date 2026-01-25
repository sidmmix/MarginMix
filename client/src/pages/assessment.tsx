import { useState } from "react";
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
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Send, User, Building2, Briefcase, Settings, Zap, MessageSquare, CheckCircle2, Clock, Shield, Scale } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

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

export default function Assessment() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
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
    },
  });

  const watchedValues = form.watch();
  const calculateProgress = () => {
    const requiredFields = [
      'fullName', 'workEmail', 'roleTitle', 'organisationName', 'organisationSize',
      'decisionEvaluating', 'engagementType', 'specifyContext', 'engagementClassification',
      'clientVolatility', 'stakeholderComplexity', 'seniorLeadershipInvolvement',
      'midLevelOversight', 'executionThinkingMix', 'iterationIntensity',
      'scopeChangeLikelihood', 'crossFunctionalCoordination', 'aiImpactMeasurement',
      'marginalValueSaturation', 'seniorOversightLoad', 'coordinationDecisionDrag', 'deliveryConfidence'
    ];
    const filled = requiredFields.filter(field => watchedValues[field as keyof AssessmentFormData]?.trim()).length;
    return Math.round((filled / requiredFields.length) * 100);
  };
  const progress = calculateProgress();

  const onSubmit = async (data: AssessmentFormData) => {
    setIsSubmitting(true);
    try {
      // Submit the assessment data
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setShowConfirmation(true);
        form.reset();
      }
    } catch (error) {
      console.error("Failed to submit assessment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    toast({
      title: "Please complete all required questions",
      description: "All 18 questions must be answered before submitting. Only the Open Signal question is optional.",
      variant: "destructive",
    });
    // Scroll to the first error
    const firstError = document.querySelector('[data-invalid="true"]') || document.querySelector('.text-destructive');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-gray-900 dark:via-emerald-900/10 dark:to-gray-900">
      {/* Header */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <div className="flex flex-col cursor-pointer">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  MarginMix
                </span>
                <span className="text-xs italic text-gray-500 dark:text-gray-400" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{progress}% complete</span>
              </div>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="pb-2">
            <Progress value={progress} className="h-1.5 bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Intro Section */}
        <Card className="mb-8 border-emerald-200 dark:border-emerald-800 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xl sm:text-2xl text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              Margin Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p className="text-lg font-semibold">Welcome.</p>
            <p>
              You're about to complete a <strong>Margin Risk Assessment</strong> for a specific client engagement decision.
            </p>
            <p className="text-emerald-600 dark:text-emerald-400">
              MarginMix evaluates margin risk before delivery begins by examining workforce intensity, senior involvement, and coordination overhead — not delivery performance or individual productivity.
            </p>
            <div className="flex flex-wrap gap-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span><strong>23</strong> questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>~<strong>5</strong> minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>GDPR & CCPA compliant</span>
              </div>
            </div>
            <p>
              A structured margin-risk verdict and decision guidance will be prepared and delivered to your email within 24 hours.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-4 font-bold">
              No financial data, timesheets, or individual performance information is required.<br />
              All information is treated confidentially.
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Let's begin.
            </p>
          </CardContent>
        </Card>

        {/* Assessment Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
            {/* Section A: Contact & Context */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-emerald-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold text-sm">A</div>
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Contact & Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q1: Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1. Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q2: Work Email */}
                <FormField
                  control={form.control}
                  name="workEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>2. Work Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your work email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q3: Role / Title */}
                <FormField
                  control={form.control}
                  name="roleTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>3. Role / Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your role or title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q4: Organization Name */}
                <FormField
                  control={form.control}
                  name="organisationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4. Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your organization name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q5: Organization Size - Dropdown */}
                <FormField
                  control={form.control}
                  name="organisationSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>5. Organization Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="100-250">100–250</SelectItem>
                          <SelectItem value="250-500">250–500</SelectItem>
                          <SelectItem value="500-1000">500–1,000</SelectItem>
                          <SelectItem value="1000-5000">1,000–5,000</SelectItem>
                          <SelectItem value="5000+">5,000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Q6: Decision Evaluating */}
                <FormField
                  control={form.control}
                  name="decisionEvaluating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6. What decision are you evaluating with this assessment?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select decision type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new-client-win">New client win / pitch acceptance</SelectItem>
                          <SelectItem value="renewal-extension">Renewal / contract extension</SelectItem>
                          <SelectItem value="scope-expansion">Scope expansion without repricing</SelectItem>
                          <SelectItem value="escalation">Escalation on a live account</SelectItem>
                          <SelectItem value="strategic-exception">Strategic / leadership-driven exception</SelectItem>
                          <SelectItem value="exploratory">Exploratory / no active decision</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section B: Client Engagement Context */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-teal-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 font-bold text-sm">B</div>
                  <Briefcase className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Client Engagement Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q7: Specify Context */}
                <FormField
                  control={form.control}
                  name="specifyContext"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>7. Specify Context</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select context" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single-client">Single client</SelectItem>
                          <SelectItem value="group-of-clients">Group of clients - Org level</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q8: Engagement Classification */}
                <FormField
                  control={form.control}
                  name="engagementClassification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>8. How would you classify this engagement today?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select engagement classification" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new">New (pre-kickoff / onboarding phase)</SelectItem>
                          <SelectItem value="ongoing-less-6">Ongoing (in delivery for less than 6 months)</SelectItem>
                          <SelectItem value="ongoing-6-12">Ongoing (in delivery for 6–12 months)</SelectItem>
                          <SelectItem value="ongoing-12-plus">Ongoing (in delivery for 12+ months)</SelectItem>
                          <SelectItem value="renewal-expansion">Renewal / scope expansion of an existing engagement</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q9: Engagement Type */}
                <FormField
                  control={form.control}
                  name="engagementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>9. Engagement Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select engagement type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed-fee">Fixed fee</SelectItem>
                          <SelectItem value="retainer">Retainer</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q10: Client Volatility */}
                <FormField
                  control={form.control}
                  name="clientVolatility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>10. Client Volatility</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client volatility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low (stable stakeholders, clear expectations)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High (frequent changes, multiple decision-makers)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q9: Stakeholder Complexity */}
                <FormField
                  control={form.control}
                  name="stakeholderComplexity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>11. Stakeholder Complexity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stakeholder complexity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section C: Planned Delivery Structure */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-cyan-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 font-bold text-sm">C</div>
                  <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  Planned Delivery Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q10: Senior Leadership Involvement */}
                <FormField
                  control={form.control}
                  name="seniorLeadershipInvolvement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>12. Planned Senior Leadership Involvement</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select senior leadership involvement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal (oversight only)</SelectItem>
                          <SelectItem value="periodic">Periodic (key moments)</SelectItem>
                          <SelectItem value="frequent">Frequent (ongoing)</SelectItem>
                          <SelectItem value="continuous">Continuous (embedded)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q11: Mid-Level Oversight Intensity */}
                <FormField
                  control={form.control}
                  name="midLevelOversight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>13. Mid-Level Oversight Intensity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mid-level oversight intensity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q12: Execution vs Thinking Mix */}
                <FormField
                  control={form.control}
                  name="executionThinkingMix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>14. Execution vs Thinking Mix</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select execution vs thinking mix" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="execution-heavy">Execution-heavy</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="thinking-heavy">Thinking-heavy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section D: Delivery Dynamics */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-sky-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 font-bold text-sm">D</div>
                  <Zap className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  Delivery Dynamics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q13: Expected Iteration Intensity */}
                <FormField
                  control={form.control}
                  name="iterationIntensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>15. Expected Iteration Intensity</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select iteration intensity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q14: Likelihood of Scope Change */}
                <FormField
                  control={form.control}
                  name="scopeChangeLikelihood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>16. Likelihood of Scope Change</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope change likelihood" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q15: Cross-Functional Coordination */}
                <FormField
                  control={form.control}
                  name="crossFunctionalCoordination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>17. Cross-Functional Coordination Required</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cross-functional coordination" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q16: AI Impact Measurement */}
                <FormField
                  control={form.control}
                  name="aiImpactMeasurement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>18. Are you measuring the Impact of AI in your Client Delivery?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="not_applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section F: Value, Load, Coordination & Confidence */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-amber-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 font-bold text-sm">F</div>
                  <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Value, Load, Coordination & Confidence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q19: Marginal Value Saturation */}
                <FormField
                  control={form.control}
                  name="marginalValueSaturation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">19. Marginal Value Saturation</FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Compared to similar work, how much incremental value does adding more people create here?</p>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="significant">Significant additional value</SelectItem>
                          <SelectItem value="some">Some additional value</SelectItem>
                          <SelectItem value="minimal">Minimal additional value</SelectItem>
                          <SelectItem value="none">No meaningful additional value</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q20: Senior Oversight Load */}
                <FormField
                  control={form.control}
                  name="seniorOversightLoad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">20. Senior Oversight Load</FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Compared to similar engagements, how much senior oversight does this require?</p>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="less">Less than usual</SelectItem>
                          <SelectItem value="about_same">About the same</SelectItem>
                          <SelectItem value="more">More than usual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q21: Coordination & Decision Drag */}
                <FormField
                  control={form.control}
                  name="coordinationDecisionDrag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">21. Coordination & Decision Drag</FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">How much coordination is required across teams and stakeholders?</p>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="heavy">Heavy</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q22: Delivery Confidence */}
                <FormField
                  control={form.control}
                  name="deliveryConfidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">22. Delivery Confidence (executive gut-check)</FormLabel>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">How confident are you in the delivery model for this engagement?</p>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">High confidence</SelectItem>
                          <SelectItem value="some_concerns">Some concerns</SelectItem>
                          <SelectItem value="low">Low confidence</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section G: Open Signal */}
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-violet-500">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 font-bold text-sm">G</div>
                  <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  Open Signal
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">(Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Q23: Open Signal */}
                <FormField
                  control={form.control}
                  name="openSignal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        23. Is there anything about this particular client engagement that feels risky or unusual?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional: Share any concerns or observations..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex flex-col items-center gap-4">
              <Button
                type="submit"
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-12 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isSubmitting}
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
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Your margin risk assessment & decision memo will be delivered to your email
              </p>
            </div>
          </form>
        </Form>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-emerald-600 dark:text-emerald-400">
              Assessment Submitted
            </DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              You'll be notified of the assessment & decision memo in 24 hours via email.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Link href="/">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Return to Home
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-1">MarginMix</h3>
            <p className="text-xs sm:text-sm italic text-gray-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>Margin Risk Clarity</p>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">
              MarginMix is a decision system for margin governance — not a delivery or productivity platform.
            </p>
            <p className="text-gray-400 text-sm mb-2">
              MarginMix is a Digital Lexicon Corp brand.
            </p>
            <p className="text-gray-400 text-sm mb-2">
              Digital Lexicon, Delaware, DE
            </p>
            <p className="text-gray-400 text-sm">
              © 2026 Digital Lexicon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
