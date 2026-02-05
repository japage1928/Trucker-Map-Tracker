import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell, MapPin, Volume2 } from "lucide-react";
import { getVoiceGender, setVoiceGender, type VoiceGender, speakText } from "@/lib/voiceSettings";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const [voiceGender, setVoiceGenderState] = useState<VoiceGender>("female");

  useEffect(() => {
    setVoiceGenderState(getVoiceGender());
  }, []);

  const handleVoiceChange = (gender: VoiceGender) => {
    setVoiceGenderState(gender);
    setVoiceGender(gender);
    speakText("This is how I'll sound now, driver.", {});
  };

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
          <div>
            <p className="text-gray-400 text-sm">Logged in as</p>
            <p className="text-lg font-medium">{user?.username || "Unknown"}</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            AI Voice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400 text-sm">Choose how the AI assistant sounds when speaking</p>
          <div className="flex gap-3">
            <Button
              variant={voiceGender === "female" ? "default" : "outline"}
              onClick={() => handleVoiceChange("female")}
              className="flex-1"
            >
              Female
            </Button>
            <Button
              variant={voiceGender === "male" ? "default" : "outline"}
              onClick={() => handleVoiceChange("male")}
              className="flex-1"
            >
              Male
            </Button>
          </div>
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
    </div>
  );
}
