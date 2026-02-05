import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import LocationList from "@/pages/LocationList";
import LocationDetail from "@/pages/LocationDetail";
import CreateLocation from "@/pages/CreateLocation";
import EditLocation from "@/pages/EditLocation";
import MapView from "@/pages/MapView";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={LocationList} />
      <ProtectedRoute path="/map" component={MapView} />
      <ProtectedRoute path="/new" component={CreateLocation} />
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
