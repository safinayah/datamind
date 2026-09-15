import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ProjectAFIS from "./pages/ProjectAFIS";
import ProjectMizan from "./pages/ProjectMizan";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import DataImpactGenerator from "./pages/DataImpactGenerator";
import DataImpactReport from "./pages/DataImpactReport";
import ChatBot from "./components/ChatBot";
import { useLocation } from "wouter";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/about"} component={About} />
      <Route path={"/projects/afis"} component={ProjectAFIS} />
      <Route path={"/projects/mizan"} component={ProjectMizan} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/chat/:id"} component={Chat} />
      <Route path={"/impact"} component={DataImpactGenerator} />
      <Route path={"/impact-report/:token"} component={DataImpactReport} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ChatBotConditional() {
  const [location] = useLocation();
  if (location.startsWith("/chat") || location.startsWith("/dashboard") || location.startsWith("/impact")) return null;
  return <ChatBot />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatBotConditional />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
