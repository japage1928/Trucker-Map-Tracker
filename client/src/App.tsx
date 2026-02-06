import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import HomePage from "@/pages/HomePage";
import LocationList from "@/pages/LocationList";
import LocationDetail from "@/pages/LocationDetail";
import EditLocation from "@/pages/EditLocation";
import MapView from "@/pages/MapView";
import TrackingView from "@/pages/TrackingView";
import DrivingScreen from "@/pages/DrivingScreen";
import ChatPage from "@/pages/ChatPage";
import SettingsPage from "@/pages/SettingsPage";
import HOSPage from "@/pages/HOSPage";
import TripsPage from "@/pages/TripsPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/list" component={LocationList} />
      <ProtectedRoute path="/map" component={MapView} />
      <ProtectedRoute path="/drive" component={DrivingScreen} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/hos" component={HOSPage} />
      <ProtectedRoute path="/trips" component={TripsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/privacy" component={PrivacyPolicyPage} />
      <ProtectedRoute path="/terms" component={TermsOfServicePage} />
      <ProtectedRoute path="/locations/:id" component={LocationDetail} />
      <ProtectedRoute path="/locations/:id/edit" component={EditLocation} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Only show navigation when logged in */}
      {user && <Navigation />}

      {/* Main Content Area */}
      <main className={`flex-1 ${user ? 'md:ml-64' : ''} p-4 md:p-8 overflow-x-hidden w-full`}>
        <div className="max-w-6xl mx-auto">
          <Router />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
