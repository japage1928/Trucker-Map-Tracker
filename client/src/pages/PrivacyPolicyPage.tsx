import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
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
                This app is built by an independent developer and is intended to provide parking likelihood information for truck drivers.
              </p>

              <section>
                <h2 className="text-lg font-bold mb-3">Information We Collect</h2>
                <p className="text-sm leading-relaxed mb-2">
                  We collect limited data to make the app function properly:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>
                    <strong>Location data</strong> – used only while the app is open and active, to determine proximity to truck stops and estimate parking likelihood.
                  </li>
                  <li>
                    <strong>Time context</strong> – such as time of day and day of week.
                  </li>
                  <li>
                    <strong>Anonymous usage signals</strong> – aggregated counts used to improve parking predictions.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">What We Do NOT Collect</h2>
                <p className="text-sm leading-relaxed mb-2">We do not collect:</p>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>Background or continuous location data</li>
                  <li>Personal information (name, email, phone number)</li>
                  <li>User accounts or identities</li>
                  <li>Precise movement history</li>
                  <li>Device identifiers for tracking</li>
                  <li>Data when the app is closed or inactive</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">How We Use Data</h2>
                <p className="text-sm leading-relaxed mb-2">
                  Collected data is used solely to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>Estimate parking likelihood based on time patterns and aggregated activity</li>
                  <li>Improve app functionality and accuracy over time</li>
                </ul>
                <p className="text-sm leading-relaxed mt-2">
                  All data is processed in aggregate and is not tied to individual users.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Data Sharing</h2>
                <p className="text-sm leading-relaxed">
                  We do not sell, rent, or share data with advertisers or third parties.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">User Control</h2>
                <ul className="list-disc list-inside space-y-2 text-sm pl-4">
                  <li>Location permission is optional and can be denied or revoked at any time.</li>
                  <li>The app will continue to function with reduced accuracy if location access is denied.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Changes</h2>
                <p className="text-sm leading-relaxed">
                  This policy may be updated as the app evolves. Any changes will be reflected on this page.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-3">Contact</h2>
                <p className="text-sm leading-relaxed">
                  If you have questions about this Privacy Policy, contact:
                </p>
                <p className="text-sm text-primary mt-2">
                  japage628@gmail.com
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
