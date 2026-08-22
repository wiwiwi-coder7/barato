import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BIRTHDAY_ROUTE } from "@/lib/birthday";
import { Route, Router as WouterRouter, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import AdminPage from "./pages/AdminPage";
import BirthdayPage from "./pages/BirthdayPage";
import GiftPage from "./pages/GiftPage";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path={BIRTHDAY_ROUTE} component={BirthdayPage} />
        <Route path="/gift/:token" component={GiftPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LocaleProvider><TooltipProvider><Toaster richColors position="top-center" /><Router /></TooltipProvider></LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
