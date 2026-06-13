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
import WalletRedirect from "./pages/WalletRedirect";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LISTING_OWNER_ROLES, AGENT_ROLES, ADMIN_ROLES, LAWYER_ROLES } from "./lib/roles";
import PropertyComparison from "./pages/PropertyComparison";
import MapView from "./pages/MapView";
import SearchMap from "./pages/SearchMap";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import CompanyAuth from "./pages/CompanyAuth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ContactUs from "./pages/ContactUs";
import ProfileEdit from "./pages/ProfileEdit";
import PromotionSetup from "./pages/PromotionSetup";
import PromotionCallback from "./pages/PromotionCallback";
import ViewingPaymentCallback from "./pages/ViewingPaymentCallback";
import AgentWallet from "./pages/AgentWallet";
import NotFound from "./pages/NotFound";
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

const queryClient = new QueryClient();

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/landlord/dashboard"
                element={
                  <ProtectedRoute roles={LISTING_OWNER_ROLES}>
                    <LandlordDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agent/dashboard"
                element={
                  <ProtectedRoute roles={AGENT_ROLES}>
                    <AgentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lawyer/dashboard"
                element={
                  <ProtectedRoute roles={[...LAWYER_ROLES, ...ADMIN_ROLES]}>
                    <LawyerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/wallet" element={<WalletRedirect />} />
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
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/compare" element={<PropertyComparison />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/search-map" element={<SearchMap />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/company" element={<CompanyAuth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/contact" element={<ContactUs />} />
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
