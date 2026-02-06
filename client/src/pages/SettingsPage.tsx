import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell, MapPin, Shield, FileText, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { HOSTracker } from "@/components/HOSTracker";

export default function SettingsPage() {
  const { user } = useAuth();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email || "Driver";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-500">Settings</h1>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            {user?.profileImageUrl && (
              <img
                src={user.profileImageUrl}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <p className="text-lg font-medium">{displayName}</p>
              {user?.email && (
                <p className="text-gray-400 text-sm">{user.email}</p>
              )}
            </div>
          </div>
          <a href="/api/logout" className="block">
            <Button
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </a>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Coming soon: Weather alerts, parking availability notifications</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Coming soon: Default map view, preferred truck stops</p>
        </CardContent>
      </Card>

      <HOSTracker />

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Legal & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/privacy">
            <Button variant="ghost" className="w-full justify-between text-left">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Privacy Policy
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/terms">
            <Button variant="ghost" className="w-full justify-between text-left">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Terms of Service
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Location is used only while the app is open to estimate parking availability. Data is aggregated and not tied to individuals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
