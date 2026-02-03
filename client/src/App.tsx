import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";

import LocationList from "@/pages/LocationList";
import LocationDetail from "@/pages/LocationDetail";
import CreateLocation from "@/pages/CreateLocation";
import EditLocation from "@/pages/EditLocation";
import MapView from "@/pages/MapView";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LocationList} />
      <Route path="/map" component={MapView} />
      <Route path="/new" component={CreateLocation} />
      <Route path="/locations/:id" component={LocationDetail} />
      <Route path="/locations/:id/edit" component={EditLocation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-background text-foreground font-sans">
        {/* Navigation Sidebar/Bottom Bar */}
        <Navigation />

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden w-full">
          <div className="max-w-6xl mx-auto">
            <Router />
          </div>
        </main>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
