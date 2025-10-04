import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      onClick={toggleTheme}
      variant="ghost" 
      size="sm" 
      className="card-standard border border-border/50 hover:border-primary/50 transition-colors w-10 h-10 p-0"
      data-testid="theme-toggle"
      title={theme === 'light' ? 'Gece moduna geç' : 'Gündüz moduna geç'}
    >
      {theme === 'light' ? (
        <Sun className="w-4 h-4 text-primary" />
      ) : (
        <Moon className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
}