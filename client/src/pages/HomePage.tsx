import type { ReactNode } from "react";
import { useLocation } from "wouter";
import { MessageSquare, Map, List, Settings } from "lucide-react";

interface DashboardButton {
  icon: ReactNode;
  label: string;
  path: string;
  color: string;
}

const dashboardButtons: DashboardButton[] = [
  {
    icon: <MessageSquare className="w-12 h-12" />,
    label: "AI",
    path: "/chat",
    color: "bg-amber-600 hover:bg-amber-500",
  },
  {
    icon: <Map className="w-12 h-12" />,
    label: "Map",
    path: "/map",
    color: "bg-blue-600 hover:bg-blue-500",
  },
  {
    icon: <List className="w-12 h-12" />,
    label: "POIs",
    path: "/list",
    color: "bg-green-600 hover:bg-green-500",
  },
  {
    icon: <Settings className="w-12 h-12" />,
    label: "Settings",
    path: "/settings",
    color: "bg-gray-600 hover:bg-gray-500",
  },
];

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <h1 className="text-3xl font-bold text-amber-500 mb-2">TRUCKER BUDDY</h1>
      <p className="text-gray-400 mb-8">Your AI co-pilot on the road</p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {dashboardButtons.map((button) => (
          <button
            key={button.path}
            onClick={() => setLocation(button.path)}
            className={`${button.color} flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg`}
          >
            {button.icon}
            <span className="mt-2 text-lg font-semibold">{button.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
