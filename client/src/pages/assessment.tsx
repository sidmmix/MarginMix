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
import { ArrowLeft, Send } from "lucide-react";

const assessmentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  workEmail: z.string().email("Valid email is required"),
  roleTitle: z.string().min(1, "Role/Title is required"),
  organisationName: z.string().min(1, "Organisation name is required"),
  organisationSize: z.string().min(1, "Please select organisation size"),
  engagementType: z.string().min(1, "Please select engagement type"),
  engagementDuration: z.string().min(1, "Please select engagement duration"),
  clientVolatility: z.string().min(1, "Please select client volatility"),
  stakeholderComplexity: z.string().min(1, "Please select stakeholder complexity"),
  seniorLeadershipInvolvement: z.string().min(1, "Please select senior leadership involvement"),
  midLevelOversight: z.string().min(1, "Please select mid-level oversight intensity"),
  executionThinkingMix: z.string().min(1, "Please select execution vs thinking mix"),
  iterationIntensity: z.string().min(1, "Please select iteration intensity"),
  scopeChangeLikelihood: z.string().min(1, "Please select scope change likelihood"),
  crossFunctionalCoordination: z.string().min(1, "Please select cross-functional coordination"),
  openSignal: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export default function Assessment() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      fullName: "",
      workEmail: "",
      roleTitle: "",
      organisationName: "",
      organisationSize: "",
      engagementType: "",
      engagementDuration: "",
      clientVolatility: "",
      stakeholderComplexity: "",
      seniorLeadershipInvolvement: "",
      midLevelOversight: "",
      executionThinkingMix: "",
      iterationIntensity: "",
      scopeChangeLikelihood: "",
      crossFunctionalCoordination: "",
      openSignal: "",
    },
  });

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                MarginMix
              </span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Intro Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
              Margin Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p className="text-lg">Hi There,</p>
            <p className="font-semibold">Thank you for taking the first step.</p>
            <p>
              You're about to provide information for a <strong>Margin Risk Assessment</strong>.
            </p>
            <p>
              This assessment evaluates the economic viability of work by examining workforce intensity, 
              senior involvement, and coordination overhead — not delivery performance or individual productivity.
            </p>
            <p>
              You'll be asked <strong>16 short, judgement-based questions</strong>, all designed as simple 
              dropdown selections. The form takes approximately <strong>5 minutes</strong> to complete.
            </p>
            <p>
              Once submitted, a structured Margin Risk Assessment — including a clear margin-risk verdict 
              and decision guidance — will be prepared and delivered to the email you provide below.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-4 font-bold">
              No financial data, timesheets or individual performance information is required.<br />
              All Information is treated Confidentially. MarginMix is GDPR & CCPA compliant.
            </p>
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Let's begin.
            </p>
          </CardContent>
        </Card>

        {/* Assessment Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Section A: Contact & Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
                  A. Contact & Context
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

                {/* Q4: Organisation Name */}
                <FormField
                  control={form.control}
                  name="organisationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4. Organisation Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your organisation name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q5: Organisation Size - Dropdown */}
                <FormField
                  control={form.control}
                  name="organisationSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>5. Organisation Size</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organisation size" />
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
              </CardContent>
            </Card>

            {/* Section B: Client Engagement Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
                  B. Client Engagement Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q6: Engagement Type */}
                <FormField
                  control={form.control}
                  name="engagementType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6. Engagement Type</FormLabel>
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

                {/* Q7: Expected Engagement Duration */}
                <FormField
                  control={form.control}
                  name="engagementDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>7. Expected Engagement Duration</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select engagement duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="less-than-3-months">Less than 3 months</SelectItem>
                          <SelectItem value="3-6-months">3–6 months</SelectItem>
                          <SelectItem value="6-12-months">6–12 months</SelectItem>
                          <SelectItem value="12+-months">12+ months</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Q8: Client Volatility */}
                <FormField
                  control={form.control}
                  name="clientVolatility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>8. Client Volatility</FormLabel>
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
                      <FormLabel>9. Stakeholder Complexity</FormLabel>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
                  C. Planned Delivery Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q10: Senior Leadership Involvement */}
                <FormField
                  control={form.control}
                  name="seniorLeadershipInvolvement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>10. Planned Senior Leadership Involvement</FormLabel>
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
                      <FormLabel>11. Mid-Level Oversight Intensity</FormLabel>
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
                      <FormLabel>12. Execution vs Thinking Mix</FormLabel>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
                  D. Delivery Dynamics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Q13: Expected Iteration Intensity */}
                <FormField
                  control={form.control}
                  name="iterationIntensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>13. Expected Iteration Intensity</FormLabel>
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
                      <FormLabel>14. Likelihood of Scope Change</FormLabel>
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
                      <FormLabel>15. Cross-Functional Coordination Required</FormLabel>
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
              </CardContent>
            </Card>

            {/* Section E: Open Signal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-200">
                  E. Open Signal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Q16: Open Signal */}
                <FormField
                  control={form.control}
                  name="openSignal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        16. Is there anything about this particular client engagement that feels risky or unusual?
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
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-12"
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
              You'll be notified of the assessment in 24 hours via email.
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
    </div>
  );
}
