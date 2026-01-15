import { Button } from "@/components/ui/button";
import { ArrowRight, User, LogOut, AlertTriangle, CheckCircle, XCircle, Users, Building2, Briefcase, Target } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 dark:bg-emerald-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200/30 dark:bg-teal-700/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-100/20 to-teal-100/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-3xl"></div>
      </div>

      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">MarginMix</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                    <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white" data-testid="text-username">
                        {(user as any).firstName} {(user as any).lastName}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400" data-testid="text-email">
                        {(user as any).email}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Most <span className="text-emerald-600 dark:text-emerald-400">Agencies/Consultancies</span> lose margin long before delivery begins.
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              MarginMix helps agency and consulting leaders assess margin risk early — by accounting for hidden senior effort, coordination overhead, and workforce intensity.
            </p>
            <Button 
              size="lg" 
              className="h-14 text-lg px-8 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              data-testid="button-cta-hero"
            >
              Run a Margin Risk Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="mt-6 text-xl font-bold">
              <p className="text-red-600 dark:text-red-400">Not a Tool!</p>
              <p className="text-emerald-600 dark:text-emerald-400">A Decision Support System</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why margin surprises keep happening */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Why margin surprises keep happening
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 text-center">
              Margin loss in professional services is rarely caused by poor execution.<br />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">It is usually structural.</span>
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Senior involvement increases quietly as complexity grows
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Coordination, rework, and decision churn are not priced into fees
                </p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 dark:text-gray-300 text-lg">
                  Portfolio smoothing hides losses until it's too late
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What MarginMix actually does */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              What MarginMix actually does
            </h2>
            <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300">
              <p className="text-center">
                MarginMix is <span className="font-semibold">not</span> a productivity tool.
              </p>
              <p className="text-center text-xl font-medium text-gray-900 dark:text-white">
                It is a decision-support system for senior leaders approving work.
              </p>
              <p className="text-center">
                MarginMix evaluates whether an engagement is economically viable before delivery begins — using a workforce-intensity lens that makes shadow labour visible.
              </p>
              <p className="text-center text-emerald-600 dark:text-emerald-400 font-semibold text-xl">
                This is about better decisions, not better task execution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who this is designed for */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Who this is designed for
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-6 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Designed for:
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">Agencies and consultancies with 500–5,000 employees</span>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">Leadership teams approving fixed-fee or retainer work</span>
                </li>
                <li className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">CFOs, COOs, Managing Partners, and Client Leads</span>
                </li>
                <li className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 dark:text-gray-300">Firms where scale has outgrown intuition</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2">
                <XCircle className="h-6 w-6" />
                Not designed for:
              </h3>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-3">
                  <span className="text-gray-400">•</span>
                  <span>Small teams where founders still see everything</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400">•</span>
                  <span>Productivity tracking or utilisation management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-400">•</span>
                  <span>Delivery optimisation, task management, or dashboards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How the Margin Risk Assessment works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            How the Margin Risk Assessment works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                You describe the intended structure of an engagement
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                MarginMix evaluates workforce intensity and shadow labour risk
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                You receive a clear margin-risk verdict with decision guidance
              </p>
            </div>
          </div>
          <p className="text-center text-emerald-600 dark:text-emerald-400 mt-8 text-lg font-bold">
            This is an assessment of economic viability — not a delivery forecast.
          </p>
        </div>
      </section>

      {/* Example output */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Example output
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-900 dark:bg-gray-950 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-wide">Margin Risk Verdict</p>
                  <p className="text-2xl font-bold text-amber-500">At Risk</p>
                </div>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>
                  Even if delivery meets expectations, this engagement is likely to lose margin due to unplanned senior involvement and coordination overhead.
                </p>
                <p>
                  The proposed structure assumes a level of containment that is unlikely given stakeholder complexity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why MarginMix exists */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Why MarginMix exists
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
              MarginMix is built from lived agency and consulting experience — where margin loss isn't theoretical, it's experienced.
            </p>
            <p className="text-xl text-emerald-600 dark:text-emerald-400 font-semibold">
              It exists to surface economic truth early, while decisions can still be changed.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-emerald-600 dark:bg-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Assess margin risk before it becomes a problem.
            </h2>
            <Button 
              size="lg" 
              className="h-14 text-lg px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
              data-testid="button-cta-footer"
            >
              Run a Margin Risk Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-emerald-100 mt-4 text-sm">
              Early access assessments are reviewed for fit.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-emerald-400 mb-4">MarginMix</h3>
            <p className="text-gray-300 mb-6">
              MarginMix is a decision system for margin governance — not a delivery or productivity platform.
            </p>
            <p className="text-gray-400 text-sm mb-2">
              MarginMix is a Digital Lexicon Corp brand.
            </p>
            <p className="text-gray-400 text-sm mb-2">
              Digital Lexicon, Delaware, DE
            </p>
            <p className="text-gray-400 text-sm">
              © 2025 Digital Lexicon. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
