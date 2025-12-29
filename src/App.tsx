import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import HouseDetails from "./pages/HouseDetails";
import AgentProfile from "./pages/AgentProfile";
import AgentCatalogue from "./pages/AgentCatalogue";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import UserDashboard from "./pages/UserDashboard";
import PropertyComparison from "./pages/PropertyComparison";
import MapView from "./pages/MapView";
import SearchMap from "./pages/SearchMap";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ContactUs from "./pages/ContactUs";
import ProfileEdit from "./pages/ProfileEdit";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/house/:id" element={<HouseDetails />} />
            <Route path="/agent/:id" element={<AgentProfile />} />
            <Route path="/agents/:id" element={<AgentProfile />} />
            <Route path="/agents/:id/catalogue" element={<AgentCatalogue />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/compare" element={<PropertyComparison />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/search-map" element={<SearchMap />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contact" element={<ContactUs />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
