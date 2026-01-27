import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Assessment from "@/pages/assessment";
import Founder from "@/pages/founder";
import { AuthPage } from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/assessment" component={Assessment} />
      <Route path="/founder" component={Founder} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Dashboard - displays brand analysis results */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/home" component={Home} />
      
      <Route component={NotFound} />
    </Switch>
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
