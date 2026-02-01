import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import BooksNotReadPage from "@/pages/books-not-read";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import CookiesPage from "@/pages/cookies";
import FAQPage from "@/pages/faq";
import DashboardPage from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BooksNotReadPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/cookies" component={CookiesPage} />
      <Route path="/faq" component={FAQPage} />
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
