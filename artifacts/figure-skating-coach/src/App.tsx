import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";

import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Athletes from "@/pages/athletes";
import AthleteDetail from "@/pages/athlete-detail";
import Sessions from "@/pages/sessions";
import SessionDetail from "@/pages/session-detail";
import NewSession from "@/pages/new-session";
import Training from "@/pages/training";
import TrainingDetail from "@/pages/training-detail";
import NewTraining from "@/pages/new-training";
import Rules from "@/pages/rules";
import RuleDetail from "@/pages/rule-detail";
import PhysicsLab from "@/pages/physics-lab";

// The analytics page bundles ~0.4 MB of competition data, so load it on demand.
const OlympicAnalytics = lazy(() => import("@/pages/olympic-analytics"));

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/athletes" component={Athletes} />
        <Route path="/athletes/:id" component={AthleteDetail} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/sessions/new" component={NewSession} />
        <Route path="/sessions/:id" component={SessionDetail} />
        <Route path="/training" component={Training} />
        <Route path="/training/new" component={NewTraining} />
        <Route path="/training/:id" component={TrainingDetail} />
        <Route path="/rules" component={Rules} />
        <Route path="/rules/:id" component={RuleDetail} />
        <Route path="/physics" component={PhysicsLab} />
        <Route path="/analytics">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <OlympicAnalytics />
          </Suspense>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
