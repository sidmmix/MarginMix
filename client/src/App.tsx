import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import { AuthPage } from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function Router() {
  // Temporarily disable auth checking to fix infinite loop
  // const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
