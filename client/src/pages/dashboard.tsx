import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { User, LogOut, Building2, Target, Sparkles, BarChart3, Heart, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import type { User as UserType } from "@shared/schema";

interface BrandBrief {
  brand_name: string;
  industry_category: string;
  top_3_usps: string[];
  complexity_score: number;
}

export default function Dashboard() {
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [brandBrief, setBrandBrief] = useState<BrandBrief | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);
  const { user, logout, isLoggingOut, isAuthenticated } = useAuth();
  
  const typedUser = user as UserType | undefined;

  useEffect(() => {
    const storedBrief = sessionStorage.getItem('brandBrief');
    const storedUrl = sessionStorage.getItem('analyzedUrl');
    
    if (storedBrief) {
      try {
        setBrandBrief(JSON.parse(storedBrief));
      } catch (e) {
        console.error('Failed to parse brand brief:', e);
      }
    }
    
    if (storedUrl) {
      setAnalyzedUrl(storedUrl);
    }
  }, []);

  useActivityTracker({
    onInactivityTimeout: () => {
      console.log('User inactive for 5 minutes - auto logout');
      handleLogout();
    },
    timeoutMinutes: 5,
    isActive: isAuthenticated
  });

  const handleLogout = async () => {
    try {
      await logout();
      setShowThankYouModal(true);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleThankYouClose = () => {
    setShowThankYouModal(false);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                Margin Mix Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{typedUser?.firstName} {typedUser?.lastName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"></div>
            </div>
            <div className="relative">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
                Welcome back, {typedUser?.firstName}!
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Your Margin Mix Financial Reasoning Engine is ready
              </p>
            </div>
          </div>
        </div>

        {brandBrief ? (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Brand Analysis Complete</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {brandBrief.brand_name}
              </h2>
              {analyzedUrl && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Analyzed from: <span className="text-emerald-600 dark:text-emerald-400">{analyzedUrl}</span>
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    Industry Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-industry">
                    {brandBrief.industry_category}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Complexity Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-emerald-600" data-testid="text-complexity-score">
                      {brandBrief.complexity_score}
                    </span>
                    <span className="text-gray-500">/ 10</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {brandBrief.complexity_score <= 3 ? 'Simple' : brandBrief.complexity_score <= 6 ? 'Moderate' : 'Complex'} product/service offering
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Top 3 Unique Selling Propositions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {brandBrief.top_3_usps.map((usp, index) => (
                    <li key={index} className="flex items-start gap-3" data-testid={`text-usp-${index}`}>
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{usp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Margin Analysis Coming Soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
                    The full Workforce Intensity Matrix and margin optimization features are being developed.
                  </p>
                  <Link href="/">
                    <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-analyze-new">
                      Analyze Another Brand
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No Brand Analysis Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Enter your client's website URL on the homepage to get started with brand analysis.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="button-go-home">
                Go to Homepage
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Dialog open={showThankYouModal} onOpenChange={setShowThankYouModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-emerald-500" />
              Thank You!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for using Margin Mix! We hope our Financial Reasoning Engine helped you protect your agency's margins.
            </p>
            <Button 
              onClick={handleThankYouClose}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-thank-you-close"
            >
              Continue to Homepage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
