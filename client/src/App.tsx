import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { useTripAutoTracking } from "@/hooks/use-trip-auto-tracking";

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
import LandingPage from "@/pages/LandingPage";
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
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  useTripAutoTracking(Boolean(user));
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Navigation />
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden w-full">
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
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
