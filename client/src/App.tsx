import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { useEffect, lazy, Suspense } from "react";
import {
  ClerkProvider,
  Show,
  SignIn,
  SignUp,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { CookieConsent } from "@/components/cookie-consent";
import { BrandName } from "@/components/brand-name";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { pageVariants } from "@/components/motion-variants";
import { RouteMetadata } from "@/components/route-metadata";

const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Assessment = lazy(() => import("@/pages/assessment"));
const QuickProfiler = lazy(() => import("@/pages/quick-profiler"));
const FreeTierCalculator = lazy(() => import("@/pages/free-tier-calculator"));
const FreeTierCalculatorOutput = lazy(() => import("@/pages/free-tier-calculator-output"));
const Platform = lazy(() => import("@/pages/platform"));
const AuditQuestions = lazy(() => import("@/pages/audit-questions"));
const Founder = lazy(() => import("@/pages/founder"));
const WhyChoose = lazy(() => import("@/pages/why-choose"));
const PitchDeck = lazy(() => import("@/pages/pitch"));
const NotFound = lazy(() => import("@/pages/not-found"));

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#059669",
    colorForeground: "#183b37",
    colorMutedForeground: "#60776f",
    colorDanger: "#dc2626",
    colorBackground: "#fffefa",
    colorInput: "#f5f3eb",
    colorInputForeground: "#183b37",
    colorNeutral: "#dce5dc",
    fontFamily: "Open Sans, ui-sans-serif, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#fffefa] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#dce5dc]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900",
    headerSubtitle: "text-slate-600",
    socialButtonsBlockButtonText: "text-slate-700",
    formFieldLabel: "text-slate-700",
    footerActionLink: "text-emerald-700",
    footerActionText: "text-slate-600",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-emerald-700",
    formFieldSuccessText: "text-emerald-700",
    alertText: "text-slate-700",
    logoBox: "mb-3",
    logoImage: "h-11 w-auto",
    socialButtonsBlockButton: "border-slate-200 hover:bg-emerald-50",
    formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700",
    formFieldInput: "border-slate-300 bg-slate-50 text-slate-900",
    footerAction: "bg-slate-50",
    dividerLine: "bg-slate-200",
    alert: "bg-emerald-50 border-emerald-200",
    otpCodeFieldInput: "border-slate-300",
    formFieldRow: "mb-4",
    main: "gap-5",
  },
};

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/sign-in" />;
  return <Component />;
}

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

function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f5f3eb]">
      <Header />
      <div className="h-16" aria-hidden="true" />
      <main className="mm-auth relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-[#f5f3eb] px-4 py-12">
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[#153e38] shadow-[0_28px_80px_rgba(20,62,55,.18)] lg:grid-cols-[1fr_500px]">
        <section className="mm-grid relative hidden min-h-[660px] flex-col justify-between p-12 text-[#f5f3eb] lg:flex">
          <div><BrandName className="mm-brand-pad text-2xl" /><p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#a9c7bb]">Margin risk clarity</p></div>
          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d5e96c]">A clearer decision starts here</p>
            <p className="mt-4 text-4xl font-extrabold leading-tight tracking-[-.045em]">Know what the work will really ask of your margin.</p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#bed2c8]">Sign in to continue to your workspace.</p>
          </div>
          <p className="text-xs text-[#94b0a5]">Decision support for agency and consulting leaders</p>
        </section>
        <div className="flex min-h-[600px] items-center justify-center bg-[#f5f3eb] p-5 sm:p-10">
          <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] bg-[#f5f3eb]">
      <Header />
      <div className="h-16" aria-hidden="true" />
      <main className="mm-auth relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-[#f5f3eb] px-4 py-12">
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[#153e38] shadow-[0_28px_80px_rgba(20,62,55,.18)] lg:grid-cols-[1fr_500px]">
        <section className="mm-grid relative hidden min-h-[660px] flex-col justify-between p-12 text-[#f5f3eb] lg:flex">
          <div><BrandName className="mm-brand-pad text-2xl" /><p className="mt-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#a9c7bb]">Margin risk clarity</p></div>
          <div className="relative z-10 max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d5e96c]">Make the decision visible</p>
            <p className="mt-4 text-4xl font-extrabold leading-tight tracking-[-.045em]">Build more clarity into the work you take on.</p>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#bed2c8]">Create an account to start making clearer margin decisions.</p>
          </div>
          <p className="text-xs text-[#94b0a5]">Decision support for agency and consulting leaders</p>
        </section>
        <div className="flex min-h-[600px] items-center justify-center bg-[#f5f3eb] p-5 sm:p-10">
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function DashboardRoute() {
  return <ProtectedRoute component={Dashboard} />;
}

function HomeRoute() {
  return <ProtectedRoute component={Home} />;
}

function Router() {
  const [location] = useLocation();
  const shouldReduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        variants={shouldReduce ? undefined : pageVariants}
        initial={shouldReduce ? false : "initial"}
        animate={shouldReduce ? undefined : "animate"}
        exit={shouldReduce ? undefined : "exit"}
      >
        <Suspense fallback={<PageLoader />}>
          <Switch location={location}>
            <Route path="/" component={HomeRedirect} />
            <Route path="/platform" component={Platform} />
            <Route path="/quick-profiler" component={QuickProfiler} />
            <Route path="/free-tier/calculator/output" component={FreeTierCalculatorOutput} />
            <Route path="/free-tier/calculator" component={FreeTierCalculator} />
            <Route path="/free-tier/input" component={FreeTierCalculator} />
            <Route path="/audit-questions" component={AuditQuestions} />
            <Route path="/assessment" component={Assessment} />
            <Route path="/demo" component={Assessment} />
            <Route path="/founder" component={Founder} />
            <Route path="/why-choose" component={WhyChoose} />
            <Route path="/auth"><Redirect to="/sign-in" /></Route>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/pitch" component={PitchDeck} />

            <Route path="/dashboard" component={DashboardRoute} />
            <Route path="/home" component={HomeRoute} />
            
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access your workspace",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start making margin decisions with clarity",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ScrollToTop />
          <RouteMetadata />
          <Toaster />
          <Router />
          <CookieConsent />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
