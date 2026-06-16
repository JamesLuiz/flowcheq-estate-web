import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Loader2 } from "lucide-react";
import { SplashScreen } from "@/components/SplashScreen";
import Index from "./pages/Index";
import HouseDetails from "./pages/HouseDetails";
import AgentProfile from "./pages/AgentProfile";
import AgentCatalogue from "./pages/AgentCatalogue";
import AgentsListing from "./pages/AgentsListing";
import AgentGuide from "./pages/AgentGuide";
import SharedProperties from "./pages/SharedProperties";
import Messages from "./pages/Messages";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { VerificationRequiredRoute } from "./components/VerificationRequiredRoute";
import { LISTING_OWNER_ROLES, AGENT_ROLES, ADMIN_ROLES, LAWYER_ROLES, YOUVERIFY_ACCOUNT_ROLES } from "./lib/roles";
import PropertyComparison from "./pages/PropertyComparison";
import MapView from "./pages/MapView";
import SearchMap from "./pages/SearchMap";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import CompanyAuth from "./pages/CompanyAuth";
import LawFirmAuth from "./pages/LawFirmAuth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ContactUs from "./pages/ContactUs";
import ProfileEdit from "./pages/ProfileEdit";
import PromotionSetup from "./pages/PromotionSetup";
import PromotionCallback from "./pages/PromotionCallback";
import ViewingPaymentCallback from "./pages/ViewingPaymentCallback";
import AgentWallet from "./pages/AgentWallet";
import AccountVerification from "./pages/AccountVerification";
import NotFound from "./pages/NotFound";
import AgentsAppDownload from "./pages/AgentsAppDownload";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

const Admin = lazy(() => import("./pages/Admin"));
const LandlordDashboard = lazy(() => import("./pages/LandlordDashboard"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const LawyerDashboard = lazy(() => import("./pages/LawyerDashboard"));
const Partners = lazy(() => import("./pages/Partners"));

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} minimumDisplayTime={2500} />
        )}
        <AuthProvider>
        <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/house/:id" element={<HouseDetails />} />
              <Route path="/agent/:id" element={<AgentProfile />} />
              <Route path="/agents" element={<AgentsListing />} />
              <Route path="/agents/:id" element={<AgentProfile />} />
              <Route path="/agents/:id/catalogue" element={<AgentCatalogue />} />
              <Route path="/agent-guide" element={<AgentGuide />} />
              <Route path="/shared-properties" element={<SharedProperties />} />
              <Route path="/messages" element={<Messages />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={ADMIN_ROLES}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="/verify-account" element={<AccountVerification />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/landlord/dashboard"
                element={
                  <VerificationRequiredRoute roles={LISTING_OWNER_ROLES}>
                    <LandlordDashboard />
                  </VerificationRequiredRoute>
                }
              />
              <Route
                path="/agent/dashboard"
                element={
                  <VerificationRequiredRoute roles={AGENT_ROLES}>
                    <AgentDashboard />
                  </VerificationRequiredRoute>
                }
              />
              <Route
                path="/lawyer/dashboard"
                element={
                  <VerificationRequiredRoute roles={[...LAWYER_ROLES, ...ADMIN_ROLES]}>
                    <LawyerDashboard />
                  </VerificationRequiredRoute>
                }
              />
              <Route
                path="/wallet"
                element={
                  <ProtectedRoute roles={[...YOUVERIFY_ACCOUNT_ROLES]}>
                    <AgentWallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/landlord/wallet"
                element={
                  <ProtectedRoute roles={LISTING_OWNER_ROLES}>
                    <AgentWallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/wallet"
                element={
                  <ProtectedRoute roles={AGENT_ROLES}>
                    <AgentWallet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-dashboard"
                element={
                  <VerificationRequiredRoute>
                    <UserDashboard />
                  </VerificationRequiredRoute>
                }
              />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/compare" element={<PropertyComparison />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/search-map" element={<SearchMap />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/company" element={<CompanyAuth />} />
              <Route path="/auth/law-firm" element={<LawFirmAuth />} />
              <Route path="/auth/lawfirm" element={<LawFirmAuth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/agents/app" element={<AgentsAppDownload />} />
              <Route path="/promotions/setup" element={<PromotionSetup />} />
              <Route path="/promotions/callback" element={<PromotionCallback />} />
              <Route path="/viewings/payment/callback" element={<ViewingPaymentCallback />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
        </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
