import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Onboarding from "@/pages/auth/Onboarding";
import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "@/pages/dashboard/Dashboard";
import ContractList from "@/pages/contracts/ContractList";
import ContractNew from "@/pages/contracts/ContractNew";
import ContractDetail from "@/pages/contracts/ContractDetail";
import Milestones from "@/pages/contracts/Milestones";
import Performance from "@/pages/contracts/Performance";
import Sentiment from "@/pages/contracts/Sentiment";
import InvoiceList from "@/pages/invoices/InvoiceList";
import InvoiceNew from "@/pages/invoices/InvoiceNew";
import TaxDashboard from "@/pages/tax/TaxDashboard";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import IntegrationsSettings from "@/pages/settings/IntegrationsSettings";
import BillingSettings from "@/pages/settings/BillingSettings";
import ApiSettings from "@/pages/settings/ApiSettings";
import PublicReport from "@/pages/shared/PublicReport";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/shared/report/:token" component={PublicReport} />
      
      <Route path="/app/:rest*">
        <AppLayout>
          <Switch>
            <Route path="/app/dashboard" component={Dashboard} />
            <Route path="/app/contracts" component={ContractList} />
            <Route path="/app/contracts/new" component={ContractNew} />
            <Route path="/app/contracts/:id" component={ContractDetail} />
            <Route path="/app/contracts/:id/milestones" component={Milestones} />
            <Route path="/app/contracts/:id/performance" component={Performance} />
            <Route path="/app/contracts/:id/sentiment" component={Sentiment} />
            <Route path="/app/invoices" component={InvoiceList} />
            <Route path="/app/invoices/new" component={InvoiceNew} />
            <Route path="/app/tax" component={TaxDashboard} />
            <Route path="/app/settings/profile" component={ProfileSettings} />
            <Route path="/app/settings/integrations" component={IntegrationsSettings} />
            <Route path="/app/settings/billing" component={BillingSettings} />
            <Route path="/app/settings/api" component={ApiSettings} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
