import { Truck, MapPin, MessageSquare, Navigation, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-wider">
              TRUCKER<span className="text-primary"> BUDDY</span>
            </span>
          </div>
          <a href="/api/login">
            <Button size="sm">Sign In</Button>
          </a>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your AI Co-Pilot
            <br />
            <span className="text-primary">On the Road</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Real-time truck stop info, AI-powered routing assistance, and hands-free voice commands built for professional drivers.
          </p>
          <a href="/api/login">
            <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-primary/20">
              Get Started - Free
            </Button>
          </a>
          <p className="text-sm text-muted-foreground mt-4">No credit card required</p>
        </div>
      </section>

      <section className="py-20 px-6 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Built for the Long Haul
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<MapPin className="w-8 h-8 text-blue-400" />}
              title="1,500+ Stops"
              description="Real truck stops, rest areas, and parking mapped across the US."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-amber-400" />}
              title="AI Assistant"
              description="Voice-powered AI that knows HOS rules, truck routes, and CDL regs."
            />
            <FeatureCard
              icon={<Navigation className="w-8 h-8 text-purple-400" />}
              title="Driving HUD"
              description="See stops ahead in your direction of travel with distance readouts."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-green-400" />}
              title="Weather Alerts"
              description="Real-time severe weather warnings along your route."
            />
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border text-center text-sm text-muted-foreground">
        <p>Trucker Buddy &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background/50 hover:bg-background rounded-xl p-6 transition-colors duration-200 border border-border/50">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
