import { Link, useLocation } from "wouter";
import { Map, List, Truck, LogOut, Navigation2, Bot, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email || "Driver";

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/list", icon: List, label: "List" },
    { href: "/map", icon: Map, label: "Map" },
    { href: "/chat", icon: Bot, label: "AI" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 border-r border-border bg-card fixed h-full z-20">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-white">
            TRUCKER<span className="text-primary"> BUDDY</span>
          </span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 cursor-pointer group",
                  location === item.href 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", location === item.href ? "text-primary-foreground" : "group-hover:text-primary")} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-border/50">
          {user && (
            <div className="flex items-center gap-2 mb-3">
              {user.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-muted-foreground truncate">
                {displayName}
              </span>
            </div>
          )}
          <a href="/api/logout" className="block">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </a>
        </div>
      </nav>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 pb-safe">
        <div className="flex items-center h-16">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="flex-1">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-colors cursor-pointer",
                  location === item.href 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", location === item.href && "fill-current/20")} />
                <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
              </div>
            </Link>
          ))}
          <a
            href="/api/logout"
            className="flex-1 flex flex-col items-center justify-center h-full gap-1 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Logout</span>
          </a>
        </div>
      </nav>
    </>
  );
}
