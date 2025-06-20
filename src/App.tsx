import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppPreferences } from "./contexts/AppPreferencesContext";
import { cn } from "@/lib/utils";

import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Symptoms from "./pages/Symptoms";
import Pregnancy from "./pages/Pregnancy";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/notifications";
import { Navbar } from "./components/navbar";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppPreferencesProvider } from "./contexts/AppPreferencesContext";
import { ThemeApplier } from "./contexts/ThemeApplier";

const queryClient = new QueryClient();

// New component to wrap the main application content that uses AppPreferencesContext
const MainAppContent = () => {
  const { i18n } = useTranslation();
  const { compactView } = useAppPreferences(); // Now called within the provider's scope

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className={cn("min-h-screen bg-background text-foreground px-4 py-6 md:px-8 lg:px-12", { "compact-mode": compactView })}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index key={i18n.language} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar key={i18n.language} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptoms"
            element={
              <ProtectedRoute>
                <Symptoms key={i18n.language} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pregnancy"
            element={
              <ProtectedRoute>
                <Pregnancy key={i18n.language} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <Insights key={i18n.language} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile key={i18n.language} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications key={i18n.language} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Navbar />
      </div>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppPreferencesProvider>
          <ThemeApplier />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <MainAppContent /> {/* Render the new component here */}
          </TooltipProvider>
        </AppPreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
