import { Switch, Route, useLocation } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Assessment = lazy(() => import("@/pages/assessment"));
const QuickProfiler = lazy(() => import("@/pages/quick-profiler"));
const Founder = lazy(() => import("@/pages/founder"));
const WhyChoose = lazy(() => import("@/pages/why-choose"));
const AuthPage = lazy(() => import("@/pages/auth").then(m => ({ default: m.AuthPage })));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Landing page loaded eagerly for fast first paint */}
        <Route path="/" component={Landing} />
        
        {/* All other pages lazy-loaded */}
        <Route path="/quick-profiler" component={QuickProfiler} />
        <Route path="/assessment" component={Assessment} />
        <Route path="/founder" component={Founder} />
        <Route path="/why-choose" component={WhyChoose} />
        <Route path="/auth" component={AuthPage} />
        
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/home" component={Home} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
