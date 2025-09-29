import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Bell, Menu, Moon } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', document.documentElement.classList.contains('dark').toString());
  };

  return (
    <header className="w-full bg-card border-b border-border">
      <div className="relative z-10 flex-shrink-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <Button
            data-testid="button-mobile-menu"
            variant="ghost"
            size="sm"
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <div className="ml-4 lg:ml-0">
            <h1 data-testid="text-header-title" className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p data-testid="text-header-subtitle" className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            data-testid="button-notifications"
            variant="ghost"
            size="sm"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md relative"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full"></span>
          </Button>

          {/* Theme Toggle */}
          <Button
            data-testid="button-theme-toggle"
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
          >
            <Moon className="h-6 w-6" />
          </Button>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <Button
                data-testid="button-user-menu"
                variant="ghost"
                size="sm"
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
