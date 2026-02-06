import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfServicePage() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Terms of Service</h1>
        </div>
      </div>

      <Card className="bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Last updated: February 5, 2026
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="space-y-6 pr-4">
              <p className="text-sm leading-relaxed">
                By using this app, you agree to the following terms.
              </p>

              <section>
                <h2 className="text-lg font-bold mb-3">Purpose of the App</h2>
                <p className="text-sm leading-relaxed">
                  This app provides informational estimates about parking availability based on time patterns and aggregated signals. It does not guarantee parking availability.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">No Guarantees</h2>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>Parking likelihood results are estimates only.</li>
                  <li>Parking availability can change at any time.</li>
                  <li>The developer is not responsible if parking is unavailable.</li>
                  <li>You are solely responsible for your parking decisions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Limitation of Liability</h2>
                <p className="text-sm leading-relaxed mb-2">
                  The app is provided "as is." The developer is not liable for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>Missed parking opportunities</li>
                  <li>Fines, towing, or enforcement actions</li>
                  <li>Delays, losses, or damages related to parking decisions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Changes and Availability</h2>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>Features may change or be removed at any time.</li>
                  <li>The app may be updated, paused, or discontinued without notice.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Acceptable Use</h2>
                <p className="text-sm leading-relaxed mb-2">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>Abuse or attempt to reverse-engineer the app</li>
                  <li>Misuse the app in a way that could harm others or the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Governing Law</h2>
                <p className="text-sm leading-relaxed">
                  These terms are governed by the laws of the United States.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Contact</h2>
                <p className="text-sm leading-relaxed">
                  For questions regarding these terms:
                </p>
                <p className="text-sm text-primary mt-2">
                  [YOUR CONTACT EMAIL]
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
